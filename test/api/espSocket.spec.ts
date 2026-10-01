import { EspSocket } from '../../src/api/espSocket';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { HEADER_FIRST_BYTE } from '../../src/api/bytePositions';
import { type ReadData } from '../../src/api/espSocket';

interface MockNetSocket {
    emit(event: string, ...args: unknown[]): boolean;
}

const { registry } = vi.hoisted(() => ({
    registry: {
        instances: [] as object[],
        writes: [] as Uint8Array[],
    },
}));

vi.mock('net', async () => {
    const { EventEmitter } = await import('node:events');
    class MockSocket extends EventEmitter {
        public connecting = false;

        public connect(_port: number, _host: string): void {}

        public setTimeout(_timeout: number, _callback?: () => void): this {
            return this;
        }

        public end(_data?: Uint8Array | string): this {
            return this;
        }

        public destroy(): void {}

        public write(
            data: Uint8Array | string,
            _encoding?: BufferEncoding,
            callback?: (error?: Error | null) => void,
        ): boolean {
            registry.writes.push(data instanceof Uint8Array ? data : Buffer.from(data));
            callback?.(null);
            return true;
        }
    }
    class TrackedSocket extends MockSocket {
        constructor() {
            super();
            registry.instances.push(this);
        }
    }
    registry.instances = [];
    return { Socket: TrackedSocket, default: { Socket: TrackedSocket } };
});

const frame = (type: number, payload: number[]): Buffer =>
    Buffer.from([HEADER_FIRST_BYTE, payload.length, type, ...payload]);

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('EspSocket framing', () => {
    let espSocket: EspSocket;
    let mockSocket: MockNetSocket;
    let received: ReadData[];

    const openSocket = (): void => {
        espSocket.open();
        mockSocket = registry.instances.at(-1) as unknown as MockNetSocket;
        received = [];
        espSocket.espData$.subscribe((data: ReadData) => {
            received.push(data);
        });
    };

    beforeEach(() => {
        registry.writes = [];
        espSocket = new EspSocket('localhost', 6053);
        openSocket();
    });

    it('extracts type and payload from a single frame', () => {
        mockSocket.emit('data', frame(MessageTypes.HelloResponse, [0xde, 0xad, 0xbe, 0xef]));

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(MessageTypes.HelloResponse);
        expect([...received[0].payload]).toEqual([0xde, 0xad, 0xbe, 0xef]);
    });

    it('reassembles two frames arriving in a single chunk', () => {
        const chunk = Buffer.concat([
            frame(MessageTypes.HelloResponse, [0x01, 0x02]),
            frame(MessageTypes.PingResponse, [0x03]),
        ]);
        mockSocket.emit('data', chunk);

        expect(received.length).toBe(2);
        expect(received[0]?.type).toBe(MessageTypes.HelloResponse);
        expect([...received[0].payload]).toEqual([0x01, 0x02]);
        expect(received[1]?.type).toBe(MessageTypes.PingResponse);
        expect([...received[1].payload]).toEqual([0x03]);
    });

    it('serves several chunks one after another', () => {
        mockSocket.emit('data', frame(MessageTypes.ConnectResponse, [0x0a]));
        mockSocket.emit('data', frame(MessageTypes.DisconnectResponse, [0x0b, 0x0c]));

        expect(received.map(({ type }) => type)).toEqual([
            MessageTypes.ConnectResponse,
            MessageTypes.DisconnectResponse,
        ]);
    });

    it('emits an empty payload for a zero length frame', () => {
        mockSocket.emit('data', frame(MessageTypes.PingResponse, []));

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(MessageTypes.PingResponse);
        expect(received[0]?.payload.length).toBe(0);
    });

    it('passes unknown message types through unchanged', () => {
        mockSocket.emit('data', frame(99, [0x10]));

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(99);
        expect([...received[0].payload]).toEqual([0x10]);
    });

    it('drops chunks whose first byte is not the header byte', () => {
        mockSocket.emit('data', Buffer.from([0x01, 0x02, 0x03]));

        return flush().then(() => {
            expect(received.length).toBe(0);
        });
    });

    it('drops buffers shorter than the header size', () => {
        mockSocket.emit('data', Buffer.from([HEADER_FIRST_BYTE, 0x05]));

        return flush().then(() => {
            expect(received.length).toBe(0);
        });
    });

    it('ignores empty data events without emitting', () => {
        mockSocket.emit('data', Buffer.alloc(0));

        return flush().then(() => {
            expect(received.length).toBe(0);
        });
    });
});

describe('EspSocket sendEspMessage', () => {
    let espSocket: EspSocket;
    let mockSocket: MockNetSocket;

    beforeEach(() => {
        registry.writes = [];
        espSocket = new EspSocket('localhost', 6053);
        espSocket.open();
        mockSocket = registry.instances.at(-1) as unknown as MockNetSocket;
    });

    it('writes the esp frame layout once connected', async () => {
        mockSocket.emit('connect');
        await flush();

        espSocket.sendEspMessage(MessageTypes.ConnectRequest, new Uint8Array([0xde, 0xad]));

        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual([HEADER_FIRST_BYTE, 2, MessageTypes.ConnectRequest, 0xde, 0xad]);
    });

    it('withholds writes until the connection reports ready and flushes then', async () => {
        espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

        await flush();
        expect(registry.writes.length).toBe(0);

        mockSocket.emit('connect');
        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual([HEADER_FIRST_BYTE, 1, MessageTypes.HelloRequest, 0x11]);
    });

    it('encodes a zero payload into a bare three byte frame', async () => {
        mockSocket.emit('connect');
        await flush();

        espSocket.sendEspMessage(MessageTypes.PingResponse, new Uint8Array());

        await flush();
        expect([...registry.writes[0]]).toEqual([HEADER_FIRST_BYTE, 0, MessageTypes.PingResponse]);
    });
});
