import { ESPHOME_NOISE_PROLOGUE, NoiseHandshake, type CipherState } from '../../../src/api/noise/crypto';
import { encodeNoiseFrame } from '../../../src/api/noise/frameCodec';
import { type ReadData } from '../../../src/api/framer';
import { type MessageTypes } from '../../../src/api/requestResponseMatching';

const NOISE_INDICATOR = 0x01;
const NOISE_FRAME_HEADER_SIZE = 3;
const STATUS_OK = 0x00;

export interface NoiseServerOptions {
    psk: Buffer;
    /** Device name placed in ServerHello. Omit to emulate pre-2022.2 firmware. */
    name?: string;
    /** Device MAC placed after the name. Omit to emulate pre-2025.4 firmware. */
    mac?: string;
}

/**
 * Responder side of an ESPHome Noise session, used by the codec and EspDevice
 * specs. It speaks only the wire format; the crypto is the same NoiseHandshake
 * that the client uses, whose composition is separately pinned by the
 * cacophony known-answer vector.
 */
export class NoiseServer {
    private readonly handshake: NoiseHandshake;
    private readonly writes: Uint8Array[] = [];
    private buffer = Buffer.alloc(0);
    private state: 'clientHello' | 'handshake' | 'ready' = 'clientHello';
    private sendCipher?: CipherState;
    private receiveCipher?: CipherState;

    constructor(private readonly options: NoiseServerOptions) {
        this.handshake = new NoiseHandshake({
            initiator: false,
            psk: options.psk,
            prologue: ESPHOME_NOISE_PROLOGUE,
        });
    }

    /** Consume client bytes and return decrypted application frames plus bytes the server wrote. */
    public receive(chunk: Buffer): { frames: ReadData[]; writes: Uint8Array[] } {
        if (chunk.length > 0) {
            this.buffer = Buffer.concat([this.buffer, chunk]);
        }
        const frames: ReadData[] = [];
        while (this.buffer.length >= NOISE_FRAME_HEADER_SIZE) {
            if (this.buffer[0] !== NOISE_INDICATOR) {
                throw new Error(`Unexpected client frame indicator: ${this.buffer[0]}`);
            }
            const length = this.buffer.readUInt16BE(1);
            const frameEnd = NOISE_FRAME_HEADER_SIZE + length;
            if (this.buffer.length < frameEnd) {
                break;
            }
            const payload = this.buffer.subarray(NOISE_FRAME_HEADER_SIZE, frameEnd);
            this.buffer = this.buffer.subarray(frameEnd);
            this.handleFrame(payload, frames);
        }
        const writes = this.writes.splice(0, this.writes.length);
        return { frames, writes };
    }

    /** Encrypt an application message for the client. Only valid once the session is ready. */
    public seal(type: MessageTypes, payload: Uint8Array): Uint8Array {
        if (this.state !== 'ready' || this.sendCipher === undefined) {
            throw new Error('Noise server is not ready');
        }
        const plaintext = Buffer.alloc(4 + payload.length);
        plaintext.writeUInt16BE(Number(type), 0);
        plaintext.writeUInt16BE(payload.length, 2);
        plaintext.set(payload, 4);
        return encodeNoiseFrame(this.sendCipher.encryptWithAd(Buffer.alloc(0), plaintext));
    }

    /** Encrypt arbitrary plaintext with the send cipher; test-only for malformed frame shapes. */
    public sealPlaintext(plaintext: Buffer): Uint8Array {
        if (this.state !== 'ready' || this.sendCipher === undefined) {
            throw new Error('Noise server is not ready');
        }
        return encodeNoiseFrame(this.sendCipher.encryptWithAd(Buffer.alloc(0), plaintext));
    }

    private handleFrame(payload: Buffer, frames: ReadData[]): void {
        if (this.state === 'clientHello') {
            if (payload.length !== 0) {
                throw new Error('Client hello frame must be empty');
            }
            this.writes.push(this.serverHelloFrame());
            this.state = 'handshake';
            return;
        }
        if (this.state === 'handshake') {
            if (payload.length === 0 || payload[0] !== STATUS_OK) {
                throw new Error('Client handshake frame is malformed');
            }
            this.handshake.readMessage(payload.subarray(1));
            const secondMessage = this.handshake.writeMessage();
            const { send, receive } = this.handshake.split();
            this.sendCipher = send;
            this.receiveCipher = receive;
            this.state = 'ready';
            this.writes.push(encodeNoiseFrame(Buffer.concat([Buffer.from([STATUS_OK]), secondMessage])));
            return;
        }
        if (this.receiveCipher === undefined) {
            throw new Error('Noise server has no receive cipher');
        }
        const plaintext = this.receiveCipher.decryptWithAd(Buffer.alloc(0), payload);
        if (plaintext.length < 4) {
            throw new Error('Decrypted client message is too short');
        }
        const type = plaintext.readUInt16BE(0);
        const dataLength = plaintext.readUInt16BE(2);
        if (dataLength > plaintext.length - 4) {
            throw new Error('Decrypted client message declares an invalid length');
        }
        frames.push({
            type,
            payload: new Uint8Array(plaintext.subarray(4, 4 + dataLength)),
        });
    }

    private serverHelloFrame(): Uint8Array {
        if (this.options.name === undefined) {
            return encodeNoiseFrame(Buffer.from([NOISE_INDICATOR]));
        }
        const parts = [Buffer.from([NOISE_INDICATOR]), Buffer.from(`${this.options.name}\0`, 'utf8')];
        if (this.options.mac !== undefined) {
            parts.push(Buffer.from(`${this.options.mac}\0`, 'utf8'));
        }
        return encodeNoiseFrame(Buffer.concat(parts));
    }
}
