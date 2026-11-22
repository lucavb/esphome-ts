import { MessageTypes } from './requestResponseMatching';

export interface ReadData {
    type: MessageTypes;
    payload: Uint8Array;
}

const MAX_PAYLOAD_SIZE = 0xffff;
const MAX_VARINT_BYTES = 5;
const MAX_MESSAGE_TYPE = 0xffff;

const encodeVarint = (value: number): number[] => {
    const bytes: number[] = [];
    while (value >= 0x80) {
        bytes.push((value & 0x7f) | 0x80);
        value = Math.floor(value / 0x80);
    }
    bytes.push(value);
    return bytes;
};

export const encodeFrame = (type: MessageTypes, payload: Uint8Array): Uint8Array => {
    const messageType = Number(type);
    if (payload.length > MAX_PAYLOAD_SIZE) {
        throw new RangeError(`frame payload exceeds wire limit: ${payload.length} > ${MAX_PAYLOAD_SIZE} bytes`);
    }
    if (!Number.isSafeInteger(messageType) || messageType < 0 || messageType > MAX_MESSAGE_TYPE) {
        throw new RangeError(`frame message type must be an unsigned 16-bit integer: ${messageType}`);
    }

    const lengthBytes = encodeVarint(payload.length);
    const typeBytes = encodeVarint(messageType);
    const frame = new Uint8Array(1 + lengthBytes.length + typeBytes.length + payload.length);
    frame[0] = 0x00;
    frame.set(lengthBytes, 1);
    frame.set(typeBytes, 1 + lengthBytes.length);
    frame.set(payload, 1 + lengthBytes.length + typeBytes.length);
    return frame;
};

type VarintResult = { status: 'incomplete' } | { status: 'invalid' } | { status: 'value'; value: number; next: number };

/** Decode a bounded unsigned 32-bit varint beginning at `offset`. */
const decodeVarint = (buffer: Buffer, offset: number): VarintResult => {
    let value = 0;
    let multiplier = 1;
    for (let index = 0; index < MAX_VARINT_BYTES; index++) {
        const position = offset + index;
        if (position >= buffer.length) {
            return { status: 'incomplete' };
        }
        const byte = buffer[position];
        // The fifth byte of a uint32 varint may only carry its low four bits.
        if (index === MAX_VARINT_BYTES - 1 && (byte & 0xf0) !== 0) {
            return { status: 'invalid' };
        }
        value += (byte & 0x7f) * multiplier;
        if ((byte & 0x80) === 0) {
            return { status: 'value', value, next: position + 1 };
        }
        multiplier *= 0x80;
    }
    return { status: 'invalid' };
};

/**
 * Invariants of the returned framer:
 * - the wire header is marker 0x00, unsigned-varint payload length, then
 *   unsigned-varint message type; lengths above the aio client limit (65535
 *   bytes), types above the firmware's uint16 limit, and malformed uint32
 *   varints are discarded;
 * - chunk boundaries are irrelevant: a frame split across any number of chunks is reassembled;
 * - frames are emitted in stream order;
 * - after a byte that is not the marker byte, the framer resyncs by skipping
 *   forward to the next 0x00. Because 0x00 also occurs inside payloads, a
 *   resync can land mid-frame: it may then emit a mis-typed frame or hold back
 *   valid frames until the announced length is satisfied. The wire format
 *   offers no stronger recovery, so callers must tolerate bogus frames;
 * - framer instances share no state: each returned instance carries its own buffer;
 * - a partial frame is bounded by the maximum payload and at most five bytes
 *   for each header varint.
 */
export const createFrameParser = (): { push(chunk: Buffer): ReadData[] } => {
    let buffer = Buffer.alloc(0);
    return {
        push(chunk: Buffer): ReadData[] {
            if (chunk.length > 0) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            const frames: ReadData[] = [];
            while (buffer.length > 0) {
                if (buffer[0] !== 0x00) {
                    const sync = buffer.indexOf(0x00);
                    buffer = sync === -1 ? Buffer.alloc(0) : buffer.subarray(sync);
                    continue;
                }

                const length = decodeVarint(buffer, 1);
                if (length.status === 'incomplete') {
                    break;
                }
                if (length.status === 'invalid' || length.value > MAX_PAYLOAD_SIZE) {
                    const sync = buffer.indexOf(0x00, 1);
                    buffer = sync === -1 ? Buffer.alloc(0) : buffer.subarray(sync);
                    continue;
                }

                const type = decodeVarint(buffer, length.next);
                if (type.status === 'incomplete') {
                    break;
                }
                if (type.status === 'invalid' || type.value > MAX_MESSAGE_TYPE) {
                    const sync = buffer.indexOf(0x00, 1);
                    buffer = sync === -1 ? Buffer.alloc(0) : buffer.subarray(sync);
                    continue;
                }

                const end = type.next + length.value;
                if (buffer.length < end) {
                    break;
                }
                frames.push({
                    type: type.value,
                    payload: new Uint8Array(buffer.subarray(type.next, end)),
                });
                buffer = buffer.subarray(end);
            }
            return frames;
        },
    };
};
