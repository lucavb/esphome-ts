import { EspDevice, isFalse, isTrue, MessageTypes } from '../../src';
import { EspDeviceMock } from '../testHelpers/espDeviceMock';
import { ListEntitiesLightResponse, ListEntitiesSwitchResponse } from '../../src/api/protobuf/api';
import {
    catchError,
    delay,
    filter,
    firstValueFrom,
    of,
    Subject,
    switchMap,
    switchMapTo,
    take,
    tap,
    timeout,
    TimeoutError,
} from 'rxjs';

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
                const emissions: boolean[] = [];
                const dead = firstValueFrom(
                    device.discovery$.pipe(
                        filter(isTrue),
                        tap(() => deviceMock.ping()),
                        switchMapTo(device.alive$),
                        tap((alive: boolean) => emissions.push(alive)),
                        filter(isFalse),
                        take(1),
                    ),
                );
                // A single advance to just past 90s cannot tell the two watchdog
                // arming strategies apart: whether the countdown is armed at
                // connection time or re-armed by every frame, both would fire by
                // 91s. So the countdown is re-armed with a real frame halfway
                // through instead. The mock answers one ping (the client
                // auto-responds with PingResponse); waiting for the response
                // guarantees the frame is fully processed before faking more time.
                await firstValueFrom(deviceMock.types$.pipe(filter((type) => type === MessageTypes.PingResponse)));
                // T=50s. The ping frame just re-armed the countdown, so an
                // armed-at-connect mutant would fire at T=90s...
                await vi.advanceTimersByTimeAsync(50 * 1000);
                deviceMock.ping();
                // T=50s: the second ping's response, fully processed.
                await firstValueFrom(deviceMock.types$.pipe(filter((type) => type === MessageTypes.PingResponse)));
                // T=100s. The last frame arrived 50s ago — well within the 90s
                // ping timeout. alive$ must still only have emitted the initial
                // true: the frame from T=50s re-armed the countdown, while an
                // armed-at-connect mutant would already have emitted false.
                await vi.advanceTimersByTimeAsync(50 * 1000);
                expect(emissions).toEqual([true]);
                // T=145s. The last frame is now 95s old — past the 90s ping
                // timeout — so a device that received no frames for 90s is still
                // correctly reported as dead.
                await vi.advanceTimersByTimeAsync(45 * 1000);
                expect(await dead).toBe(false);
                expect(emissions).toEqual([true, false]);
            } finally {
                vi.useRealTimers();
            }
        },
        25 * 1000,
    );

    it(
        'should not crash on a non existent esphome device abc',
        async () => {
            // 33445, not 33333: client.spec.ts binds its fake server on 33333,
            // and vitest runs spec files in parallel workers, so this test's
            // expect-refused connect must not race against that server.
            device = new EspDevice('localhost', '', 33445);
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
