import { EspSocket, ConnectionHandshakeError } from '../../src/api/espSocket';
import { EspDevice, InvalidPasswordError } from '../../src/api/espDevice';
import { type Connection } from '../../src/api/connection';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { encodeFrame } from '../../src/api/framer';
import {
    ConnectRequest,
    ConnectResponse,
    DeviceInfoResponse,
    HelloResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesCoverResponse,
    ListEntitiesDoneResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    BinarySensorStateResponse,
    CoverStateResponse,
    LightStateResponse,
    SensorStateResponse,
    SwitchStateResponse,
    PingRequest,
} from '../../src/api/protobuf/api';
import { createInMemoryConnection, type InMemoryServerDriver } from '../testHelpers/inMemoryConnection';
import { filter, firstValueFrom, Subject, take } from 'rxjs';
import { isTrue } from '../../src/api/booleans';
import { CoverComponent } from '../../src/components/cover';
import { BinarySensorComponent, LightComponent, SensorComponent, SwitchComponent } from '../../src/components';
import { fallbackEntityId } from '../../src/api/helpers';

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

describe('Connection silent drop (in-memory)', () => {
    it('sinks a write issued while disconnected and records writes once connected', () => {
        const { connection, server } = createInMemoryConnection();

        expect(() => connection.write(new Uint8Array([0xde, 0xad]))).not.toThrow();
        expect(server.written).toEqual([]);

        server.connect();
        connection.write(new Uint8Array([0xde, 0xad]));
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual([0xde, 0xad]);
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
    const hello = (apiVersionMinor = 1): Uint8Array =>
        HelloResponse.encode({ serverInfo: 'demo', apiVersionMajor: 1, apiVersionMinor }).finish();
    const connectOk = (): Uint8Array => ConnectResponse.encode({ invalidPassword: false }).finish();
    const deviceInfo = (): Uint8Array =>
        DeviceInfoResponse.encode({
            usesPassword: false,
            name: 'esp',
            macAddress: '00:00:00:00:00:01',
            esphomeVersion: '1.0',
            compilationTime: 'now',
            model: 'nodemcuv2',
            hasDeepSleep: false,
        }).finish();
    const writtenTypes = (): number[] => server.written.map((write) => write[2]);
    // setImmediate stays real so flush() keeps working while rxjs timers are faked
    const fakeTimers = (): void => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
    };
    // Full handshake against the fake driver: hello → connect → device info
    // → list done (= discovery complete).
    const completeHandshake = async (): Promise<void> => {
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();
        respond(server, MessageTypes.DeviceInfoResponse, deviceInfo());
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);
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

    it('throttles a peer that closes before sending any data', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        server.connect();
        await flush();

        server.disconnect();
        await flush();

        expect(errors[0]).toBeInstanceOf(ConnectionHandshakeError);
        expect((errors[0] as Error).message).toContain('check the host/port');
        expect((errors[0] as Error).message).toContain('requires API encryption');
        expect((errors[0] as Error).message).not.toContain('uses API encryption');
        expect(opens()).toBe(1);
        await vi.advanceTimersByTimeAsync(1000);
        expect(opens()).toBe(2);
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

    it('discovers a modern device that does not respond to authentication', async () => {
        device = new EspDevice('localhost', '', 6053, { connection });
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello(14));
        await flush();

        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
        ]);
        respond(server, MessageTypes.DeviceInfoResponse, deviceInfo());
        await flush();
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);
        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
            MessageTypes.ListEntitiesRequest,
            MessageTypes.SubscribeStatesRequest,
        ]);
    });

    it('discovers modern entities after a varint-framed device info response', async () => {
        device = new EspDevice('localhost', '', 6053, { connection });
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello(19));
        await flush();

        // ESPHome 2026.10.2 includes friendly_name (field 13) even though our
        // older protobuf schema does not. This yields a 130-byte payload, whose
        // length must be encoded as the two-byte varint 0x82 0x01.
        const payload = Buffer.concat([
            DeviceInfoResponse.encode({
                usesPassword: false,
                name: 'esp',
                macAddress: '00:00:00:00:00:01',
                esphomeVersion: '2026.10.2',
                compilationTime: 'Nov 22 2026 10:00:00',
                model: 'nodemcuv2',
                hasDeepSleep: false,
            }).finish(),
            Buffer.from([0x6a, 60]),
            Buffer.alloc(60, 0x4c),
        ]);
        expect(payload.length).toBe(130);
        const frame = Buffer.concat([Buffer.from([0x00, 0x82, 0x01, MessageTypes.DeviceInfoResponse]), payload]);
        server.push(frame.subarray(0, 2));
        server.push(frame.subarray(2));
        await flush();

        expect(device.deviceInfo?.esphomeVersion).toBe('2026.10.2');
        expect(writtenTypes()).toContain(MessageTypes.ListEntitiesRequest);
        respond(
            server,
            MessageTypes.ListEntitiesSwitchResponse,
            ListEntitiesSwitchResponse.encode({
                ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                key: 42,
                name: 'Power',
            }).finish(),
        );
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);
        const component = device.components[fallbackEntityId(42)];
        expect(component).toBeInstanceOf(SwitchComponent);
        const state = firstValueFrom(component.state$);
        respond(
            server,
            MessageTypes.SwitchStateResponse,
            SwitchStateResponse.encode({ key: 42, state: true }).finish(),
        );
        expect(await state).toMatchObject({ key: 42, state: true });
    });

    it('reports an invalid password and latches it as terminal for auto-reconnect', async () => {
        fakeTimers();
        device = new EspDevice('localhost', 'wrong-password', 6053, { connection });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        server.connect();
        await flush();

        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        expect(ConnectRequest.decode(server.written[1].subarray(3)).password).toBe('wrong-password');
        respond(server, MessageTypes.ConnectResponse, ConnectResponse.encode({ invalidPassword: true }).finish());

        await flush();
        await vi.advanceTimersByTimeAsync(5000);
        expect(errors.length).toBe(1);
        expect(errors[0]).toBeInstanceOf(InvalidPasswordError);
        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
        ]);

        // the half-authenticated session is dropped and any later connect
        // flip must not re-fire tap→open→handshake: the password is fixed at
        // construction, so a rejection cannot fix itself
        server.disconnect();
        await flush();
        server.connect();
        await flush();
        await vi.advanceTimersByTimeAsync(5000);

        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
        ]);
        expect(errors.length).toBe(1);
    });

    it('still reports a delayed password rejection after discovery', async () => {
        device = new EspDevice('localhost', 'wrong-password', 6053, { connection });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        await completeHandshake();

        respond(server, MessageTypes.ConnectResponse, ConnectResponse.encode({ invalidPassword: true }).finish());
        await flush();

        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(InvalidPasswordError);
        expect(connection.isConnected()).toBe(false);
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

        // the handshake is redone on the same connection after the retry delay;
        // with defer() the retry re-runs the whole handshake factory, so a
        // fresh HelloRequest (plus Connect and DeviceInfo requests) is on the
        // wire instead of waiting for an unsolicited HelloResponse
        await vi.advanceTimersByTimeAsync(1000);
        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
            MessageTypes.HelloRequest,
        ]);
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

    it('updates cover stop support from negotiated API version across reconnects', async () => {
        device = new EspDevice('localhost', '', 6053, { connection });
        const objectId = 'cover_object_id';
        const coverResponse = ListEntitiesCoverResponse.encode({
            objectId,
            key: 7,
            name: 'Cover',
            uniqueId: 'cover_uid',
            assumedState: false,
            supportsPosition: true,
            supportsTilt: false,
            supportsStop: false,
            deviceClass: 'garage',
        }).finish();

        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello(7));
        await flush();
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();
        respond(server, MessageTypes.DeviceInfoResponse, deviceInfo());
        await flush();
        respond(server, MessageTypes.ListEntitiesCoverResponse, coverResponse);
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);

        const cover = device.components[objectId] as CoverComponent;
        expect(cover.supportsStop).toBe(true);

        server.disconnect();
        await flush();
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello(8));
        await flush();
        expect(cover.supportsStop).toBe(false);
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();
        respond(server, MessageTypes.DeviceInfoResponse, deviceInfo());
        await flush();
        respond(server, MessageTypes.ListEntitiesCoverResponse, coverResponse);
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        await flush();
        expect(cover.supportsStop).toBe(false);
    });

    it('preserves entity instances and routes state across reconnects with empty object IDs', async () => {
        device = new EspDevice('localhost', '', 6053, { connection });
        const respondEntities = (emptySwitchObjectId: boolean): void => {
            respond(
                server,
                MessageTypes.ListEntitiesBinarySensorResponse,
                ListEntitiesBinarySensorResponse.encode({
                    ...ListEntitiesBinarySensorResponse.decode(new Uint8Array()),
                    key: 201,
                    name: 'Door',
                }).finish(),
            );
            respond(
                server,
                MessageTypes.ListEntitiesCoverResponse,
                ListEntitiesCoverResponse.encode({
                    ...ListEntitiesCoverResponse.decode(new Uint8Array()),
                    key: 202,
                    name: 'Cover',
                }).finish(),
            );
            respond(
                server,
                MessageTypes.ListEntitiesSwitchResponse,
                ListEntitiesSwitchResponse.encode({
                    ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                    objectId: emptySwitchObjectId ? '' : 'legacy_switch_id',
                    key: 203,
                    name: 'Switch',
                }).finish(),
            );
            respond(
                server,
                MessageTypes.ListEntitiesLightResponse,
                ListEntitiesLightResponse.encode({
                    ...ListEntitiesLightResponse.decode(new Uint8Array()),
                    key: 204,
                    name: 'Light',
                }).finish(),
            );
            respond(
                server,
                MessageTypes.ListEntitiesSensorResponse,
                ListEntitiesSensorResponse.encode({
                    ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                    key: 205,
                    name: 'Sensor',
                }).finish(),
            );
            respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        };
        const completeDiscovery = async (switchObjectIdEmpty: boolean): Promise<void> => {
            server.connect();
            await flush();
            respond(server, MessageTypes.HelloResponse, hello());
            await flush();
            respond(server, MessageTypes.ConnectResponse, connectOk());
            await flush();
            respond(server, MessageTypes.DeviceInfoResponse, deviceInfo());
            await flush();
            respondEntities(switchObjectIdEmpty);
            await flush();
        };

        await completeDiscovery(false);
        const initial = { ...device.components };
        expect(Object.keys(initial).sort()).toEqual(
            [
                fallbackEntityId(201),
                fallbackEntityId(202),
                'legacy_switch_id',
                fallbackEntityId(204),
                fallbackEntityId(205),
            ].sort(),
        );
        const components = [
            initial[fallbackEntityId(201)] as BinarySensorComponent,
            initial[fallbackEntityId(202)] as CoverComponent,
            initial.legacy_switch_id as SwitchComponent,
            initial[fallbackEntityId(204)] as LightComponent,
            initial[fallbackEntityId(205)] as SensorComponent,
        ];

        server.disconnect();
        await flush();
        await completeDiscovery(true);

        expect(device.components.legacy_switch_id).toBe(components[2]);
        expect(device.components[fallbackEntityId(201)]).toBe(components[0]);
        expect(device.components[fallbackEntityId(202)]).toBe(components[1]);
        expect(device.components[fallbackEntityId(204)]).toBe(components[3]);
        expect(device.components[fallbackEntityId(205)]).toBe(components[4]);
        expect(Object.keys(device.components)).toHaveLength(5);

        const statePromises = components.map((component) => firstValueFrom(component.state$));
        respond(
            server,
            MessageTypes.BinarySensorStateResponse,
            BinarySensorStateResponse.encode({
                ...BinarySensorStateResponse.decode(new Uint8Array()),
                key: 201,
                state: true,
            }).finish(),
        );
        respond(
            server,
            MessageTypes.CoverStateResponse,
            CoverStateResponse.encode({
                ...CoverStateResponse.decode(new Uint8Array()),
                key: 202,
                position: 0.75,
            }).finish(),
        );
        respond(
            server,
            MessageTypes.SwitchStateResponse,
            SwitchStateResponse.encode({ key: 203, state: true }).finish(),
        );
        respond(
            server,
            MessageTypes.LightStateResponse,
            LightStateResponse.encode({
                ...LightStateResponse.decode(new Uint8Array()),
                key: 204,
                state: true,
                brightness: 0.5,
            }).finish(),
        );
        respond(
            server,
            MessageTypes.SensorStateResponse,
            SensorStateResponse.encode({
                ...SensorStateResponse.decode(new Uint8Array()),
                key: 205,
                state: 22.5,
            }).finish(),
        );
        await flush();
        const states = await Promise.all(statePromises);
        expect((states[0] as BinarySensorStateResponse).key).toBe(201);
        expect((states[1] as CoverStateResponse).key).toBe(202);
        expect((states[2] as SwitchStateResponse).key).toBe(203);
        expect((states[3] as LightStateResponse).key).toBe(204);
        expect((states[4] as SensorStateResponse).key).toBe(205);
        expect((states[0] as BinarySensorStateResponse).state).toBe(true);
        expect((states[1] as CoverStateResponse).position).toBe(0.75);
        expect((states[2] as SwitchStateResponse).state).toBe(true);
        expect((states[3] as LightStateResponse).brightness).toBe(0.5);
        expect((states[4] as SensorStateResponse).state).toBe(22.5);
    });

    it('re-arms auto-reconnect when provideRetryObservable is called after a password rejection', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, ConnectResponse.encode({ invalidPassword: true }).finish());
        await flush();
        await vi.advanceTimersByTimeAsync(5000);
        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
        ]);
        expect(errors.length).toBe(1);

        // re-providing a cadence is the explicit opt-in re-arm after a
        // password rejection: the next connect flip must run a fresh
        // handshake (HelloRequest back on the wire)
        device.provideRetryObservable(new Subject());
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, ConnectResponse.encode({ invalidPassword: true }).finish());
        await flush();

        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
        ]);
        // the re-armed handshake re-latches: the rejection marks auto-reconnect
        // terminal again
        expect(errors.length).toBe(2);
        expect(errors[1]).toBeInstanceOf(InvalidPasswordError);
    });

    it('drops a stale handshake retry when the connection comes back first', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        server.connect();
        await flush();
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();
        // garbage device info: the handshake fails and the retry timer(1000) arms
        respond(server, MessageTypes.DeviceInfoResponse, new Uint8Array(10).fill(0xff));
        await flush();

        // The fresh connection replaces the retrying handshake, cancelling its
        // armed timer, and starts handshake attempt #2.
        server.disconnect();
        await flush();
        server.connect();
        await flush();
        expect(writtenTypes()).toEqual([
            MessageTypes.HelloRequest,
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
            MessageTypes.HelloRequest,
        ]);

        await vi.advanceTimersByTimeAsync(1000);
        // the stale retry timer must not have fired a third handshake
        expect(writtenTypes().filter((type: MessageTypes) => type === MessageTypes.HelloRequest)).toHaveLength(2);

        // answer the fresh handshake and complete discovery
        respond(server, MessageTypes.HelloResponse, hello());
        await flush();
        respond(server, MessageTypes.ConnectResponse, connectOk());
        await flush();
        respond(server, MessageTypes.DeviceInfoResponse, deviceInfo());
        respond(server, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
        await expect(firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)))).resolves.toBe(true);
        expect(device.deviceInfo?.name).toBe('esp');
    });

    it('cancels an armed error-retry on terminate without re-opening', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        await completeHandshake();

        // arm the error-reconnect driver's timer(1000)
        const opensBefore = opens();
        server.emitError(new Error('boom'));
        await flush();
        device.terminate();
        await flush();
        await vi.advanceTimersByTimeAsync(3000);

        // terminate() unsubscribed the driver, cancelling the armed timer:
        // no re-open may happen across terminate + advance
        expect(opens() - opensBefore).toBe(0);
    });

    it('replaces a previous retry cadence instead of stacking them', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        // device stays disconnected: the cadences decide when to re-open
        const first$ = new Subject<void>();
        const second$ = new Subject<void>();

        device.provideRetryObservable(first$);
        device.provideRetryObservable(second$);
        await flush();
        const opensBefore = opens();

        // the first cadence was unsubscribed by the second provide call
        first$.next();
        await flush();
        expect(opens()).toBe(opensBefore);

        // the replacement cadence drives exactly one re-open
        second$.next();
        await flush();
        expect(opens()).toBe(opensBefore + 1);
    });

    it('reports a disconnect and the next connection through alive$', () => {
        device = new EspDevice('localhost', '', 6053, { connection });
        const states: boolean[] = [];
        const subscription = device.alive$.subscribe((alive) => states.push(alive));

        server.connect();
        server.disconnect();
        server.connect();

        expect(states).toEqual([false, true, false, true]);
        subscription.unsubscribe();
    });

    it('recovers alive$ when the watchdog expires without a disconnect', async () => {
        fakeTimers();
        device = new EspDevice('localhost', '', 6053, { connection });
        await completeHandshake();

        // subscribed after discovery: the seeded transport state replays
        const states: boolean[] = [];
        device.alive$.subscribe((alive: boolean) => states.push(alive));
        expect(states).toEqual([true]);

        // a frame re-arms the watchdog; the expiry at PING_TIMEOUT surfaces
        // as false-ish liveness WITHOUT dropping the transport
        respond(server, MessageTypes.PingRequest, PingRequest.encode({}).finish());
        await flush();
        await vi.advanceTimersByTimeAsync(91_000);
        expect(states).toEqual([true, false]);
        expect(connection.isConnected()).toBe(true);

        // a later frame re-arms the lapsed watchdog while the transport stays
        // connected
        respond(server, MessageTypes.PingRequest, PingRequest.encode({}).finish());
        await flush();
        expect(states).toEqual([true, false, true]);
    });
});
