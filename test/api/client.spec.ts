import { EspDeviceMock } from '../testHelpers/espDeviceMock';
import { Client, MessageTypes } from '../../src';
import { filter, take, tap } from 'rxjs/operators';
import { combineLatest, Subscription } from 'rxjs';
import { EspSocket } from '../../src/api/espSocket';

describe('Client', () => {
    const portNumber = 33333;
    const deviceMock = new EspDeviceMock(portNumber);
    let client: Client;
    let socket: EspSocket;
    let subscription: Subscription = new Subscription();

    beforeEach((done) => {
        subscription = new Subscription();
        socket = new EspSocket('localhost', portNumber);
        client = new Client(socket);
        subscription.add(
            combineLatest([socket.connected$, deviceMock.connected$])
                .pipe(
                    filter(([first, second]) => first && second),
                    take(1),
                    tap(() => done()),
                )
                .subscribe(),
        );
        socket.open();
    }, 3 * 1000);

    afterEach((done) => {
        client.terminate();
        socket.close();

        subscription.unsubscribe();
        deviceMock
            .terminate()
            .pipe(tap(() => done()))
            .subscribe();
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
