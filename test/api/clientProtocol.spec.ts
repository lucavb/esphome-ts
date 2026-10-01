import { EspSocket } from '../../src/api/espSocket';
import { Client } from '../../src/api/client';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { HEADER_FIRST_BYTE } from '../../src/api/bytePositions';
import { ConnectRequest, DeviceInfoRequest, HelloRequest, PingRequest } from '../../src/api/protobuf/api';

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

const expectedFrame = (type: number, payload: Uint8Array): number[] => [
    HEADER_FIRST_BYTE,
    payload.length,
    type,
    ...payload,
];

describe('Client wire protocol', () => {
    let espSocket: EspSocket;
    let client: Client;

    beforeEach(async () => {
        registry.writes = [];
        espSocket = new EspSocket('localhost', 6053);
        client = new Client(espSocket);
        espSocket.open();
        const mockSocket = registry.instances.at(-1) as unknown as MockNetSocket;
        mockSocket.emit('connect');
        await flush();
    });

    it('hello() sends a HelloRequest frame', async () => {
        const payload = HelloRequest.encode({ clientInfo: 'x' }).finish();
        client.hello({ clientInfo: 'x' });

        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual(expectedFrame(MessageTypes.HelloRequest, payload));
    });

    it('connect() sends a ConnectRequest frame', async () => {
        const payload = ConnectRequest.encode({ password: '' }).finish();
        client.connect({ password: '' });

        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual(expectedFrame(MessageTypes.ConnectRequest, payload));
    });

    it('deviceInfo() sends a DeviceInfoRequest frame', async () => {
        const payload = DeviceInfoRequest.encode({}).finish();
        client.deviceInfo();

        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual(expectedFrame(MessageTypes.DeviceInfoRequest, payload));
    });

    it('ping() sends a PingRequest frame (not ConnectRequest)', async () => {
        const payload = PingRequest.encode({}).finish();
        client.ping();

        await flush();
        expect(registry.writes.length).toBe(1);
        expect([...registry.writes[0]]).toEqual(expectedFrame(MessageTypes.PingRequest, payload));
        expect([...registry.writes[0]][2]).toBe(MessageTypes.PingRequest);
        expect([...registry.writes[0]][2]).not.toBe(MessageTypes.ConnectRequest);
    });
});
