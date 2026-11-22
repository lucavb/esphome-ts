import { createFrameParser, encodeFrame, type ReadData } from '../../src/api/framer';
import { MessageTypes } from '../../src/api/requestResponseMatching';

const varint = (value: number): number[] => {
    const bytes: number[] = [];
    while (value >= 0x80) {
        bytes.push((value & 0x7f) | 0x80);
        value = Math.floor(value / 0x80);
    }
    return [...bytes, value];
};

const frame = (type: number, payload: number[]): Buffer =>
    Buffer.from([0x00, ...varint(payload.length), ...varint(type), ...payload]);

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

    it.each([
        [127, [0x7f]],
        [128, [0x80, 0x01]],
        [255, [0xff, 0x01]],
        [256, [0x80, 0x02]],
        [16384, [0x80, 0x80, 0x01]],
        [65535, [0xff, 0xff, 0x03]],
    ])('parses the independent wire fixture for a %i-byte payload', (size, lengthBytes) => {
        const payload = new Uint8Array(size).fill(0xab);
        // Explicit protocol bytes (rather than encodeFrame output) keep this a
        // wire fixture and catch a matching encoder/parser bug.
        const fixture = Buffer.from([0x00, ...lengthBytes, 0x0a, ...payload]);
        const result = parser().push(fixture);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(MessageTypes.DeviceInfoResponse);
        expect(result[0].payload).toEqual(payload);
    });

    it.each([1, 2, 3, 4, 5])('reassembles a frame split at header boundary %i', (splitIndex) => {
        // length 128 => 80 01; message type 300 => ac 02.
        const fixture = Buffer.concat([Buffer.from([0x00, 0x80, 0x01, 0xac, 0x02]), Buffer.alloc(128, 0xaa)]);
        const instance = parser();

        expect(instance.push(fixture.subarray(0, splitIndex))).toEqual([]);
        const result = instance.push(fixture.subarray(splitIndex));
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(300);
        expect(result[0].payload).toHaveLength(128);
        expect([...result[0].payload.subarray(0, 2)]).toEqual([0xaa, 0xaa]);
    });

    it('drops an over-limit payload header and resynchronizes at the next marker', () => {
        const result = parser().push(Buffer.from([0x00, 0x80, 0x80, 0x04, 0x00, 0x01, 0x07, 0xaa]));

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(7);
        expect([...result[0].payload]).toEqual([0xaa]);
    });

    it('drops overlong length and type varints without retaining an unbounded header', () => {
        const instance = parser();
        expect(instance.push(Buffer.from([0x00, 0x80, 0x80, 0x80, 0x80, 0x80]))).toEqual([]);
        // The invalid fifth byte was rejected, so this independent frame is parsed immediately.
        const result = instance.push(Buffer.from([0x00, 0x01, 0x80, 0x80, 0x80, 0x80, 0x10, 0x00, 0x00, 0x07]));
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe(7);
    });

    it('accepts the largest message type and skips one above the firmware limit', () => {
        const result = parser().push(
            Buffer.from([0x00, 0x00, 0xff, 0xff, 0x03, 0x00, 0x00, 0x80, 0x80, 0x04, 0x00, 0x00, 0x07]),
        );
        expect(result.map(({ type }) => type)).toEqual([65535, 7]);
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

    it('throws a RangeError for a payload above the 65535-byte limit', () => {
        expect(() => encodeFrame(MessageTypes.PingRequest, new Uint8Array(65536))).toThrow(RangeError);
    });

    it.each([
        [127, [0x7f]],
        [128, [0x80, 0x01]],
        [255, [0xff, 0x01]],
        [256, [0x80, 0x02]],
        [16384, [0x80, 0x80, 0x01]],
        [65535, [0xff, 0xff, 0x03]],
    ])('encodes exact independent bytes for a %i-byte payload', (size, lengthBytes) => {
        const payload = new Uint8Array(size).fill(0xab);
        const encoded = encodeFrame(MessageTypes.DeviceInfoResponse, payload);
        expect([...encoded]).toEqual([0x00, ...lengthBytes, 0x0a, ...payload]);
    });

    it('encodes a multibyte message type and keeps short frames correct', () => {
        expect([...encodeFrame(MessageTypes.HelloRequest, new Uint8Array([1, 2, 3]))]).toEqual([
            0x00, 0x03, 0x01, 1, 2, 3,
        ]);
        expect([...encodeFrame(300 as MessageTypes, new Uint8Array([0xaa]))]).toEqual([0x00, 0x01, 0xac, 0x02, 0xaa]);
    });

    it('accepts uint16 message types and rejects out-of-range types', () => {
        expect([...encodeFrame(65535 as MessageTypes, new Uint8Array())]).toEqual([0x00, 0x00, 0xff, 0xff, 0x03]);
        expect(() => encodeFrame(-1 as MessageTypes, new Uint8Array())).toThrow(RangeError);
        expect(() => encodeFrame(65536 as MessageTypes, new Uint8Array())).toThrow(RangeError);
        expect(() => encodeFrame(1.5 as MessageTypes, new Uint8Array())).toThrow(RangeError);
    });
});
