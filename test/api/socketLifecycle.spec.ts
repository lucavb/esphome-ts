import { EspSocket } from '../../src/api/espSocket';
import { EspDevice, InvalidPasswordError } from '../../src/api/espDevice';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { encodeFrame } from '../../src/api/framer';
import {
    ConnectResponse,
    DeviceInfoResponse,
    HelloResponse,
    ListEntitiesDoneResponse,
} from '../../src/api/protobuf/api';
import { filter, firstValueFrom, take } from 'rxjs';
import { isTrue } from '../../src/api/booleans';

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

describe('EspDevice protocol handling', () => {
    const respond = (mock: MockNetSocket, type: MessageTypes, payload: Uint8Array): void => {
        mock.emit('data', Buffer.from(encodeFrame(type, payload)));
    };
    const hello = (): Uint8Array =>
        HelloResponse.encode({ serverInfo: 'demo', apiVersionMajor: 1, apiVersionMinor: 1 }).finish();
    const connectOk = (): Uint8Array => ConnectResponse.encode({ invalidPassword: false }).finish();
    const writtenTypes = (): number[] => registry.writes.map((write) => write[2]);
    // setImmediate stays real so flush() keeps working while rxjs timers are faked
    const fakeTimers = (): void => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    };

    let device: EspDevice;

    beforeEach(() => {
        registry.instances = [];
        registry.writes = [];
    });

    afterEach(() => {
        device.terminate();
        vi.useRealTimers();
    });

    it('retries a failing connection attempt', async () => {
        fakeTimers();
        device = new EspDevice('localhost');
        expect(registry.instances.length).toBe(1);

        (registry.instances[0] as MockNetSocket).emit('error', new Error('ECONNREFUSED'));
        await vi.advanceTimersByTimeAsync(1000);
        expect(registry.instances.length).toBe(2);

        (registry.instances[1] as MockNetSocket).emit('error', new Error('ECONNREFUSED'));
        await vi.advanceTimersByTimeAsync(1000);
        expect(registry.instances.length).toBe(3);
    });

    it('does not reconnect a healthy connection because of an unrelated send error', async () => {
        fakeTimers();
        device = new EspDevice('localhost');
        const mock = registry.instances[0] as MockNetSocket;
        mock.emit('connect');
        await flush();

        mock.emit('error', new Error('unrelated'));
        await vi.advanceTimersByTimeAsync(2000);

        expect(registry.instances.length).toBe(1);
    });

    it('reports an invalid password and stops the handshake', async () => {
        fakeTimers();
        device = new EspDevice('localhost');
        const mock = registry.instances[0] as MockNetSocket;
        const error = firstValueFrom(device.error$.pipe(take(1)));
        mock.emit('connect');
        await flush();

        respond(mock, MessageTypes.HelloResponse, hello());
        await flush();
        respond(mock, MessageTypes.ConnectResponse, ConnectResponse.encode({ invalidPassword: true }).finish());

        await expect(error).resolves.toBeInstanceOf(InvalidPasswordError);
        await vi.advanceTimersByTimeAsync(5000);
        expect(writtenTypes()).toEqual([MessageTypes.HelloRequest, MessageTypes.ConnectRequest]);
    });

    it('survives an undecodable device info response and rediscovers', async () => {
        fakeTimers();
        device = new EspDevice('localhost');
        const mock = registry.instances[0] as MockNetSocket;
        const error = firstValueFrom(device.error$.pipe(take(1)));
        mock.emit('connect');
        await flush();
        respond(mock, MessageTypes.HelloResponse, hello());
        await flush();
        respond(mock, MessageTypes.ConnectResponse, connectOk());
        await flush();

        respond(mock, MessageTypes.DeviceInfoResponse, new Uint8Array(10).fill(0xff));
        await expect(error).resolves.toBeInstanceOf(Error);

        // the handshake is redone on the same connection after the retry delay
        await vi.advanceTimersByTimeAsync(1000);
        respond(mock, MessageTypes.HelloResponse, hello());
        await flush();
        respond(mock, MessageTypes.ConnectResponse, connectOk());
        await flush();
        respond(
            mock,
            MessageTypes.DeviceInfoResponse,
            DeviceInfoResponse.encode({
                usesPassword: false,
                name: 'esp',
                macAddress: '00:00:00:00:00:01',
                esphomeVersion: '1.0',
                compilationTime: 'now',
                model: 'nodemcuv2',
                hasDeepSleep: false,
            }).finish(),
        );
        respond(mock, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());

        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);
        expect(device.deviceInfo?.name).toBe('esp');
    });
});
