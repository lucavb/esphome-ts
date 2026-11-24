import { createFrameParser, encodeFrame, type ReadData } from './framer';
import { EncryptionRequiredError } from './noise/errors';
import { type MessageTypes } from './requestResponseMatching';

/**
 * Internal transport seam between EspSocket and the two wire formats.
 *
 * A codec owns everything below the protobuf Message: framing, and for the
 * Noise variant the handshake and per-direction ciphers. EspSocket creates one
 * codec per connection generation, feeds it incoming chunks, and asks it to
 * seal outgoing commands once it reports ready.
 */
export interface WireCodec {
    /** Whether application messages can be sent and are being emitted. */
    readonly ready: boolean;
    /** Whether the device has sent any bytes on this connection generation. */
    readonly receivedData: boolean;
    /** Bytes that must be written as soon as the transport connects. */
    start(): Uint8Array[];
    /** Consume a chunk and return any complete application frames. */
    push(chunk: Buffer): ReadData[];
    /** Encode and encrypt one application message. */
    seal(type: MessageTypes, payload: Uint8Array): Uint8Array;
}

/**
 * Plaintext wire format: marker 0x00, varint payload length, varint type.
 *
 * The one protocol addition here is the encrypted-device probe: a Noise server
 * always answers our plaintext HelloRequest with a 0x01 frame or closes, so a
 * 0x01 first byte tells us the device requires encryption instead of silently
 * resyncing the framer and eventually timing the send out.
 */
export const createPlaintextCodec = (): WireCodec => {
    const parser = createFrameParser();
    let checkedFirstChunk = false;
    let receivedData = false;

    return {
        get ready(): boolean {
            return true;
        },
        get receivedData(): boolean {
            return receivedData;
        },
        start(): Uint8Array[] {
            return [];
        },
        push(chunk: Buffer): ReadData[] {
            if (chunk.length > 0) {
                receivedData = true;
            }
            if (!checkedFirstChunk && chunk.length > 0) {
                checkedFirstChunk = true;
                if (chunk[0] === 0x01) {
                    throw new EncryptionRequiredError();
                }
            }
            return parser.push(chunk);
        },
        seal(type: MessageTypes, payload: Uint8Array): Uint8Array {
            return encodeFrame(type, payload);
        },
    };
};
