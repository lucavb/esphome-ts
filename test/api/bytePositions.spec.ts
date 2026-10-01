import { BytePositions, HEADER_FIRST_BYTE, HEADER_SIZE } from '../../src/api/bytePositions';
import { MessageTypes } from '../../src/api/requestResponseMatching';

describe('byte positions', () => {
    it('uses a three byte header', () => {
        expect(HEADER_SIZE).toBe(3);
    });

    it('uses 0x00 as the fixed first header byte', () => {
        expect(HEADER_FIRST_BYTE).toBe(0x00);
    });

    it('lays out the header as [zero, length, type]', () => {
        expect(BytePositions.ZERO).toBe(0);
        expect(BytePositions.LENGTH).toBe(1);
        expect(BytePositions.TYPE).toBe(2);
    });

    it('starts the payload directly after the header', () => {
        expect(BytePositions.PAYLOAD).toBe(3);
        expect(BytePositions.PAYLOAD).toBe(HEADER_SIZE);
    });

    it('freezes the wire invariants between header size and byte positions', () => {
        expect(HEADER_SIZE).toBe(BytePositions.PAYLOAD - BytePositions.ZERO);
        expect(BytePositions.TYPE).toBe(BytePositions.LENGTH + 1);
    });

    describe('frame layout implied by the constants', () => {
        const frame = (type: number, payload: number[]): Buffer =>
            Buffer.from([HEADER_FIRST_BYTE, payload.length, type, ...payload]);

        it.each([
            [MessageTypes.HelloResponse, []],
            [MessageTypes.HelloResponse, [0xde, 0xad, 0xbe, 0xef]],
            [MessageTypes.PingResponse, [0x01]],
        ])('frames type %i from header size plus payload length', (type, payload) => {
            const framed = frame(type, payload);
            expect(framed.length).toBe(HEADER_SIZE + payload.length);
            expect(framed.readUInt8(BytePositions.ZERO)).toBe(HEADER_FIRST_BYTE);
            expect(framed.readUInt8(BytePositions.LENGTH)).toBe(payload.length);
            expect(framed.readUInt8(BytePositions.TYPE)).toBe(type);
            for (const [index, byte] of payload.entries()) {
                expect(framed.readUInt8(BytePositions.PAYLOAD + index)).toBe(byte);
            }
        });

        it('does not reserve space for a payload in the header itself', () => {
            const framed = frame(MessageTypes.ConnectResponse, [0x01, 0x02, 0x03]);
            expect(framed.readUInt8(BytePositions.TYPE)).toBe(framed.readUInt8(BytePositions.PAYLOAD - 1));
            expect(framed.length - HEADER_SIZE).toBe(3);
        });
    });
});
