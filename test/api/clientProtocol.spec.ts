import { EspSocket } from '../../src/api/espSocket';
import { Client } from '../../src/api/client';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { encodeFrame } from '../../src/api/framer';
import {
    ConnectRequest,
    DeviceInfoRequest,
    HelloRequest,
    HelloResponse,
    PingRequest,
} from '../../src/api/protobuf/api';
import { createInMemoryConnection, type InMemoryServerDriver } from '../testHelpers/inMemoryConnection';
import { type Connection } from '../../src/api/connection';
import { firstValueFrom } from 'rxjs';

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const expectedFrame = (type: MessageTypes, payload: Uint8Array): number[] => [...encodeFrame(type, payload)];

describe('Client wire protocol', () => {
    let espSocket: EspSocket;
    let connection: Connection;
    let client: Client;
    let server: InMemoryServerDriver;

    beforeEach(async () => {
        ({ connection, server } = createInMemoryConnection());
        espSocket = new EspSocket('localhost', 6053, { connection });
        client = new Client(espSocket);
        espSocket.open();
        server.connect();
        await flush();
    });

    it('hello() sends a HelloRequest frame', async () => {
        const payload = HelloRequest.encode({ clientInfo: 'x' }).finish();
        client.hello({ clientInfo: 'x' });

        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual(expectedFrame(MessageTypes.HelloRequest, payload));
    });

    it('hello() emits the HelloResponse decoded from the wire', async () => {
        const response = firstValueFrom(client.hello({ clientInfo: 'x' }));

        const payload = HelloResponse.encode({ serverInfo: 'demo', apiVersionMajor: 1, apiVersionMinor: 2 }).finish();
        server.push(Buffer.from(encodeFrame(MessageTypes.HelloResponse, payload)));

        const decoded = await response;
        expect(decoded.serverInfo).toBe('demo');
        expect(decoded.apiVersionMinor).toBe(2);
    });

    it('ignores responses of another type while waiting', async () => {
        const response = firstValueFrom(client.hello({ clientInfo: 'x' }));

        server.push(Buffer.from(encodeFrame(MessageTypes.PingResponse, new Uint8Array())));
        const payload = HelloResponse.encode({ serverInfo: 'late', apiVersionMajor: 1, apiVersionMinor: 0 }).finish();
        server.push(Buffer.from(encodeFrame(MessageTypes.HelloResponse, payload)));

        expect((await response).serverInfo).toBe('late');
    });

    it('listEntities() sends the request and emits once', async () => {
        await expect(firstValueFrom(client.listEntities())).resolves.toBeUndefined();

        expect(server.written.length).toBe(1);
        expect([...server.written[0]][2]).toBe(MessageTypes.ListEntitiesRequest);
    });

    it('connect() sends a ConnectRequest frame', async () => {
        const payload = ConnectRequest.encode({ password: '' }).finish();
        client.connect({ password: '' });

        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual(expectedFrame(MessageTypes.ConnectRequest, payload));
    });

    it('deviceInfo() sends a DeviceInfoRequest frame', async () => {
        const payload = DeviceInfoRequest.encode({}).finish();
        client.deviceInfo();

        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual(expectedFrame(MessageTypes.DeviceInfoRequest, payload));
    });

    it('ping() sends a PingRequest frame (not ConnectRequest)', async () => {
        const payload = PingRequest.encode({}).finish();
        client.ping();

        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual(expectedFrame(MessageTypes.PingRequest, payload));
        expect([...server.written[0]][2]).toBe(MessageTypes.PingRequest);
        expect([...server.written[0]][2]).not.toBe(MessageTypes.ConnectRequest);
    });
});
