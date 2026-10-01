import { EspDevice, isFalse, isTrue, MessageTypes } from '../../src';
import { EspDeviceMock } from '../testHelpers/espDeviceMock';
import { catchError, delay, filter, switchMap, switchMapTo, take, tap, timeout } from 'rxjs/operators';
import { ListEntitiesLightResponse, ListEntitiesSwitchResponse } from '../../src/api/protobuf/api';
import { firstValueFrom, of, Subject, TimeoutError } from 'rxjs';

const listEntitySwitch = {
    key: 1337,
    name: 'my_switch',
    icon: 'some icon',
    assumedState: false,
    objectId: 'objectId',
    uniqueId: 'uniqueId',
};

const listEntityLight = {
    key: 42,
    name: 'my_light',
    objectId: 'light_object_id',
    uniqueId: 'light_unique_id',
    supportsBrightness: true,
    supportsRgb: true,
    supportsWhiteValue: false,
    supportsColorTemperature: false,
    minMireds: 0,
    maxMireds: 0,
    effects: [],
};

describe('espDevice', () => {
    let deviceMock: EspDeviceMock;
    let device: EspDevice;
    const portNumber = 23423;

    beforeEach(() => {
        deviceMock = new EspDeviceMock(portNumber);
    });

    afterEach(async () => {
        device.terminate();
        await firstValueFrom(deviceMock.terminate());
    });

    it(
        'connects',
        async () => {
            device = new EspDevice('localhost', '', portNumber);
            await firstValueFrom(device.discovery$.pipe(filter(isTrue), take(1)));
        },
        5 * 1000,
    );

    it('parses a switch list entity response', async () => {
        deviceMock.listEntities = [
            {
                type: MessageTypes.ListEntitiesSwitchResponse,
                data: ListEntitiesSwitchResponse.encode(listEntitySwitch).finish(),
            },
        ];
        device = new EspDevice('localhost', '', portNumber);
        await firstValueFrom(
            device.discovery$.pipe(
                filter(isTrue),
                take(1),
                tap(() => expect(device.components).toHaveProperty(listEntitySwitch.objectId)),
            ),
        );
    });

    it('parses a light list entity response', async () => {
        deviceMock.listEntities = [
            {
                type: MessageTypes.ListEntitiesLightResponse,
                data: ListEntitiesLightResponse.encode(listEntityLight).finish(),
            },
        ];
        device = new EspDevice('localhost', '', portNumber);
        await firstValueFrom(
            device.discovery$.pipe(
                filter(isTrue),
                take(1),
                tap(() => expect(device.components[listEntityLight.objectId]?.type).toBe('light')),
            ),
        );
    });

    it('alive$ returns false on close', async () => {
        device = new EspDevice('localhost', '', portNumber);
        await firstValueFrom(
            device.discovery$.pipe(
                filter(isTrue),
                switchMap(() => deviceMock.terminate()),
                switchMap(() => device.alive$),
                filter(isFalse),
                timeout(3 * 1000),
                catchError(() => of('timeout')),
                take(1),
                tap((val: unknown) => expect(val).toBe(false)),
            ),
        );
    });

    it(
        'alive$ runs out after 90s',
        async () => {
            // The 90s ping timeout is driven by rxjs' interval scheduler; fake it so the
            // wait can be accelerated instead of burning 90 real seconds on every CI run.
            vi.useFakeTimers({
                shouldAdvanceTime: true,
                toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
            });
            try {
                device = new EspDevice('localhost', '', portNumber);
                // alive$ must be subscribed only after discovery: connected$ is a
                // BehaviorSubject(false) in the merge, so an earlier subscription would
                // catch the initial false before the device is even connected.
                const dead = firstValueFrom(
                    device.discovery$.pipe(
                        filter(isTrue),
                        tap(() => deviceMock.ping()),
                        switchMapTo(device.alive$),
                        filter(isFalse),
                        take(1),
                    ),
                );
                // The mock answers one ping (the client auto-responds with PingResponse);
                // from then on the device sees silence and alive$ should flip to false
                // after the 90s ping timeout. Waiting for the response guarantees the
                // last espData emission already re-armed the 90s countdown.
                await firstValueFrom(deviceMock.types$.pipe(filter((type) => type === MessageTypes.PingResponse)));
                await vi.advanceTimersByTimeAsync(90 * 1000 + 1000);
                expect(await dead).toBe(false);
            } finally {
                vi.useRealTimers();
            }
        },
        25 * 1000,
    );

    it(
        'should not crash on a non existent esphome device abc',
        async () => {
            device = new EspDevice('localhost', '', 33333);
            await firstValueFrom(
                device.discovery$.pipe(
                    filter(isTrue),
                    timeout(10 * 1000),
                    catchError((err) => {
                        if (err instanceof TimeoutError) {
                            return of('timeout');
                        } else {
                            return of('other');
                        }
                    }),
                    tap((val) => expect(val).toBe('timeout')),
                ),
            );
        },
        11 * 1000,
    );

    it('retries when it is told to', async () => {
        const retryWhen$ = new Subject<void>();
        device = new EspDevice('localhost', '', portNumber);

        device.provideRetryObservable(retryWhen$);
        await firstValueFrom(
            device.alive$.pipe(
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
            ),
        );
    });
});
