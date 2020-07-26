import { EspDeviceMock } from '../testHelpers/espDeviceMock';
import { Client, Connection } from '../../src';
import { filter, take, tap } from 'rxjs/operators';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { combineLatest, Subscription } from 'rxjs';

describe('Client', () => {
    const portNumber = 33333;
    const deviceMock = new EspDeviceMock(portNumber);
    let client: Client;
    let connection: Connection;
    let subscription: Subscription = new Subscription();

    beforeEach((done) => {
        subscription = new Subscription();
        connection = new Connection('localhost', portNumber);
        client = new Client(connection);
        subscription.add(
            combineLatest([connection.open(), deviceMock.connected$])
                .pipe(
                    filter(([first, second]) => first && second),
                    take(1),
                    tap(() => done()),
                )
                .subscribe(),
        );
    }, 3 * 1000);

    afterEach(() => {
        client.terminate();
        connection.close();
        deviceMock.terminate();
        subscription.unsubscribe();
    });

    it(
        'responds to pings',
        (done) => {
            subscription.add(
                deviceMock.types$
                    .pipe(
                        take(1),
                        tap((val: MessageTypes) => {
                            expect(val).toBe(MessageTypes.PingResponse);
                            done();
                        }),
                    )
                    .subscribe(),
            );
            deviceMock.ping();
        },
        5 * 1000,
    );
});
