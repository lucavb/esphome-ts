import { createFrameParser, encodeFrame, type ReadData } from '../../src/api/framer';
import { MessageTypes } from '../../src/api/requestResponseMatching';

const frame = (type: number, payload: number[]): Buffer => Buffer.from([0x00, payload.length, type, ...payload]);

const parser = (): { push(chunk: Buffer): ReadData[] } => createFrameParser();

describe('frame parser reassembly', () => {
    it('extracts a single frame from one chunk', () => {
        const result = parser().push(frame(MessageTypes.HelloResponse, [0xde, 0xad, 0xbe, 0xef]));

        expect(result.length).toBe(1);
        expect(result[0].type).toBe(MessageTypes.HelloResponse);
        expect([...result[0].payload]).toEqual([0xde, 0xad, 0xbe, 0xef]);
    });

    it('extracts two frames arriving in one chunk in order', () => {
        const chunk = Buffer.concat([
            frame(MessageTypes.HelloResponse, [0x01, 0x02]),
            frame(MessageTypes.PingResponse, [0x03]),
        ]);

        const result = parser().push(chunk);

        expect(result.map(({ type }) => type)).toEqual([MessageTypes.HelloResponse, MessageTypes.PingResponse]);
        expect([...result[0].payload]).toEqual([0x01, 0x02]);
        expect([...result[1].payload]).toEqual([0x03]);
    });

    it('reassembles a frame split across two chunks', () => {
        const full = frame(MessageTypes.HelloResponse, [0x01, 0x02, 0x03]);
        const instance = parser();

        const first = instance.push(full.subarray(0, 2));
        expect(first).toEqual([]);

        const second = instance.push(full.subarray(2));
        expect(second.length).toBe(1);
        expect(second[0].type).toBe(MessageTypes.HelloResponse);
        expect([...second[0].payload]).toEqual([0x01, 0x02, 0x03]);
    });

    it.each(
        [...Array(frame(MessageTypes.PingRequest, [1, 2, 3, 4, 5, 6, 7, 8]).length - 1).keys()].map((split) => [
            split + 1,
        ]),
    )('reassembles an eight byte payload frame split at every byte boundary (split index %i)', (splitIndex: number) => {
        const full = frame(MessageTypes.PingRequest, [1, 2, 3, 4, 5, 6, 7, 8]);
        const instance = parser();

        const first = instance.push(full.subarray(0, splitIndex));
        const second = instance.push(full.subarray(splitIndex));

        expect(first).toEqual([]);
        expect(second.length).toBe(1);
        expect(second[0].type).toBe(MessageTypes.PingRequest);
        expect([...second[0].payload]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    it('reassembles frames straddling chunks mid-stream in order', () => {
        const frameB = frame(MessageTypes.PingResponse, [0x1b, 0x2b, 0x3b]);
        const instance = parser();

        const first = instance.push(Buffer.concat([frame(MessageTypes.HelloResponse, [0x0a]), frameB.subarray(0, 4)]));
        const second = instance.push(
            Buffer.concat([frameB.subarray(4), frame(MessageTypes.DisconnectResponse, [0x0c])]),
        );

        expect(first.length).toBe(1);
        expect(first[0].type).toBe(MessageTypes.HelloResponse);
        expect(second.map(({ type }) => type)).toEqual([MessageTypes.PingResponse, MessageTypes.DisconnectResponse]);
        expect([...second[0].payload]).toEqual([0x1b, 0x2b, 0x3b]);
    });

    it('skips garbage bytes and resyncs on the next header byte', () => {
        const chunk = Buffer.concat([Buffer.from([0x01, 0xaa]), frame(MessageTypes.HelloResponse, [0x07])]);

        const result = parser().push(chunk);

        expect(result.length).toBe(1);
        expect(result[0].type).toBe(MessageTypes.HelloResponse);
        expect([...result[0].payload]).toEqual([0x07]);
    });

    it('drops garbage without any header byte and still parses the next chunk', () => {
        const instance = parser();

        const first = instance.push(Buffer.from([0x01, 0x02, 0x03]));
        const second = instance.push(frame(MessageTypes.PingResponse, [0x09]));

        expect(first).toEqual([]);
        expect(second.length).toBe(1);
        expect(second[0].type).toBe(MessageTypes.PingResponse);
        expect([...second[0].payload]).toEqual([0x09]);
    });

    it('resyncs onto a header byte inside garbage and takes the bytes after it as that frame', () => {
        const result = parser().push(Buffer.from([0x88, 0x00, 0x02, 0x07, 0x41, 0x42]));

        expect(result.length).toBe(1);
        expect(result[0].type).toBe(7);
        expect([...result[0].payload]).toEqual([0x41, 0x42]);
    });

    it('holds back after a resync until the announced length has arrived', () => {
        const instance = parser();

        expect(instance.push(Buffer.from([0xff, 0x00, 0x04, 0x07]))).toEqual([]);
        const result = instance.push(Buffer.from([0x51, 0x52, 0x53, 0x54]));

        expect(result.length).toBe(1);
        expect([...result[0].payload]).toEqual([0x51, 0x52, 0x53, 0x54]);
    });

    it('reassembles a stream of frames fed one byte at a time', () => {
        const stream = Buffer.concat([
            frame(MessageTypes.HelloResponse, [0x01]),
            frame(MessageTypes.PingResponse, [0x02, 0x03]),
            frame(MessageTypes.PingResponse, []),
        ]);
        const instance = parser();
        const frames: ReadData[] = [];

        for (let index = 0; index < stream.length; index++) {
            frames.push(...instance.push(stream.subarray(index, index + 1)));
        }

        expect(frames.map(({ type }) => type)).toEqual([
            MessageTypes.HelloResponse,
            MessageTypes.PingResponse,
            MessageTypes.PingResponse,
        ]);
        expect([...frames[1].payload]).toEqual([0x02, 0x03]);
    });

    describe('payload of exactly 255 bytes', () => {
        const payload = Array.from({ length: 255 }, (_, i) => i & 0xff);

        it('parses in a single chunk', () => {
            const result = parser().push(frame(MessageTypes.DeviceInfoResponse, payload));

            expect(result.length).toBe(1);
            expect(result[0].type).toBe(MessageTypes.DeviceInfoResponse);
            expect([...result[0].payload]).toEqual(payload);
        });

        it('parses reassembled across a chunk split', () => {
            const full = frame(MessageTypes.DeviceInfoResponse, payload);
            const instance = parser();

            const first = instance.push(full.subarray(0, 130));
            const second = instance.push(full.subarray(130));

            expect(first).toEqual([]);
            expect(second.length).toBe(1);
            expect(second[0].type).toBe(MessageTypes.DeviceInfoResponse);
            expect([...second[0].payload]).toEqual(payload);
        });
    });

    it('keeps two parser instances isolated from each other', () => {
        const instanceA = parser();
        const instanceB = parser();
        const full = frame(MessageTypes.HelloResponse, [0x01, 0x02]);

        expect(instanceA.push(full).length).toBe(1);
        expect(instanceA.push(Buffer.from([0x99]))).toEqual([]);

        expect(instanceB.push(full.subarray(0, 3))).toEqual([]);
        expect(instanceB.push(full.subarray(3)).length).toBe(1);
    });
});

describe('encodeFrame', () => {
    it('round-trips through the parser', () => {
        const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

        const result = parser().push(Buffer.from(encodeFrame(MessageTypes.HelloRequest, payload)));

        expect(result.length).toBe(1);
        expect(result[0].type).toBe(MessageTypes.HelloRequest);
        expect([...result[0].payload]).toEqual([0xde, 0xad, 0xbe, 0xef]);
    });

    it('throws a RangeError for an oversized payload', () => {
        expect(() => encodeFrame(MessageTypes.PingRequest, new Uint8Array(256))).toThrow(RangeError);
    });

    it('accepts a payload of exactly 255 bytes', () => {
        const encoded = encodeFrame(MessageTypes.DeviceInfoResponse, new Uint8Array(255).fill(0xab));

        expect(encoded.length).toBe(258);
        expect([...encoded.subarray(0, 3)]).toEqual([0x00, 255, MessageTypes.DeviceInfoResponse]);
    });

    it('pins the exact byte layout of a frame with payload', () => {
        const encoded = encodeFrame(MessageTypes.HelloRequest, new Uint8Array([1, 2, 3]));

        expect([...encoded]).toEqual([0x00, 0x03, MessageTypes.HelloRequest, 1, 2, 3]);
    });
});
