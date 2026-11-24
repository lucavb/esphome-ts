import {
    createCipheriv,
    createDecipheriv,
    createHash,
    createPrivateKey,
    createPublicKey,
    diffieHellman,
    generateKeyPairSync,
    hkdfSync,
    type KeyObject,
} from 'node:crypto';
import { InvalidEncryptionKeyFormatError } from './errors';

/**
 * Noise protocol machinery for ESPHome's one supported variant:
 *
 *   Noise_NNpsk0_25519_ChaChaPoly_SHA256
 *
 * The cryptographic primitives are Node's built-in implementations (X25519,
 * ChaCha20-Poly1305, SHA-256, HKDF). This module only composes them following
 * the published Noise specification; the cacophony test vector in the specs
 * pins the composition byte for byte.
 *
 * ESPHome additions on top of Noise live in frameCodec.ts: the outer frame
 * indicator/length and the "type + length + payload" plaintext layout.
 */

export const NOISE_PROTOCOL_NAME = 'Noise_NNpsk0_25519_ChaChaPoly_SHA256';
/**
 * ESPHome prologue: "NoiseAPIInit" plus the big-endian length (zero) of the
 * empty client-hello frame. It is fixed on the client side; the device builds
 * the same bytes from the first frame it receives.
 */
export const ESPHOME_NOISE_PROLOGUE = Buffer.from('NoiseAPIInit\x00\x00', 'binary');
export const NOISE_PSK_LENGTH = 32;
export const NOISE_DH_LENGTH = 32;
export const NOISE_TAG_LENGTH = 16;

const HASH_ALGORITHM = 'sha256';
const CIPHER_ALGORITHM = 'chacha20-poly1305';
const EMPTY_BUFFER = Buffer.alloc(0);
// Noise reserves 2^64-1 for Rekey; a transport message must never use it.
const MAX_NONCE = (1n << 64n) - 1n;

// Raw 32-byte X25519 keys need a DER wrapper before Node will import them.
const X25519_PKCS8_PREFIX = Buffer.from('302e020100300506032b656e04220420', 'hex');
const X25519_SPKI_PREFIX = Buffer.from('302a300506032b656e032100', 'hex');
const BASE64_KEY_PATTERN = /^[A-Za-z0-9+/=\s]+$/;

/** Internal failures raised by the Noise machinery, mapped to public errors by the frame codec. */
export class NoiseHandshakeError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'NoiseHandshakeError';
    }
}

/** AEAD authentication failed: a wrong PSK or a tampered message. */
export class NoiseAuthenticationError extends NoiseHandshakeError {
    constructor(message = 'Noise authentication failed', options?: ErrorOptions) {
        super(message, options);
        this.name = 'NoiseAuthenticationError';
    }
}

/**
 * The peer's ephemeral X25519 key is malformed or low-order. From the user's
 * perspective this is indistinguishable from a key that failed authentication,
 * so the frame codec treats it as a rejected key rather than a transient error.
 */
export class NoiseKeyAgreementError extends NoiseHandshakeError {
    constructor(message = 'Noise key agreement failed', options?: ErrorOptions) {
        super(message, options);
        this.name = 'NoiseKeyAgreementError';
    }
}

/** Decode ESPHome's base64 `api: encryption: key:` value and require exactly 32 bytes. */
export const parseNoisePsk = (key: string): Buffer => {
    const trimmed = key.trim();
    if (trimmed.length === 0 || !BASE64_KEY_PATTERN.test(trimmed)) {
        throw new InvalidEncryptionKeyFormatError();
    }
    const psk = Buffer.from(trimmed, 'base64');
    if (psk.length !== NOISE_PSK_LENGTH) {
        throw new InvalidEncryptionKeyFormatError();
    }
    if (psk.every((byte) => byte === 0)) {
        // ESPHome reserves the all-zero PSK as its unprovisioned sentinel; it
        // provides no protection and must never be treated as a real key.
        throw new InvalidEncryptionKeyFormatError('encryptionKey must not be the all-zero provisioning sentinel');
    }
    return psk;
};

const importX25519PrivateKey = (raw: Buffer): KeyObject => {
    if (raw.length !== NOISE_DH_LENGTH) {
        throw new NoiseHandshakeError(`X25519 private key must be ${NOISE_DH_LENGTH} bytes`);
    }
    return createPrivateKey({
        key: Buffer.concat([X25519_PKCS8_PREFIX, raw]),
        format: 'der',
        type: 'pkcs8',
    });
};

const importX25519PublicKey = (raw: Buffer): KeyObject => {
    if (raw.length !== NOISE_DH_LENGTH) {
        throw new NoiseHandshakeError(`X25519 public key must be ${NOISE_DH_LENGTH} bytes`);
    }
    return createPublicKey({
        key: Buffer.concat([X25519_SPKI_PREFIX, raw]),
        format: 'der',
        type: 'spki',
    });
};

const exportX25519PublicKey = (key: KeyObject): Buffer => {
    const der = key.export({ format: 'der', type: 'spki' });
    if (!Buffer.isBuffer(der) || der.length < NOISE_DH_LENGTH) {
        throw new NoiseHandshakeError('Unable to export an X25519 public key');
    }
    return Buffer.from(der.subarray(der.length - NOISE_DH_LENGTH));
};

const generateX25519KeyPair = (): { privateKey: KeyObject; publicKey: Buffer } => {
    const { publicKey, privateKey } = generateKeyPairSync('x25519');
    return { privateKey, publicKey: exportX25519PublicKey(publicKey) };
};

/** Build a deterministic X25519 key pair from a raw private key. Test-only entry point. */
export const importNoiseTestKey = (raw: Buffer): { privateKey: KeyObject; publicKey: Buffer } => {
    const privateKey = importX25519PrivateKey(raw);
    return { privateKey, publicKey: exportX25519PublicKey(createPublicKey(privateKey)) };
};

const computeDh = (privateKey: KeyObject, remotePublicKey: KeyObject): Buffer => {
    try {
        return diffieHellman({ privateKey, publicKey: remotePublicKey });
    } catch (error: unknown) {
        throw new NoiseKeyAgreementError('X25519 key agreement failed', { cause: error });
    }
};

/** Noise's HKDF: RFC 5869 with the chaining key as salt and an empty info parameter. */
function hkdf(chainingKey: Buffer, inputKeyMaterial: Buffer, outputs: 2): [Buffer, Buffer];
function hkdf(chainingKey: Buffer, inputKeyMaterial: Buffer, outputs: 3): [Buffer, Buffer, Buffer];
function hkdf(chainingKey: Buffer, inputKeyMaterial: Buffer, outputs: 2 | 3): [Buffer, Buffer, Buffer?] {
    const derived = Buffer.from(
        hkdfSync(HASH_ALGORITHM, inputKeyMaterial, chainingKey, EMPTY_BUFFER, NOISE_DH_LENGTH * outputs),
    );
    const first = derived.subarray(0, NOISE_DH_LENGTH);
    const second = derived.subarray(NOISE_DH_LENGTH, NOISE_DH_LENGTH * 2);
    if (outputs === 2) {
        return [first, second];
    }
    return [first, second, derived.subarray(NOISE_DH_LENGTH * 2, NOISE_DH_LENGTH * 3)];
}

/**
 * One direction of the transport. Nonce layout and AEAD usage follow Noise
 * section 5.1: 4 zero bytes followed by the 64-bit counter little-endian.
 */
export class CipherState {
    private key: Buffer | null = null;
    private nonce = 0n;

    public initializeKey(key: Buffer | null): void {
        this.key = key;
        this.nonce = 0n;
    }

    public hasKey(): boolean {
        return this.key !== null;
    }

    private nonceBuffer(): Buffer {
        const nonce = Buffer.alloc(12);
        nonce.writeBigUInt64LE(this.nonce, 4);
        return nonce;
    }

    public encryptWithAd(ad: Buffer, plaintext: Buffer): Buffer {
        if (this.key === null) {
            return plaintext;
        }
        if (this.nonce >= MAX_NONCE) {
            throw new NoiseHandshakeError('Noise nonce space exhausted');
        }
        const cipher = createCipheriv(CIPHER_ALGORITHM, this.key, this.nonceBuffer(), {
            authTagLength: NOISE_TAG_LENGTH,
        });
        cipher.setAAD(ad);
        const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const tag = cipher.getAuthTag();
        this.nonce += 1n;
        return Buffer.concat([ciphertext, tag]);
    }

    public decryptWithAd(ad: Buffer, ciphertext: Buffer): Buffer {
        if (this.key === null) {
            return ciphertext;
        }
        if (this.nonce >= MAX_NONCE) {
            throw new NoiseHandshakeError('Noise nonce space exhausted');
        }
        if (ciphertext.length < NOISE_TAG_LENGTH) {
            throw new NoiseAuthenticationError('Noise ciphertext is shorter than its authentication tag');
        }
        const tag = ciphertext.subarray(ciphertext.length - NOISE_TAG_LENGTH);
        const data = ciphertext.subarray(0, ciphertext.length - NOISE_TAG_LENGTH);
        const decipher = createDecipheriv(CIPHER_ALGORITHM, this.key, this.nonceBuffer(), {
            authTagLength: NOISE_TAG_LENGTH,
        });
        decipher.setAAD(ad);
        decipher.setAuthTag(tag);
        let plaintext: Buffer;
        try {
            plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
        } catch (error: unknown) {
            throw new NoiseAuthenticationError('Noise authentication failed', { cause: error });
        }
        // A forged message must not consume the receiver's nonce.
        this.nonce += 1n;
        return plaintext;
    }
}

/** Noise section 5.2: the handshake hash and chaining key, plus the current cipher state. */
class SymmetricState {
    private readonly cipher = new CipherState();
    private chainingKey: Buffer;
    private hashValue: Buffer;

    constructor() {
        // The protocol name is longer than HASHLEN, so Noise hashes it.
        const nameHash = createHash(HASH_ALGORITHM).update(NOISE_PROTOCOL_NAME, 'ascii').digest();
        this.hashValue = nameHash;
        this.chainingKey = nameHash;
    }

    public get hash(): Buffer {
        return this.hashValue;
    }

    public mixHash(data: Buffer): void {
        this.hashValue = createHash(HASH_ALGORITHM).update(this.hashValue).update(data).digest();
    }

    public mixKey(inputKeyMaterial: Buffer): void {
        const [chainingKey, temporaryKey] = hkdf(this.chainingKey, inputKeyMaterial, 2);
        this.chainingKey = chainingKey;
        this.cipher.initializeKey(temporaryKey);
    }

    public mixKeyAndHash(inputKeyMaterial: Buffer): void {
        const [chainingKey, temporaryHash, temporaryKey] = hkdf(this.chainingKey, inputKeyMaterial, 3);
        this.chainingKey = chainingKey;
        this.mixHash(temporaryHash);
        this.cipher.initializeKey(temporaryKey);
    }

    public encryptAndHash(plaintext: Buffer): Buffer {
        const ciphertext = this.cipher.encryptWithAd(this.hashValue, plaintext);
        this.mixHash(ciphertext);
        return ciphertext;
    }

    public decryptAndHash(ciphertext: Buffer): Buffer {
        const plaintext = this.cipher.decryptWithAd(this.hashValue, ciphertext);
        this.mixHash(ciphertext);
        return plaintext;
    }

    /** Noise section 5.2 split: two transport ciphers derived from the final chaining key. */
    public split(): [CipherState, CipherState] {
        const [firstKey, secondKey] = hkdf(this.chainingKey, EMPTY_BUFFER, 2);
        const first = new CipherState();
        const second = new CipherState();
        first.initializeKey(firstKey);
        second.initializeKey(secondKey);
        return [first, second];
    }
}

export interface NoiseHandshakeOptions {
    /** Initiator is the client; responder is the device (or the test server). */
    initiator: boolean;
    psk: Buffer;
    prologue?: Buffer;
    /** Deterministic ephemeral key for known-answer tests. Production omits it. */
    ephemeralPrivateKey?: KeyObject;
}

/**
 * HandshakeState for the NNpsk0 pattern:
 *
 *   -> psk, e
 *   <- e, ee
 *
 * Payloads are empty in ESPHome's handshake, but the API accepts a payload so
 * the same state machine can be checked against the cacophony vectors.
 */
export class NoiseHandshake {
    private readonly initiator: boolean;
    private readonly psk: Buffer;
    private readonly ephemeralPrivateKey: KeyObject;
    private readonly ephemeralPublicKey: Buffer;
    private readonly symmetric: SymmetricState;
    private remoteEphemeralPublicKey?: KeyObject;
    private step = 0;

    public sendCipher?: CipherState;
    public receiveCipher?: CipherState;

    constructor(options: NoiseHandshakeOptions) {
        if (options.psk.length !== NOISE_PSK_LENGTH) {
            throw new NoiseHandshakeError(`Noise PSK must be ${NOISE_PSK_LENGTH} bytes`);
        }
        this.initiator = options.initiator;
        // Copy so the handshake never mutates a caller-owned buffer.
        this.psk = Buffer.from(options.psk);
        const keyPair = options.ephemeralPrivateKey
            ? {
                  privateKey: options.ephemeralPrivateKey,
                  publicKey: exportX25519PublicKey(createPublicKey(options.ephemeralPrivateKey)),
              }
            : generateX25519KeyPair();
        this.ephemeralPrivateKey = keyPair.privateKey;
        this.ephemeralPublicKey = keyPair.publicKey;
        this.symmetric = new SymmetricState();
        this.symmetric.mixHash(options.prologue ?? EMPTY_BUFFER);
    }

    public get handshakeHash(): Buffer {
        return this.symmetric.hash;
    }

    public get complete(): boolean {
        return this.step === 2;
    }

    private requireRemoteEphemeralPublicKey(): KeyObject {
        if (this.remoteEphemeralPublicKey === undefined) {
            throw new NoiseHandshakeError('Noise handshake is missing the remote ephemeral key');
        }
        return this.remoteEphemeralPublicKey;
    }

    public writeMessage(payload: Buffer = EMPTY_BUFFER): Buffer {
        if (this.step >= 2) {
            throw new NoiseHandshakeError('Noise handshake is already complete');
        }
        const firstMessage = this.step === 0;
        if (this.initiator !== firstMessage) {
            throw new NoiseHandshakeError("Not this side's turn to write a Noise message");
        }

        const parts: Buffer[] = [];
        if (firstMessage) {
            this.symmetric.mixKeyAndHash(this.psk);
        }
        // The `e` token: in a PSK handshake it mixes the key after the hash.
        this.symmetric.mixHash(this.ephemeralPublicKey);
        this.symmetric.mixKey(this.ephemeralPublicKey);
        if (!firstMessage) {
            // The `ee` token follows `e`.
            this.symmetric.mixKey(computeDh(this.ephemeralPrivateKey, this.requireRemoteEphemeralPublicKey()));
        }
        parts.push(this.ephemeralPublicKey);
        parts.push(this.symmetric.encryptAndHash(payload));

        this.step += 1;
        return Buffer.concat(parts);
    }

    public readMessage(message: Buffer): Buffer {
        if (this.step >= 2) {
            throw new NoiseHandshakeError('Noise handshake is already complete');
        }
        const firstMessage = this.step === 0;
        if (this.initiator === firstMessage) {
            throw new NoiseHandshakeError("Not this side's turn to read a Noise message");
        }
        if (message.length < NOISE_DH_LENGTH + NOISE_TAG_LENGTH) {
            throw new NoiseHandshakeError('Noise handshake message is too short');
        }

        const remotePublicRaw = message.subarray(0, NOISE_DH_LENGTH);
        const remotePublicKey = importX25519PublicKey(remotePublicRaw);
        if (firstMessage) {
            this.symmetric.mixKeyAndHash(this.psk);
        }
        // The `e` token: in a PSK handshake it mixes the key after the hash.
        this.symmetric.mixHash(remotePublicRaw);
        this.symmetric.mixKey(remotePublicRaw);
        if (!firstMessage) {
            // The `ee` token follows `e`.
            this.symmetric.mixKey(computeDh(this.ephemeralPrivateKey, remotePublicKey));
        }
        this.remoteEphemeralPublicKey = remotePublicKey;

        const payload = this.symmetric.decryptAndHash(message.subarray(NOISE_DH_LENGTH));
        this.step += 1;
        return payload;
    }

    public split(): { send: CipherState; receive: CipherState } {
        if (!this.complete) {
            throw new NoiseHandshakeError('Noise handshake has not completed');
        }
        if (this.sendCipher !== undefined && this.receiveCipher !== undefined) {
            return { send: this.sendCipher, receive: this.receiveCipher };
        }
        const [first, second] = this.symmetric.split();
        if (this.initiator) {
            this.sendCipher = first;
            this.receiveCipher = second;
        } else {
            this.sendCipher = second;
            this.receiveCipher = first;
        }
        return { send: this.sendCipher, receive: this.receiveCipher };
    }
}
