import {
    importNoiseTestKey,
    NoiseAuthenticationError,
    NoiseHandshake,
    parseNoisePsk,
} from '../../../src/api/noise/crypto';
import { InvalidEncryptionKeyFormatError } from '../../../src/api/noise/errors';
import { NOISE_NNPSK0_VECTOR } from './noiseVector';

const hex = (value: string): Buffer => Buffer.from(value, 'hex');

const createPair = (): { initiator: NoiseHandshake; responder: NoiseHandshake } => {
    const psk = hex(NOISE_NNPSK0_VECTOR.psk);
    const prologue = hex(NOISE_NNPSK0_VECTOR.prologue);
    return {
        initiator: new NoiseHandshake({
            initiator: true,
            psk,
            prologue,
            ephemeralPrivateKey: importNoiseTestKey(hex(NOISE_NNPSK0_VECTOR.initEphemeral)).privateKey,
        }),
        responder: new NoiseHandshake({
            initiator: false,
            psk,
            prologue,
            ephemeralPrivateKey: importNoiseTestKey(hex(NOISE_NNPSK0_VECTOR.respEphemeral)).privateKey,
        }),
    };
};

describe('Noise_NNpsk0_25519_ChaChaPoly_SHA256 known-answer vector', () => {
    it('reproduces both handshake messages, the handshake hash, and transport messages', () => {
        const { initiator, responder } = createPair();
        const [message1, message2, ...transport] = NOISE_NNPSK0_VECTOR.messages;

        const wire1 = initiator.writeMessage(hex(message1.payload));
        expect(wire1.toString('hex')).toBe(message1.ciphertext);
        expect(responder.readMessage(wire1).toString('hex')).toBe(message1.payload);

        const wire2 = responder.writeMessage(hex(message2.payload));
        expect(wire2.toString('hex')).toBe(message2.ciphertext);
        expect(initiator.readMessage(wire2).toString('hex')).toBe(message2.payload);

        expect(initiator.complete).toBe(true);
        expect(responder.complete).toBe(true);
        expect(initiator.handshakeHash.toString('hex')).toBe(NOISE_NNPSK0_VECTOR.handshakeHash);
        expect(responder.handshakeHash.toString('hex')).toBe(NOISE_NNPSK0_VECTOR.handshakeHash);

        const initiatorCiphers = initiator.split();
        const responderCiphers = responder.split();

        for (const [index, message] of transport.entries()) {
            const initiatorSends = index % 2 === 0;
            const sender = initiatorSends ? initiatorCiphers.send : responderCiphers.send;
            const receiver = initiatorSends ? responderCiphers.receive : initiatorCiphers.receive;
            const wire = sender.encryptWithAd(Buffer.alloc(0), hex(message.payload));
            expect(wire.toString('hex')).toBe(message.ciphertext);
            expect(receiver.decryptWithAd(Buffer.alloc(0), wire).toString('hex')).toBe(message.payload);
        }
    });

    it('rejects a handshake when the PSKs differ', () => {
        const responder = new NoiseHandshake({ initiator: false, psk: Buffer.alloc(32, 1) });
        const initiator = new NoiseHandshake({ initiator: true, psk: Buffer.alloc(32, 2) });

        expect(() => responder.readMessage(initiator.writeMessage())).toThrow(NoiseAuthenticationError);
    });

    it('rejects a tampered handshake message', () => {
        const { initiator, responder } = createPair();
        const wire = Buffer.from(initiator.writeMessage());
        wire[wire.length - 1] ^= 0x01;

        expect(() => responder.readMessage(wire)).toThrow(NoiseAuthenticationError);
    });

    it('rejects a message delivered out of turn', () => {
        const { initiator, responder } = createPair();

        expect(() => initiator.readMessage(Buffer.alloc(48))).toThrow('turn');
        expect(() => responder.writeMessage()).toThrow('turn');
        expect(() => initiator.split()).toThrow('not completed');
    });
});

describe('parseNoisePsk', () => {
    const zeroKey = Buffer.alloc(32).toString('base64');

    it('accepts padded and unpadded base64', () => {
        expect(parseNoisePsk(zeroKey)).toEqual(Buffer.alloc(32));
        expect(parseNoisePsk(zeroKey.replace(/=+$/, ''))).toEqual(Buffer.alloc(32));
    });

    it('ignores surrounding whitespace', () => {
        expect(parseNoisePsk(`  ${zeroKey}\n`)).toEqual(Buffer.alloc(32));
    });

    it('rejects a key that is not 32 bytes', () => {
        expect(() => parseNoisePsk(Buffer.alloc(31).toString('base64'))).toThrow(InvalidEncryptionKeyFormatError);
        expect(() => parseNoisePsk('')).toThrow(InvalidEncryptionKeyFormatError);
    });

    it('rejects non-base64 input', () => {
        expect(() => parseNoisePsk('not a key!')).toThrow(InvalidEncryptionKeyFormatError);
    });
});
