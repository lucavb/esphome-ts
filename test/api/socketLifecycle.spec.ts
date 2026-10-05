import { EspSocket } from '../../src/api/espSocket';
import { EspDevice, InvalidPasswordError } from '../../src/api/espDevice';
import { type Connection } from '../../src/api/connection';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { encodeFrame } from '../../src/api/framer';
import {
    ConnectResponse,
    DeviceInfoResponse,
    HelloResponse,
    ListEntitiesDoneResponse,
} from '../../src/api/protobuf/api';
import { createInMemoryConnection, type InMemoryServerDriver } from '../testHelpers/inMemoryConnection';
import { filter, firstValueFrom, take } from 'rxjs';
import { isTrue } from '../../src/api/booleans';

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('EspSocket teardown', () => {
    let espSocket: EspSocket;
    let server: InMemoryServerDriver;

    const openSocket = (): void => {
        const inMemory = createInMemoryConnection();
        espSocket = new EspSocket('localhost', 6053, { connection: inMemory.connection });
        server = inMemory.server;
        espSocket.open();
    };

    beforeEach(() => {
        openSocket();
    });

    it('flips connected$ to false on terminate', () => {
        const statuses: boolean[] = [];
        espSocket.connected$.subscribe((status: boolean) => statuses.push(status));

        server.connect();
        expect(statuses).toEqual([false, true]);

        espSocket.terminate();
        expect(statuses).toEqual([false, true, false]);
    });

    it('drops a pending sendEspMessage on a terminate without writing', async () => {
        espSocket.sendEspMessage(1, new Uint8Array([0xde, 0xad]));

        espSocket.terminate();
        await flush();
        // even a reconnect afterwards must not flush the dropped send
        server.connect();
        await flush();

        expect(server.written.length).toBe(0);
    });

    it('routes a late error after a graceful terminate to error$ without crashing', async () => {
        server.connect();
        espSocket.terminate();

        const err = new Error('ECONNRESET');
        const errorPromise = new Promise<Error>((resolve) => {
            espSocket.error$.subscribe((error: unknown) => resolve(error as Error));
        });
        server.emitError(err);

        await expect(errorPromise).resolves.toBe(err);
        expect(server.written.length).toBe(0);
    });
});

describe('EspDevice.terminate', () => {
    it('does not open a new connection during teardown', async () => {
        const inMemory = createInMemoryConnection();
        let opens = 0;
        const counted: Connection = {
            ...inMemory.connection,
            open: (): void => {
                opens += 1;
                inMemory.connection.open();
            },
        };

        const device = new EspDevice('localhost', '', 6053, { connection: counted });
        expect(opens).toBe(1);

        inMemory.server.connect();
        await flush();

        device.terminate();
        await flush();

        expect(opens).toBe(1);
        expect(inMemory.connection.isConnected()).toBe(false);
    });
});

describe('EspDevice protocol handling', () => {
    const respond = (driver: InMemoryServerDriver, type: MessageTypes, payload: Uint8Array): void => {
        driver.push(Buffer.from(encodeFrame(type, payload)));
    };
    const hello = (): Uint8Array =>
        HelloResponse.encode({ serverInfo: 'demo', apiVersionMajor: 1, apiVersionMinor: 1 }).finish();
    const connectOk = (): Uint8Array => ConnectResponse.encode({ invalidPassword: false }).finish();
    const writtenTypes = (): number[] => server.written.map((write) => write[2]);
    // setImmediate stays real so flush() keeps working while rxjs timers are faked
    const fakeTimers = (): void => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    };

    let device: EspDevice;
    let connection: Connection;
    let server: InMemoryServerDriver;
    let opens: () => number;
    let opensCount = 0;

    beforeEach(() => {
        const inMemory = createInMemoryConnection();
        connection = {
            ...inMemory.connection,
            open: (): void => {
                opensCount += 1;
                inMemory.connection.open();
            },
        };
        server = inMemory.server;
        opens = () => opensCount;
        opensCount = 0;
    });

    afterEach(() => {
        device.terminate();
        vi.useRealTimers();
    });

    it('retries a failing connection attempt', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        expect(opens()).toBe(1);

        server.emitError(new Error('ECONNREFUSED'));
        await vi.advanceTimersByTimeAsync(1000);
        expect(opens()).toBe(2);

        server.emitError(new Error('ECONNREFUSED'));
        await vi.advanceTimersByTimeAsync(1000);
        expect(opens()).toBe(3);
    });

    it('does not reconnect a healthy connection because of an unrelated send error', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        server.connect();
        await flush();

        server.emitError(new Error('unrelated'));
        await vi.advanceTimersByTimeAsync(2000);

        expect(opens()).toBe(1);
    });

    it('reports an invalid password and stops the handshake', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        const error = firstValueFrom(device.error$.pipe(take(1)));
        server.connect();
        await flush();

        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, ConnectResponse.encode({ invalidPassword: true }).finish());

        await expect(error).resolves.toBeInstanceOf(InvalidPasswordError);
        await vi.advanceTimersByTimeAsync(5000);
        expect(writtenTypes()).toEqual([MessageTypes.HelloRequest, MessageTypes.ConnectRequest]);
    });

    it('survives an undecodable device info response and rediscovers', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        const error = firstValueFrom(device.error$.pipe(take(1)));
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();

        respond(server, MessageTypes.DeviceInfoResponse, new Uint8Array(10).fill(0xff));
        await expect(error).resolves.toBeInstanceOf(Error);

        // the handshake is redone on the same connection after the retry delay
        await vi.advanceTimersByTimeAsync(1000);
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();
        respond(
            server,
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
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());

        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);
        expect(device.deviceInfo?.name).toBe('esp');
    });
});
