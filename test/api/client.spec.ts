import {EspDeviceMock} from '../testHelpers/espDeviceMock';
import {Client, Connection} from '../../src';
import {filter, switchMapTo, take, tap} from 'rxjs/operators';
import {MessageTypes} from '../../src/api/requestResponseMatching';
import {isTrue} from '../../src/api/helpers';

describe('Client', () => {

    const portNumber = 33333;
    const deviceMock = new EspDeviceMock(portNumber);
    let client: Client;
    let connection: Connection;

    beforeEach((done) => {
        connection = new Connection('localhost', portNumber);
        client = new Client(connection);
        connection.open();
        connection.connected$.pipe(
            filter(isTrue),
            switchMapTo(deviceMock.connected$),
            filter(isTrue),
            tap(() => done()),
        ).subscribe();
    }, 3 * 1000);

    afterEach(() => {
        client.terminate();
        connection.close();
        deviceMock.terminate();
    });

    it('responds to pings', (done) => {
        deviceMock.types$.pipe(
            take(1),
            tap((val: MessageTypes) => {
                expect(val).toBe(MessageTypes.PingResponse);
                done();
            }),
        ).subscribe();
        deviceMock.ping();
    }, 5 * 1000);

});
