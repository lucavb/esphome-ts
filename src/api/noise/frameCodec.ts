import { type KeyObject } from 'node:crypto';
import { type WireCodec } from '../frameCodec';
import { type ReadData } from '../framer';
import { type MessageTypes } from '../requestResponseMatching';
import {
    CipherState,
    ESPHOME_NOISE_PROLOGUE,
    NoiseAuthenticationError,
    NoiseHandshake,
    NoiseHandshakeError,
    NoiseKeyAgreementError,
} from './crypto';
import { EncryptionHandshakeError, EncryptionPlaintextError, InvalidEncryptionKeyError } from './errors';

const NOISE_INDICATOR = 0x01;
const PLAINTEXT_INDICATOR = 0x00;
const NOISE_FRAME_HEADER_SIZE = 3;
const NOISE_FRAME_MAX_SIZE = 0xffff;
const NOISE_MAX_HANDSHAKE_FRAME = 128; // ESPHome's MAX_HANDSHAKE_SIZE
const NOISE_PLAINTEXT_HEADER_SIZE = 4;
const NOISE_TAG_LENGTH = 16;
// Wire-format maximum. Firmware's receive buffer is smaller (8 KiB on ESP8266,
// 32 KiB elsewhere); client-to-server messages are small, so this ceiling is
// not normally reached, but the device is the final authority.
const NOISE_MAX_PAYLOAD = NOISE_FRAME_MAX_SIZE - NOISE_PLAINTEXT_HEADER_SIZE - NOISE_TAG_LENGTH;
const HANDSHAKE_STATUS_OK = 0x00;
const HANDSHAKE_MAC_FAILURE = 'Handshake MAC failure';

type NoiseState = 'serverHello' | 'handshake' | 'ready';

export interface NoiseServerHello {
    protocol: number;
    name?: string;
    mac?: string;
}

/** Firmware reports the MAC as 12 hex digits; match DeviceInfoResponse's colon form. */
const normalizeMac = (mac: string): string => {
    if (!/^[0-9a-fA-F]{12}$/.test(mac)) {
        return mac;
    }
    return mac.toUpperCase().match(/.{2}/g)?.join(':') ?? mac;
};

/**
 * ServerHello name/MAC are unauthenticated, attacker-controlled strings that
 * end up in error messages. Strip control characters and cap the length so a
 * hostile peer cannot inject log lines or escape sequences.
 */
const sanitizeLabel = (value: string, maxLength: number): string => {
    let sanitized = '';
    for (const character of Array.from(value).slice(0, maxLength)) {
        const code = character.codePointAt(0) ?? 0;
        const unsafe =
            code < 0x20 ||
            (code >= 0x7f && code <= 0x9f) ||
            (code >= 0x2028 && code <= 0x202e) ||
            (code >= 0x2066 && code <= 0x2069);
        sanitized += unsafe ? '?' : character;
    }
    return sanitized;
};

/**
 * ServerHello is sent in a normal Noise frame but is not encrypted. Its layout:
 *
 *   byte 0      chosen protocol (currently always 0x01)
 *   name        null-terminated device name (added in ESPHome 2022.2)
 *   mac         null-terminated device MAC (added in ESPHome 2025.4)
 *
 * The name and MAC are optional so older firmware still works; both are kept so
 * a rejected key can still name the device that rejected it.
 */
export const parseNoiseServerHello = (payload: Buffer): NoiseServerHello => {
    if (payload.length === 0) {
        throw new EncryptionHandshakeError('Noise ServerHello is empty');
    }
    const protocol = payload[0];
    if (protocol !== NOISE_INDICATOR) {
        throw new EncryptionHandshakeError(`Unsupported Noise protocol selected by the device: ${protocol}`);
    }
    const nameEnd = payload.indexOf(0, 1);
    if (nameEnd === -1) {
        return { protocol };
    }
    const name = sanitizeLabel(payload.subarray(1, nameEnd).toString('utf8'), 32);
    const macEnd = payload.indexOf(0, nameEnd + 1);
    if (macEnd === -1) {
        return { protocol, name };
    }
    return {
        protocol,
        name,
        mac: normalizeMac(sanitizeLabel(payload.subarray(nameEnd + 1, macEnd).toString('utf8'), 32)),
    };
};

/** Build a Noise frame: indicator 0x01, 16-bit big-endian length, payload. */
export const encodeNoiseFrame = (payload: Uint8Array): Buffer => {
    if (payload.length > NOISE_FRAME_MAX_SIZE) {
        throw new RangeError(`noise frame exceeds wire limit: ${payload.length} > ${NOISE_FRAME_MAX_SIZE} bytes`);
    }
    const frame = Buffer.alloc(NOISE_FRAME_HEADER_SIZE + payload.length);
    frame[0] = NOISE_INDICATOR;
    frame.writeUInt16BE(payload.length, 1);
    frame.set(payload, NOISE_FRAME_HEADER_SIZE);
    return frame;
};

class NoiseFrameCodec implements WireCodec {
    private readonly handshake: NoiseHandshake;
    private state: NoiseState = 'serverHello';
    private buffer = Buffer.alloc(0);
    private started = false;
    private receivedDataFlag = false;
    private sendCipher?: CipherState;
    private receiveCipher?: CipherState;
    private serverName?: string;
    private serverMac?: string;

    constructor(psk: Buffer, ephemeralPrivateKey?: KeyObject) {
        this.handshake = new NoiseHandshake({
            initiator: true,
            psk,
            prologue: ESPHOME_NOISE_PROLOGUE,
            ephemeralPrivateKey,
        });
    }

    public get ready(): boolean {
        return this.state === 'ready';
    }

    public get receivedData(): boolean {
        return this.receivedDataFlag;
    }

    public start(): Uint8Array[] {
        if (this.started) {
            return [];
        }
        this.started = true;
        const firstMessage = this.handshake.writeMessage();
        return [
            // Empty client-hello frame: this is the frame the device mixes into
            // its prologue, so it must arrive before the first Noise message.
            Buffer.from([NOISE_INDICATOR, 0x00, 0x00]),
            encodeNoiseFrame(Buffer.concat([Buffer.from([HANDSHAKE_STATUS_OK]), firstMessage])),
        ];
    }

    public push(chunk: Buffer): ReadData[] {
        if (chunk.length > 0) {
            this.receivedDataFlag = true;
            this.buffer = Buffer.concat([this.buffer, chunk]);
        }
        const frames: ReadData[] = [];
        while (this.buffer.length >= NOISE_FRAME_HEADER_SIZE) {
            if (this.buffer[0] !== NOISE_INDICATOR) {
                if (this.buffer[0] === PLAINTEXT_INDICATOR && this.state === 'serverHello') {
                    throw new EncryptionPlaintextError();
                }
                throw new EncryptionHandshakeError(`Unexpected Noise frame indicator: ${this.buffer[0]}`);
            }
            const length = this.buffer.readUInt16BE(1);
            if (this.state !== 'ready' && length > NOISE_MAX_HANDSHAKE_FRAME) {
                throw new EncryptionHandshakeError(
                    `Noise handshake frame exceeds the ${NOISE_MAX_HANDSHAKE_FRAME}-byte limit: ${length}`,
                );
            }
            const frameEnd = NOISE_FRAME_HEADER_SIZE + length;
            if (this.buffer.length < frameEnd) {
                break;
            }
            const payload = this.buffer.subarray(NOISE_FRAME_HEADER_SIZE, frameEnd);
            this.buffer = this.buffer.subarray(frameEnd);
            this.handleFrame(payload, frames);
        }
        return frames;
    }

    public seal(type: MessageTypes, payload: Uint8Array): Uint8Array {
        if (this.state !== 'ready' || this.sendCipher === undefined) {
            throw new EncryptionHandshakeError('Cannot send before the Noise handshake completed');
        }
        if (payload.length > NOISE_MAX_PAYLOAD) {
            throw new RangeError(
                `encrypted payload exceeds wire limit: ${payload.length} > ${NOISE_MAX_PAYLOAD} bytes`,
            );
        }
        const plaintext = Buffer.alloc(NOISE_PLAINTEXT_HEADER_SIZE + payload.length);
        plaintext.writeUInt16BE(Number(type), 0);
        plaintext.writeUInt16BE(payload.length, 2);
        plaintext.set(payload, NOISE_PLAINTEXT_HEADER_SIZE);
        return encodeNoiseFrame(this.sendCipher.encryptWithAd(Buffer.alloc(0), plaintext));
    }

    private handleFrame(payload: Buffer, frames: ReadData[]): void {
        switch (this.state) {
            case 'serverHello': {
                const hello = parseNoiseServerHello(payload);
                this.serverName = hello.name;
                this.serverMac = hello.mac;
                this.state = 'handshake';
                return;
            }
            case 'handshake':
                this.handleHandshakeFrame(payload);
                return;
            case 'ready':
                this.handleDataFrame(payload, frames);
        }
    }

    private handleHandshakeFrame(payload: Buffer): void {
        if (payload.length === 0) {
            throw new EncryptionHandshakeError('Noise handshake frame is empty');
        }
        if (payload[0] !== HANDSHAKE_STATUS_OK) {
            const reasonRaw = payload.subarray(1).toString('utf8');
            if (reasonRaw === HANDSHAKE_MAC_FAILURE) {
                throw new InvalidEncryptionKeyError(this.serverName, this.serverMac);
            }
            const reason = sanitizeLabel(reasonRaw, 64);
            throw new EncryptionHandshakeError(`Noise handshake rejected: ${reason || 'unknown reason'}`);
        }
        try {
            this.handshake.readMessage(payload.subarray(1));
        } catch (error: unknown) {
            if (error instanceof NoiseAuthenticationError || error instanceof NoiseKeyAgreementError) {
                throw new InvalidEncryptionKeyError(this.serverName, this.serverMac);
            }
            if (error instanceof NoiseHandshakeError) {
                throw new EncryptionHandshakeError(error.message, { cause: error });
            }
            throw error;
        }
        const { send, receive } = this.handshake.split();
        this.sendCipher = send;
        this.receiveCipher = receive;
        this.state = 'ready';
    }

    private handleDataFrame(payload: Buffer, frames: ReadData[]): void {
        const receiveCipher = this.receiveCipher;
        if (receiveCipher === undefined) {
            throw new EncryptionHandshakeError('Noise data frame arrived before the handshake completed');
        }
        let plaintext: Buffer;
        try {
            plaintext = receiveCipher.decryptWithAd(Buffer.alloc(0), payload);
        } catch (error: unknown) {
            if (error instanceof NoiseHandshakeError) {
                throw new EncryptionHandshakeError('Unable to decrypt a Noise data frame', { cause: error });
            }
            throw error;
        }
        if (plaintext.length < NOISE_PLAINTEXT_HEADER_SIZE) {
            throw new EncryptionHandshakeError('Decrypted Noise message is too short');
        }
        const type = plaintext.readUInt16BE(0);
        const dataLength = plaintext.readUInt16BE(2);
        if (dataLength > plaintext.length - NOISE_PLAINTEXT_HEADER_SIZE) {
            throw new EncryptionHandshakeError('Decrypted Noise message declares an invalid length');
        }
        frames.push({
            type,
            payload: new Uint8Array(
                plaintext.subarray(NOISE_PLAINTEXT_HEADER_SIZE, NOISE_PLAINTEXT_HEADER_SIZE + dataLength),
            ),
        });
    }
}

/** Create the Noise wire codec for one connection generation. */
export const createNoiseCodec = (psk: Buffer, ephemeralPrivateKey?: KeyObject): WireCodec =>
    new NoiseFrameCodec(psk, ephemeralPrivateKey);
