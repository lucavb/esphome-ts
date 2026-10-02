import { EspSocket } from '../../src/api/espSocket';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { encodeFrame } from '../../src/api/framer';
import { type ReadData } from '../../src/api/espSocket';
import { firstValueFrom, TimeoutError } from 'rxjs';
import { take } from 'rxjs/operators';

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

const frame = (type: number, payload: number[]): Uint8Array => encodeFrame(type, Uint8Array.from(payload));

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('EspSocket framing', () => {
    let espSocket: EspSocket;
    let mockSocket: MockNetSocket;
    let received: ReadData[];

    const openSocket = (): void => {
        espSocket.open();
        mockSocket = registry.instances.at(-1) as unknown as MockNetSocket;
        mockSocket.emit('connect');
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

    it('reassembles a frame split across two chunks end to end', () => {
        const full = frame(MessageTypes.HelloResponse, [0x01, 0x02, 0x03]);
        mockSocket.emit('data', Buffer.from(full.subarray(0, 2)));
        mockSocket.emit('data', Buffer.from(full.subarray(2)));

        return flush().then(() => {
            expect(received.length).toBe(1);
            expect(received[0]?.type).toBe(MessageTypes.HelloResponse);
            expect([...received[0].payload]).toEqual([0x01, 0x02, 0x03]);
        });
    });

    it('delivers a split frame to every subscriber', async () => {
        const first: ReadData[] = [];
        const second: ReadData[] = [];
        espSocket.espData$.subscribe((data: ReadData) => first.push(data));
        espSocket.espData$.subscribe((data: ReadData) => second.push(data));

        const full = frame(MessageTypes.HelloResponse, [0x01, 0x02, 0x03]);
        mockSocket.emit('data', Buffer.from(full.subarray(0, 2)));
        mockSocket.emit('data', Buffer.from(full.subarray(2)));
        await flush();

        for (const subscriberFrames of [received, first, second]) {
            expect(subscriberFrames.length).toBe(1);
            expect(subscriberFrames[0]?.type).toBe(MessageTypes.HelloResponse);
            expect([...subscriberFrames[0].payload]).toEqual([0x01, 0x02, 0x03]);
        }
    });

    it('never leaks a partial frame from a dead connection into the next one', async () => {
        mockSocket.emit('data', Buffer.from([0x00, 0x03, MessageTypes.PingResponse, 0xaa]));
        mockSocket.emit('close');

        espSocket.open();
        mockSocket = registry.instances.at(-1) as unknown as MockNetSocket;
        mockSocket.emit('connect');
        mockSocket.emit('data', Buffer.from(frame(MessageTypes.HelloResponse, [0x01, 0x02])));
        await flush();

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(MessageTypes.HelloResponse);
        expect([...received[0].payload]).toEqual([0x01, 0x02]);
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

    it('skips garbage bytes and still parses a valid frame in the same chunk', () => {
        const chunk = Buffer.concat([Buffer.from([0x99, 0x88]), frame(MessageTypes.PingResponse, [0x07])]);
        mockSocket.emit('data', Buffer.from(chunk));

        return flush().then(() => {
            expect(received.length).toBe(1);
            expect(received[0]?.type).toBe(MessageTypes.PingResponse);
            expect([...received[0].payload]).toEqual([0x07]);
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
        expect([...registry.writes[0]]).toEqual([
            ...encodeFrame(MessageTypes.ConnectRequest, new Uint8Array([0xde, 0xad])),
        ]);
    });

    it('withholds writes until the connection reports ready and flushes then', async () => {
        espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

        await flush();
        expect(registry.writes.length).toBe(0);

        mockSocket.emit('connect');
        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual([...encodeFrame(MessageTypes.HelloRequest, new Uint8Array([0x11]))]);
    });

    it('abandons a pending send after five seconds without connect', async () => {
        vi.useFakeTimers();
        try {
            espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

            await vi.advanceTimersByTimeAsync(5000);
            expect(registry.writes.length).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it('routes the timeout of an abandoned send to error$', async () => {
        vi.useFakeTimers();
        try {
            const error = firstValueFrom(espSocket.error$.pipe(take(1)));
            espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

            await vi.advanceTimersByTimeAsync(5000);
            await expect(error).resolves.toBeInstanceOf(TimeoutError);
        } finally {
            vi.useRealTimers();
        }
    });

    it('routes an oversized payload to error$ without writing', async () => {
        mockSocket.emit('connect');
        await flush();

        const error = firstValueFrom(espSocket.error$.pipe(take(1)));
        espSocket.sendEspMessage(MessageTypes.LightCommandRequest, new Uint8Array(256));

        await expect(error).resolves.toBeInstanceOf(RangeError);
        expect(registry.writes.length).toBe(0);
    });

    it('stops a pending send when the socket terminates', async () => {
        espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

        espSocket.close();
        await flush();
        expect(registry.writes.length).toBe(0);
    });

    it('encodes a zero payload into a bare three byte frame', async () => {
        mockSocket.emit('connect');
        await flush();

        espSocket.sendEspMessage(MessageTypes.PingResponse, new Uint8Array());

        await flush();
        expect([...registry.writes[0]]).toEqual([...encodeFrame(MessageTypes.PingResponse, new Uint8Array())]);
    });
});
