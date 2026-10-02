import { MessageTypes } from './requestResponseMatching';

export interface ReadData {
    type: MessageTypes;
    payload: Uint8Array;
}

export const encodeFrame = (type: MessageTypes, payload: Uint8Array): Uint8Array => {
    if (payload.length > 0xff) {
        throw new RangeError(`frame payload exceeds wire limit: ${payload.length} > 255 bytes`);
    }
    const frame = new Uint8Array(3 + payload.length);
    frame[0] = 0x00;
    frame[1] = payload.length;
    frame[2] = type;
    frame.set(payload, 3);
    return frame;
};

/**
 * Invariants of the returned framer:
 * - a frame is emitted only once all of its bytes have arrived and its leading
 *   marker byte is 0x00. The header carries no checksum, so nothing else about
 *   a frame is validated: a lying length or type byte produces a lying frame;
 * - chunk boundaries are irrelevant: a frame split across any number of chunks is reassembled;
 * - frames are emitted in stream order;
 * - after a byte that is not the marker byte, the framer resyncs by skipping
 *   forward to the next 0x00. Because 0x00 also occurs inside payloads, a
 *   resync can land mid-frame: it may then emit a mis-typed frame or hold back
 *   valid frames until the announced length is satisfied. The wire format
 *   offers no stronger recovery, so callers must tolerate bogus frames;
 * - framer instances share no state: each returned instance carries its own buffer.
 */
export const createFrameParser = (): { push(chunk: Buffer): ReadData[] } => {
    let buffer = Buffer.alloc(0);
    return {
        push(chunk: Buffer): ReadData[] {
            buffer = Buffer.concat([buffer, chunk]);
            const frames: ReadData[] = [];
            while (buffer.length > 0) {
                if (buffer[0] !== 0x00) {
                    const sync = buffer.indexOf(0x00);
                    buffer = sync === -1 ? Buffer.alloc(0) : buffer.subarray(sync);
                    continue;
                }
                if (buffer.length < 3) {
                    break;
                }
                const total = 3 + buffer[1];
                if (buffer.length < total) {
                    break;
                }
                frames.push({
                    type: buffer[2],
                    payload: new Uint8Array(buffer.subarray(3, total)),
                });
                buffer = buffer.subarray(total);
            }
            return frames;
        },
    };
};
