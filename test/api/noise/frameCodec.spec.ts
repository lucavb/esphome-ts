import { createNoiseCodec, encodeNoiseFrame, parseNoiseServerHello } from '../../../src/api/noise/frameCodec';
import {
    EncryptionHandshakeError,
    EncryptionPlaintextError,
    InvalidEncryptionKeyError,
} from '../../../src/api/noise/errors';
import { MessageTypes } from '../../../src/api/requestResponseMatching';
import { NoiseServer } from './noiseServer';

const psk = Buffer.from('54686973206973206d7920417573747269616e20706572737065637469766521', 'hex');
const serverHello = (name: string, mac?: string): Uint8Array => {
    const parts = [Buffer.from([0x01]), Buffer.from(`${name}\0`, 'utf8')];
    if (mac !== undefined) {
        parts.push(Buffer.from(`${mac}\0`, 'utf8'));
    }
    return encodeNoiseFrame(Buffer.concat(parts));
};

const completeHandshake = (
    client = createNoiseCodec(psk),
    server = new NoiseServer({ psk, name: 'kitchen', mac: 'AA:BB:CC:DD:EE:FF' }),
): { client: ReturnType<typeof createNoiseCodec>; server: NoiseServer } => {
    const start = client.start();
    const { writes } = server.receive(Buffer.concat(start.map((chunk) => Buffer.from(chunk))));
    for (const write of writes) {
        client.push(Buffer.from(write));
    }
    return { client, server };
};

describe('Noise frame codec', () => {
    it('completes the handshake and carries messages in both directions', () => {
        const { client, server } = completeHandshake();
        expect(client.ready).toBe(true);

        const command = client.seal(MessageTypes.SwitchCommandRequest, new Uint8Array([0x08, 0x01]));
        const receivedCommand = server.receive(Buffer.from(command)).frames;
        expect(receivedCommand).toEqual([
            { type: MessageTypes.SwitchCommandRequest, payload: new Uint8Array([0x08, 0x01]) },
        ]);

        const state = server.seal(MessageTypes.SwitchStateResponse, new Uint8Array([0x08, 0x01]));
        expect(client.push(Buffer.from(state))).toEqual([
            { type: MessageTypes.SwitchStateResponse, payload: new Uint8Array([0x08, 0x01]) },
        ]);

        // The 128-byte handshake cap must not apply once the session is ready:
        // ListEntities/state responses routinely exceed it.
        const largePayload = new Uint8Array(300).fill(0x2a);
        const large = server.seal(MessageTypes.ListEntitiesSwitchResponse, largePayload);
        expect(client.push(Buffer.from(large))).toEqual([
            { type: MessageTypes.ListEntitiesSwitchResponse, payload: largePayload },
        ]);
    });

    it('reassembles a fragmented ServerHello and handshake reply', () => {
        const client = createNoiseCodec(psk);
        const server = new NoiseServer({ psk, name: 'kitchen', mac: 'AA:BB:CC:DD:EE:FF' });
        const start = client.start();
        const { writes } = server.receive(Buffer.concat(start.map((chunk) => Buffer.from(chunk))));

        for (const write of writes) {
            for (const byte of Buffer.from(write)) {
                client.push(Buffer.from([byte]));
            }
        }

        expect(client.ready).toBe(true);
    });

    it('decrypts a data frame that arrives in the same chunk as the handshake reply', () => {
        const client = createNoiseCodec(psk);
        const server = new NoiseServer({ psk, name: 'kitchen' });
        const start = client.start();
        const { writes } = server.receive(Buffer.concat(start.map((chunk) => Buffer.from(chunk))));
        const state = server.seal(MessageTypes.SensorStateResponse, new Uint8Array([0x08, 0x2a]));

        const frames = client.push(Buffer.concat([...writes.map((write) => Buffer.from(write)), Buffer.from(state)]));

        expect(client.ready).toBe(true);
        expect(frames).toEqual([{ type: MessageTypes.SensorStateResponse, payload: new Uint8Array([0x08, 0x2a]) }]);
    });

    it('works with a ServerHello that only carries the protocol byte', () => {
        const client = createNoiseCodec(psk);
        const server = new NoiseServer({ psk });
        const start = client.start();
        const { writes } = server.receive(Buffer.concat(start.map((chunk) => Buffer.from(chunk))));
        for (const write of writes) {
            client.push(Buffer.from(write));
        }

        expect(client.ready).toBe(true);
    });

    it('reports an invalid key with the ServerHello name and MAC', () => {
        const client = createNoiseCodec(Buffer.alloc(32, 1));
        client.start();
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('Handshake MAC failure')]));

        let caught: unknown;
        try {
            client.push(Buffer.concat([Buffer.from(serverHello('kitchen', 'AA:BB:CC:DD:EE:FF')), Buffer.from(reject)]));
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(InvalidEncryptionKeyError);
        expect((caught as InvalidEncryptionKeyError).serverName).toBe('kitchen');
        expect((caught as InvalidEncryptionKeyError).serverMac).toBe('AA:BB:CC:DD:EE:FF');
    });

    it('reports a local AEAD failure on the handshake reply as an invalid key', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const bogusReply = encodeNoiseFrame(Buffer.concat([Buffer.from([0x00]), Buffer.alloc(48, 0x42)]));

        let caught: unknown;
        try {
            client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(bogusReply)]));
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(InvalidEncryptionKeyError);
        expect((caught as InvalidEncryptionKeyError).serverName).toBe('kitchen');
    });

    it('treats a low-order handshake key as a rejected key', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const badReply = encodeNoiseFrame(Buffer.concat([Buffer.from([0x00]), Buffer.alloc(48)]));

        let caught: unknown;
        try {
            client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(badReply)]));
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(InvalidEncryptionKeyError);
        expect((caught as InvalidEncryptionKeyError).serverName).toBe('kitchen');
    });

    it('reports a non-MAC handshake rejection as a retryable handshake error', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('Bad handshake error byte')]));

        expect(() => client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(reject)]))).toThrow(
            EncryptionHandshakeError,
        );
    });

    it('detects a plaintext device while waiting for ServerHello', () => {
        const client = createNoiseCodec(psk);
        client.start();

        expect(() => client.push(Buffer.from([0x00, 0x00, 0x00]))).toThrow(EncryptionPlaintextError);
    });

    it('rejects an unsupported ServerHello protocol', () => {
        const client = createNoiseCodec(psk);
        client.start();

        expect(() => client.push(Buffer.from(encodeNoiseFrame(Buffer.from([0x02]))))).toThrow(EncryptionHandshakeError);
    });

    it('rejects an unexpected frame indicator', () => {
        const client = createNoiseCodec(psk);
        client.start();

        expect(() => client.push(Buffer.from([0x42, 0x00, 0x00]))).toThrow(EncryptionHandshakeError);
    });

    it('rejects a handshake frame larger than the 128-byte limit', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const header = Buffer.alloc(3);
        header[0] = 0x01;
        header.writeUInt16BE(129, 1);

        expect(() => client.push(header)).toThrow(EncryptionHandshakeError);
    });

    it('maps a tampered post-handshake data frame to a retryable handshake error', () => {
        const { client, server } = completeHandshake();
        const frame = Buffer.from(server.seal(MessageTypes.SwitchStateResponse, new Uint8Array([0x08, 0x01])));
        frame[frame.length - 1] ^= 0x01;

        expect(() => client.push(frame)).toThrow(EncryptionHandshakeError);
    });

    it('does not consume or reset the receive nonce after a failed data frame', () => {
        const { client, server } = completeHandshake();
        const first = Buffer.from(server.seal(MessageTypes.SwitchStateResponse, new Uint8Array([0x08, 0x00])));
        expect(client.push(first)).toEqual([
            { type: MessageTypes.SwitchStateResponse, payload: new Uint8Array([0x08, 0x00]) },
        ]);

        // The genuine frame below used receive nonce 1. It must still decrypt
        // after the failed frame: a receiver that consumed or reset the nonce
        // on failure would reject it.
        const genuine = Buffer.from(server.seal(MessageTypes.SwitchStateResponse, new Uint8Array([0x08, 0x01])));
        const tampered = Buffer.from(genuine);
        tampered[tampered.length - 1] ^= 0x01;

        expect(() => client.push(tampered)).toThrow(EncryptionHandshakeError);
        expect(client.push(genuine)).toEqual([
            { type: MessageTypes.SwitchStateResponse, payload: new Uint8Array([0x08, 0x01]) },
        ]);
    });

    it('rejects a decrypted data frame that is too short', () => {
        const { client, server } = completeHandshake();
        const short = server.sealPlaintext(Buffer.from([0x00, 0x1a]));

        expect(() => client.push(Buffer.from(short))).toThrow(EncryptionHandshakeError);
    });

    it('rejects a decrypted data frame with an invalid declared length', () => {
        const { client, server } = completeHandshake();
        const invalid = server.sealPlaintext(Buffer.from([0x00, 0x1a, 0x00, 0x10]));

        expect(() => client.push(Buffer.from(invalid))).toThrow(EncryptionHandshakeError);
    });

    it('rejects a ciphertext shorter than the authentication tag', () => {
        const { client } = completeHandshake();

        expect(() => client.push(encodeNoiseFrame(Buffer.alloc(8)))).toThrow(EncryptionHandshakeError);
    });

    it('rejects an empty handshake frame', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const emptyHandshake = encodeNoiseFrame(Buffer.alloc(0));

        expect(() =>
            client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(emptyHandshake)])),
        ).toThrow(EncryptionHandshakeError);
    });

    it('treats an unterminated ServerHello name as protocol-only', () => {
        expect(parseNoiseServerHello(Buffer.from([0x01, 0x6b, 0x69]))).toEqual({ protocol: 1 });
    });

    it('normalizes a separator-free ServerHello MAC', () => {
        const hello = parseNoiseServerHello(
            Buffer.concat([
                Buffer.from([0x01]),
                Buffer.from('kitchen\0', 'utf8'),
                Buffer.from('aabbccddeeff\0', 'utf8'),
            ]),
        );

        expect(hello).toEqual({ protocol: 1, name: 'kitchen', mac: 'AA:BB:CC:DD:EE:FF' });
    });

    it('rejects an empty ServerHello', () => {
        const client = createNoiseCodec(psk);
        client.start();

        expect(() => client.push(encodeNoiseFrame(Buffer.alloc(0)))).toThrow(EncryptionHandshakeError);
    });

    it('reports a reject frame with no reason as an unknown handshake rejection', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const reject = encodeNoiseFrame(Buffer.from([0x01]));

        expect(() => client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(reject)]))).toThrow(
            /unknown reason/,
        );
    });

    it('sanitizes control characters in a handshake reject reason', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('bad\nreason')]));

        let caught: unknown;
        try {
            client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(reject)]));
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(EncryptionHandshakeError);
        expect((caught as Error).message).toContain('bad?reason');
        expect((caught as Error).message).not.toContain('\n');
    });

    it('maps a truncated handshake message to a retryable handshake error', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const truncated = encodeNoiseFrame(Buffer.concat([Buffer.from([0x00]), Buffer.alloc(10)]));

        expect(() => client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(truncated)]))).toThrow(
            EncryptionHandshakeError,
        );
    });

    it('parses a ServerHello with a name but no MAC terminator', () => {
        expect(parseNoiseServerHello(Buffer.from([0x01, 0x6b, 0x00, 0x41, 0x41]))).toEqual({
            protocol: 1,
            name: 'k',
        });
    });

    it('reports a nameless invalid key when ServerHello has only the protocol byte', () => {
        const client = createNoiseCodec(psk);
        client.start();
        const protocolOnly = encodeNoiseFrame(Buffer.from([0x01]));
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('Handshake MAC failure')]));

        let caught: unknown;
        try {
            client.push(Buffer.concat([Buffer.from(protocolOnly), Buffer.from(reject)]));
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(InvalidEncryptionKeyError);
        expect((caught as InvalidEncryptionKeyError).serverName).toBeUndefined();
    });

    it('rejects a plaintext indicator on a ready session', () => {
        const { client } = completeHandshake();

        expect(() => client.push(Buffer.from([0x00, 0x00, 0x00]))).toThrow(EncryptionHandshakeError);
    });

    it('sanitizes control characters in ServerHello name and MAC', () => {
        const hello = parseNoiseServerHello(
            Buffer.concat([
                Buffer.from([0x01]),
                Buffer.from('kit\nchen\u202e\0', 'utf8'),
                Buffer.from('aa\x1bbbccddeeff\0', 'utf8'),
            ]),
        );

        expect(hello.name).toBe('kit?chen?');
        expect(hello.mac).toBe('aa?bbccddeeff');
    });

    it('caps ServerHello labels by code point, not UTF-16 unit', () => {
        const name = `${'a'.repeat(31)}😀`;
        const hello = parseNoiseServerHello(Buffer.concat([Buffer.from([0x01]), Buffer.from(`${name}\0`, 'utf8')]));

        expect(hello.name).toBe(name);
    });

    it('truncates overlong ServerHello labels and reject reasons', () => {
        const longName = 'a'.repeat(33);
        const hello = parseNoiseServerHello(Buffer.concat([Buffer.from([0x01]), Buffer.from(`${longName}\0`, 'utf8')]));
        expect(hello.name).toBe('a'.repeat(32));

        const client = createNoiseCodec(psk);
        client.start();
        const reason = 'a'.repeat(100);
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from(reason)]));

        let caught: unknown;
        try {
            client.push(Buffer.concat([Buffer.from(serverHello('kitchen')), Buffer.from(reject)]));
        } catch (error: unknown) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(EncryptionHandshakeError);
        expect((caught as Error).message).toContain('a'.repeat(64));
        expect((caught as Error).message).not.toContain('a'.repeat(65));
    });

    it('refuses to seal before the handshake completes', () => {
        const client = createNoiseCodec(psk);

        expect(() => client.seal(MessageTypes.PingResponse, new Uint8Array())).toThrow(EncryptionHandshakeError);
    });

    it('enforces the encrypted payload limit', () => {
        const { client } = completeHandshake();

        expect(() => client.seal(MessageTypes.LightCommandRequest, new Uint8Array(65516))).toThrow(RangeError);
        expect(() => client.seal(MessageTypes.LightCommandRequest, new Uint8Array(65515))).not.toThrow();
    });
});
