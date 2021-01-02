import { EspDevice, isFalse, isTrue, MessageTypes } from '../../src';
import { EspDeviceMock } from '../testHelpers/espDeviceMock';
import { catchError, delay, filter, switchMap, switchMapTo, take, tap, timeout } from 'rxjs/operators';
import { ListEntitiesSwitchResponse } from '../../src/api/protobuf';
import { of, Subject } from 'rxjs';
import DoneCallback = jest.DoneCallback;

const listEntitySwitch = {
    key: 1337,
    name: 'my_switch',
    icon: 'some icon',
    assumedState: false,
    objectId: 'objectId',
    uniqueId: 'uniqueId',
};

describe('espDevice', () => {
    let deviceMock: EspDeviceMock;
    let device: EspDevice;
    const portNumber = 23423;

    beforeEach(() => {
        deviceMock = new EspDeviceMock(portNumber);
    });

    afterEach((done) => {
        device.terminate();
        deviceMock
            .terminate()
            .pipe(tap(() => done()))
            .subscribe();
    });

    it(
        'connects',
        (done) => {
            device = new EspDevice('localhost', '', portNumber);
            device.discovery$
                .pipe(
                    filter(isTrue),
                    take(1),
                    tap(() => {
                        done();
                    }),
                )
                .subscribe();
        },
        5 * 1000,
    );

    it('parses a light list entity response', (done) => {
        deviceMock.listEntities = [
            {
                type: MessageTypes.ListEntitiesSwitchResponse,
                data: ListEntitiesSwitchResponse.encode(listEntitySwitch).finish(),
            },
        ];
        device = new EspDevice('localhost', '', portNumber);
        device.discovery$
            .pipe(
                filter(isTrue),
                take(1),
                tap(() => {
                    expect(device.components).toHaveProperty(listEntitySwitch.objectId);
                    done();
                }),
            )
            .subscribe();
    });

    it('alive$ returns false on close', async (done) => {
        device = new EspDevice('localhost', '', portNumber);
        device.discovery$
            .pipe(
                filter(isTrue),
                switchMap(() => deviceMock.terminate()),
                switchMap(() => device.alive$),
                filter(isFalse),
                timeout(3 * 1000),
                catchError(() => of('timeout')),
                take(1),
                tap((val: unknown) => {
                    expect(val).toBe(false);
                    done();
                }),
            )
            .subscribe();
    });

    xit(
        'alive$ runs out after 90s',
        (done) => {
            device = new EspDevice('localhost', '', portNumber);
            device.discovery$
                .pipe(
                    filter(isTrue),
                    tap(() => deviceMock.ping()),
                    switchMapTo(device.alive$),
                    filter(isFalse),
                    tap((val: boolean) => {
                        expect(val).toBe(false);
                        done();
                    }),
                )
                .subscribe();
        },
        90 * 1000 + 5 * 1000,
    );

    it(
        'should not crash on a non existent esphome device abc',
        (done) => {
            device = new EspDevice('localhost', '', 33333);
            device.discovery$
                .pipe(
                    filter(isTrue),
                    timeout(10 * 1000),
                    catchError((err) => {
                        if (err.name === 'TimeoutError') {
                            return of('timeout');
                        } else {
                            return of('other');
                        }
                    }),
                    tap((val) => {
                        expect(val).toBe('timeout');
                        done();
                    }),
                )
                .subscribe();
        },
        11 * 1000,
    );

    it('retries when it is told to', (done: DoneCallback) => {
        const retryWhen$ = new Subject<void>();
        device = new EspDevice('localhost', '', portNumber);

        device.provideRetryObservable(retryWhen$);
        device.alive$
            .pipe(
                filter(isTrue),
                take(1),
                switchMap(() => deviceMock.terminate()),
                switchMap(() => device.alive$),
                filter(isFalse),
                take(1),
                delay(1000),
                tap(() => (deviceMock = new EspDeviceMock(portNumber))),
                tap(() => retryWhen$.next()),
                switchMap(() => device.alive$),
                filter(isTrue),
                tap(() => done()),
            )
            .subscribe();
    });
});
