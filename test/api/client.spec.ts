import { EspDeviceMock } from '../testHelpers/espDeviceMock';
import { Client, MessageTypes } from '../../src';
import { filter, take, tap } from 'rxjs/operators';
import { combineLatest, firstValueFrom, Subscription } from 'rxjs';
import { EspSocket } from '../../src/api/espSocket';

describe('Client', () => {
    const portNumber = 33333;
    const deviceMock = new EspDeviceMock(portNumber);
    let client: Client;
    let socket: EspSocket;
    let subscription: Subscription = new Subscription();

    beforeEach(async () => {
        subscription = new Subscription();
        socket = new EspSocket('localhost', portNumber);
        client = new Client(socket);
        subscription.add(
            combineLatest([socket.connected$, deviceMock.connected$])
                .pipe(
                    filter(([first, second]) => first && second),
                    take(1),
                )
                .subscribe(),
        );
        socket.open();
        await firstValueFrom(
            combineLatest([socket.connected$, deviceMock.connected$]).pipe(
                filter(([first, second]) => first && second),
                take(1),
            ),
        );
    }, 3 * 1000);

    afterEach(async () => {
        client.terminate();
        socket.close();

        subscription.unsubscribe();
        await firstValueFrom(deviceMock.terminate());
    });

    it(
        'responds to pings',
        async () => {
            const response = firstValueFrom(
                deviceMock.types$.pipe(
                    take(1),
                    tap((val: MessageTypes) => expect(val).toBe(MessageTypes.PingResponse)),
                ),
            );
            deviceMock.ping();
            await response;
        },
        5 * 1000,
    );
});
