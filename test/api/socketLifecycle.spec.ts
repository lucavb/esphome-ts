import { EspSocket } from '../../src/api/espSocket';
import { EspDevice } from '../../src/api/espDevice';

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

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('RxjsSocket lifecycle', () => {
    let espSocket: EspSocket;
    let mockSocket: MockNetSocket;

    const openSocket = (): void => {
        espSocket = new EspSocket('localhost', 6053);
        espSocket.open();
        mockSocket = registry.instances.at(-1) as unknown as MockNetSocket;
    };

    beforeEach(() => {
        registry.writes = [];
        openSocket();
    });

    it('flips connected$ to false on a graceful close', () => {
        const statuses: boolean[] = [];
        espSocket.connected$.subscribe((status: boolean) => statuses.push(status));

        mockSocket.emit('connect');
        expect(statuses).toEqual([false, true]);

        espSocket.close();
        expect(statuses).toEqual([false, true, false]);
    });

    it('drops a pending sendEspMessage on a plain close without writing', async () => {
        espSocket.sendEspMessage(1, new Uint8Array([0xde, 0xad]));

        espSocket.close();
        await flush();

        expect(registry.writes.length).toBe(0);
    });

    it('routes a late error after a graceful close to error$ without crashing', async () => {
        mockSocket.emit('connect');
        espSocket.close();

        const err = new Error('ECONNRESET');
        const errorPromise = new Promise<Error>((resolve) => espSocket.error$.subscribe(resolve));
        mockSocket.emit('error', err);

        await expect(errorPromise).resolves.toBe(err);
        expect(registry.writes.length).toBe(0);
    });
});

describe('EspDevice.terminate', () => {
    beforeEach(() => {
        registry.instances = [];
        registry.writes = [];
    });

    it('does not open a new socket during teardown', async () => {
        const device = new EspDevice('localhost');
        const mock = registry.instances.at(-1) as unknown as MockNetSocket;

        mock.emit('connect');
        await flush();

        device.terminate();
        await flush();

        expect(registry.instances.length).toBe(1);
    });
});
