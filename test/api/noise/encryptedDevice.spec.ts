import { firstValueFrom, filter, take, Subject } from 'rxjs';
import { EspDevice } from '../../../src/api/espDevice';
import { ConnectionHandshakeError, EspSocket } from '../../../src/api/espSocket';
import {
    EncryptionHandshakeError,
    EncryptionPlaintextError,
    EncryptionRequiredError,
    InvalidEncryptionKeyError,
    InvalidEncryptionKeyFormatError,
} from '../../../src/api/noise/errors';
import { encodeNoiseFrame } from '../../../src/api/noise/frameCodec';
import { encodeFrame } from '../../../src/api/framer';
import { MessageTypes } from '../../../src/api/requestResponseMatching';
import { type ReadData } from '../../../src/api/framer';
import { type Connection } from '../../../src/api/connection';
import {
    ConnectRequest,
    ConnectResponse,
    DeviceInfoResponse,
    HelloResponse,
    ListEntitiesDoneResponse,
    ListEntitiesSwitchResponse,
    SwitchCommandRequest,
} from '../../../src/api/protobuf/api';
import { fallbackEntityId } from '../../../src/components/componentKinds';
import { SwitchComponent } from '../../../src/components';
import { createInMemoryConnection, type InMemoryServerDriver } from '../../testHelpers/inMemoryConnection';
import { NoiseServer } from './noiseServer';

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const psk = Buffer.alloc(32, 7);
const encryptionKey = psk.toString('base64');

const helloResponse = (): Uint8Array =>
    HelloResponse.encode({ serverInfo: 'demo', apiVersionMajor: 1, apiVersionMinor: 1 }).finish();

const connectResponse = (): Uint8Array => ConnectResponse.encode({ invalidPassword: false }).finish();

const deviceInfoResponse = (): Uint8Array =>
    DeviceInfoResponse.encode({
        usesPassword: false,
        name: 'kitchen',
        macAddress: 'AA:BB:CC:DD:EE:FF',
        esphomeVersion: '2026.11.0',
        compilationTime: 'now',
        model: 'esp32',
        hasDeepSleep: false,
    }).finish();

const serverHello = (name: string, mac?: string): Uint8Array => {
    const parts = [Buffer.from([0x01]), Buffer.from(`${name}\0`, 'utf8')];
    if (mac !== undefined) {
        parts.push(Buffer.from(`${mac}\0`, 'utf8'));
    }
    return encodeNoiseFrame(Buffer.concat(parts));
};

describe('EspDevice with API encryption', () => {
    let device: EspDevice | undefined;
    let connection: Connection;
    let driver: InMemoryServerDriver;
    let encryptedServer: NoiseServer;
    let opens = 0;

    beforeEach(() => {
        const inMemory = createInMemoryConnection();
        driver = inMemory.server;
        connection = {
            ...inMemory.connection,
            open: (): void => {
                opens += 1;
                inMemory.connection.open();
            },
        };
        encryptedServer = new NoiseServer({ psk, name: 'kitchen', mac: 'AA:BB:CC:DD:EE:FF' });
        opens = 0;
    });

    afterEach(() => {
        device?.terminate();
        vi.useRealTimers();
    });

    // Feed every client write through the responder and push its replies back.
    // Returns the application frames the device decrypted.
    const pump = async (): Promise<ReadData[]> => {
        await flush();
        const outbound = driver.written.splice(0, driver.written.length);
        if (outbound.length === 0) {
            return [];
        }
        const { frames, writes } = encryptedServer.receive(Buffer.concat(outbound.map((chunk) => Buffer.from(chunk))));
        for (const write of writes) {
            driver.push(Buffer.from(write));
        }
        await flush();
        return frames;
    };

    const switchEntityResponse = (): Uint8Array =>
        ListEntitiesSwitchResponse.encode({
            ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
            key: 42,
            name: 'Power',
        }).finish();

    // The second write of a fresh Noise generation is the msg1 frame:
    // [0x01][BE16 len][0x00 status][32-byte client ephemeral][...].
    const clientEphemeral = (): string => {
        const frame = Buffer.from(driver.written[1] ?? new Uint8Array());
        return frame.subarray(4, 36).toString('hex');
    };

    // Drive one complete encrypted handshake + discovery round. The caller has
    // already connected the transport; encryptedServer must be fresh for this
    // connection generation.
    const completeSession = async (): Promise<void> => {
        expect(await pump()).toEqual([]);
        expect((await pump()).map(({ type }) => type)).toEqual([MessageTypes.HelloRequest]);

        driver.push(Buffer.from(encryptedServer.seal(MessageTypes.HelloResponse, helloResponse())));
        await flush();
        expect((await pump()).map(({ type }) => type)).toEqual([
            MessageTypes.ConnectRequest,
            MessageTypes.DeviceInfoRequest,
        ]);

        driver.push(Buffer.from(encryptedServer.seal(MessageTypes.ConnectResponse, connectResponse())));
        driver.push(Buffer.from(encryptedServer.seal(MessageTypes.DeviceInfoResponse, deviceInfoResponse())));
        await flush();
        expect((await pump()).map(({ type }) => type)).toEqual([
            MessageTypes.ListEntitiesRequest,
            MessageTypes.SubscribeStatesRequest,
        ]);

        driver.push(Buffer.from(encryptedServer.seal(MessageTypes.ListEntitiesSwitchResponse, switchEntityResponse())));
        driver.push(
            Buffer.from(
                encryptedServer.seal(
                    MessageTypes.ListEntitiesDoneResponse,
                    ListEntitiesDoneResponse.encode({}).finish(),
                ),
            ),
        );
        await flush();
    };

    it('rejects a malformed encryption key at construction', () => {
        expect(() => new EspSocket('localhost', 6053, { encryptionKey: 'not a key' })).toThrow(
            InvalidEncryptionKeyFormatError,
        );
    });

    it('treats an empty encryption key as absent', () => {
        expect(() => new EspSocket('localhost', 6053, { encryptionKey: '' })).not.toThrow();
        expect(() => new EspSocket('localhost', 6053, { encryptionKey: '   ' })).not.toThrow();
    });

    it('discovers an encrypted device end to end', async () => {
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const discovered = firstValueFrom(
            device.discovery$.pipe(
                filter((value) => value),
                take(1),
            ),
        );
        driver.connect();
        await completeSession();

        await expect(discovered).resolves.toBe(true);
        expect(device.deviceInfo?.name).toBe('kitchen');
        expect(device.components[fallbackEntityId(42)]).toBeInstanceOf(SwitchComponent);
    });

    it('re-handshakes with a fresh session on reconnect and carries commands through it', async () => {
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        const discovered = firstValueFrom(
            device.discovery$.pipe(
                filter((value) => value),
                take(1),
            ),
        );
        driver.connect();
        await flush();
        const firstEphemeral = clientEphemeral();
        expect(firstEphemeral).toHaveLength(64);
        await completeSession();
        await expect(discovered).resolves.toBe(true);
        const power = device.components[fallbackEntityId(42)] as SwitchComponent;

        driver.disconnect();
        await flush();
        // A ready-session drop is a normal reconnect, not a handshake failure.
        expect(errors).toEqual([]);

        // A fresh responder has fresh ephemerals and ciphers. If the client
        // reused the previous codec, this handshake or the first command would
        // fail authentication; the client ephemeral itself must also change.
        encryptedServer = new NoiseServer({ psk, name: 'kitchen', mac: 'AA:BB:CC:DD:EE:FF' });
        driver.connect();
        await flush();
        const secondEphemeral = clientEphemeral();
        expect(secondEphemeral).toHaveLength(64);
        expect(secondEphemeral).not.toBe(firstEphemeral);
        await completeSession();

        power.turnOn();
        const command = (await pump()).find(({ type }) => type === MessageTypes.SwitchCommandRequest);
        expect(command).toBeDefined();
        if (command === undefined) {
            return;
        }
        const decoded = SwitchCommandRequest.decode(command.payload);
        expect(decoded.key).toBe(42);
        expect(decoded.state).toBe(true);
        expect(opens).toBeGreaterThan(1);
    });

    it('carries the configured password on the encrypted ConnectRequest', async () => {
        device = new EspDevice('localhost', 'legacy', 6053, { connection, encryptionKey });
        driver.connect();
        await flush();

        expect(await pump()).toEqual([]);
        expect((await pump()).map(({ type }) => type)).toEqual([MessageTypes.HelloRequest]);

        driver.push(Buffer.from(encryptedServer.seal(MessageTypes.HelloResponse, helloResponse())));
        await flush();
        const connect = (await pump()).find(({ type }) => type === MessageTypes.ConnectRequest);
        expect(connect).toBeDefined();
        if (connect === undefined) {
            return;
        }
        expect(ConnectRequest.decode(connect.payload).password).toBe('legacy');
    });

    it('latches an invalid encryption key and stops reconnecting', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        driver.connect();
        await flush();

        // Discard the client's Noise hello/msg1 and emulate a device that
        // completed ServerHello and then rejected the PSK.
        driver.written.splice(0, driver.written.length);
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('Handshake MAC failure')]));
        driver.push(Buffer.concat([Buffer.from(serverHello('kitchen', 'AA:BB:CC:DD:EE:FF')), Buffer.from(reject)]));
        await flush();

        expect(errors[0]).toBeInstanceOf(InvalidEncryptionKeyError);
        expect((errors[0] as InvalidEncryptionKeyError).serverName).toBe('kitchen');
        await vi.advanceTimersByTimeAsync(6000);
        expect(opens).toBe(1);
    });

    it('re-arms reconnection after a terminal encryption failure', async () => {
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        driver.connect();
        await flush();

        driver.written.splice(0, driver.written.length);
        const reject = encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('Handshake MAC failure')]));
        driver.push(Buffer.concat([Buffer.from(serverHello('kitchen', 'AA:BB:CC:DD:EE:FF')), Buffer.from(reject)]));
        await flush();
        expect(errors[0]).toBeInstanceOf(InvalidEncryptionKeyError);
        expect(opens).toBe(1);

        const retry = new Subject<void>();
        device.provideRetryObservable(retry);
        retry.next();
        await flush();
        expect(opens).toBe(2);

        // The latch reset must be real: a completed re-handshake and discovery
        // prove the device is not merely reopening the transport.
        const rediscovered = firstValueFrom(
            device.discovery$.pipe(
                filter((value) => value),
                take(1),
            ),
        );
        driver.connect();
        await completeSession();
        await expect(rediscovered).resolves.toBe(true);
    });

    it('reports a device that requires encryption when no key is configured', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
        device = new EspDevice('localhost', '', 6053, { connection });
        const error = firstValueFrom(device.error$.pipe(take(1)));
        driver.connect();
        await flush();

        driver.written.splice(0, driver.written.length);
        // A plaintext client makes a Noise device answer with an explicit
        // "Bad indicator byte" reject frame (older firmware just closes).
        driver.push(
            Buffer.from(encodeNoiseFrame(Buffer.concat([Buffer.from([0x01]), Buffer.from('Bad indicator byte')]))),
        );

        await expect(error).resolves.toBeInstanceOf(EncryptionRequiredError);
        await vi.advanceTimersByTimeAsync(6000);
        expect(opens).toBe(1);
    });

    it('reports a plaintext device when a key is configured', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const error = firstValueFrom(device.error$.pipe(take(1)));
        driver.connect();
        await flush();

        driver.written.splice(0, driver.written.length);
        driver.push(Buffer.from(encodeFrame(MessageTypes.HelloResponse, helloResponse())));

        await expect(error).resolves.toBeInstanceOf(EncryptionPlaintextError);
        await vi.advanceTimersByTimeAsync(6000);
        expect(opens).toBe(1);
    });

    it('reports a connection drop before the encrypted handshake starts', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const error = firstValueFrom(device.error$.pipe(take(1)));
        driver.connect();
        await flush();

        driver.disconnect();

        const emitted = await error;
        expect(emitted).toBeInstanceOf(ConnectionHandshakeError);
        expect((emitted as Error).message).toContain('uses API encryption');
        expect((emitted as Error).message).not.toContain('requires API encryption');
        expect(opens).toBe(1);
        await vi.advanceTimersByTimeAsync(1000);
        expect(opens).toBe(2);
    });

    it('reports a drop after ServerHello with the handshake hint', async () => {
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        driver.connect();
        await flush();

        driver.written.splice(0, driver.written.length);
        driver.push(Buffer.from(serverHello('kitchen', 'AA:BB:CC:DD:EE:FF')));
        await flush();
        driver.disconnect();
        await flush();

        expect(errors[0]).toBeInstanceOf(EncryptionHandshakeError);
        expect((errors[0] as Error).message).toContain('before the Noise handshake completed');
    });

    it('keeps retrying after a retryable handshake failure', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
        device = new EspDevice('localhost', '', 6053, { connection, encryptionKey });
        const errors: unknown[] = [];
        device.error$.subscribe((error: unknown) => errors.push(error));
        driver.connect();
        await flush();

        driver.written.splice(0, driver.written.length);
        driver.push(Buffer.from(encodeNoiseFrame(Buffer.from([0x02]))));
        await flush();

        expect(errors[0]).toBeInstanceOf(EncryptionHandshakeError);
        expect(opens).toBe(1);
        await vi.advanceTimersByTimeAsync(1000);
        expect(opens).toBeGreaterThan(1);
    });
});
