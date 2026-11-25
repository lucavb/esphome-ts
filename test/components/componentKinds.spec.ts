import { firstValueFrom, Subject } from 'rxjs';
import { type ReadData } from '../../src/api/framer';
import {
    BinarySensorStateResponse,
    ColorMode,
    CoverOperation,
    CoverStateResponse,
    FanDirection,
    FanSpeed,
    FanStateResponse,
    LegacyCoverState,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesCoverResponse,
    ListEntitiesFanResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from '../../src/api/protobuf/api';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import {
    BinarySensorComponent,
    CoverComponent,
    FanComponent,
    LightComponent,
    SensorComponent,
    SwitchComponent,
} from '../../src/components';
import { emptyCommandInterface } from '../../src/components/commandInterface';
import {
    decodeState,
    discover,
    fallbackEntityId,
    isComponentListResponse,
    isStateResponse,
    type DiscoveredEntity,
    type DiscoveryDeps,
    type StateResponses,
} from '../../src/components/componentKinds';
import { DebugConnection } from '../testHelpers/debugConnection';

const readData = (type: MessageTypes, payload: Uint8Array): ReadData => ({ type, payload });

const discoveryDeps = (
    stateEvents$: Subject<StateResponses>,
    knownComponents: ReadonlyMap<string, number> = new Map(),
    apiVersion = { major: 1, minor: 8 },
): DiscoveryDeps => ({
    stateEvents$,
    connection: new DebugConnection(),
    knownComponents,
    apiVersion,
});

const expectNew = (result: DiscoveredEntity | undefined) => {
    expect(result?.status).toBe('new');
    if (result?.status !== 'new') {
        throw new Error('expected a new component');
    }
    return result;
};

const expectKnown = (result: DiscoveredEntity | undefined) => {
    expect(result?.status).toBe('known');
    if (result?.status !== 'known') {
        throw new Error('expected a known component');
    }
    return result;
};

const switchPayload = (overrides: Partial<ListEntitiesSwitchResponse> = {}): Uint8Array =>
    ListEntitiesSwitchResponse.encode({
        ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
        objectId: 'created_switch',
        key: 32,
        name: 'Kitchen switch',
        uniqueId: 'uid_32',
        ...overrides,
    }).finish();

describe('componentKinds', () => {
    describe('decodeState', () => {
        it('decodes every supported state response', () => {
            const binary = decodeState(
                readData(
                    MessageTypes.BinarySensorStateResponse,
                    BinarySensorStateResponse.encode({ key: 1, state: true, missingState: false }).finish(),
                ),
            );
            expect(binary).toMatchObject({ key: 1, state: true });

            const sensor = decodeState(
                readData(
                    MessageTypes.SensorStateResponse,
                    SensorStateResponse.encode({
                        ...SensorStateResponse.decode(new Uint8Array()),
                        key: 2,
                        state: 21.5,
                    }).finish(),
                ),
            );
            expect(sensor).toMatchObject({ key: 2 });

            const cover = decodeState(
                readData(
                    MessageTypes.CoverStateResponse,
                    CoverStateResponse.encode({
                        key: 3,
                        legacyState: LegacyCoverState.LEGACY_COVER_STATE_OPEN,
                        position: 0.75,
                        tilt: 0.5,
                        currentOperation: CoverOperation.COVER_OPERATION_IS_OPENING,
                    }).finish(),
                ),
            );
            expect(cover).toMatchObject({ key: 3, position: 0.75, tilt: 0.5 });

            const light = decodeState(
                readData(
                    MessageTypes.LightStateResponse,
                    LightStateResponse.encode({
                        ...LightStateResponse.decode(new Uint8Array()),
                        key: 4,
                        state: true,
                        brightness: 0.5,
                        colorMode: ColorMode.COLOR_MODE_RGB,
                        effect: 'Rainbow',
                    }).finish(),
                ),
            );
            expect(light).toMatchObject({ key: 4, state: true, colorMode: ColorMode.COLOR_MODE_RGB });

            const fan = decodeState(
                readData(
                    MessageTypes.FanStateResponse,
                    FanStateResponse.encode({
                        ...FanStateResponse.decode(new Uint8Array()),
                        key: 5,
                        state: true,
                        speed: FanSpeed.FAN_SPEED_MEDIUM,
                        speedLevel: 2,
                        direction: FanDirection.FAN_DIRECTION_REVERSE,
                        presetMode: 'auto',
                    }).finish(),
                ),
            );
            expect(fan).toMatchObject({ key: 5, speedLevel: 2, presetMode: 'auto' });

            const toggle = decodeState(
                readData(
                    MessageTypes.SwitchStateResponse,
                    SwitchStateResponse.encode({ key: 6, state: false }).finish(),
                ),
            );
            expect(toggle).toMatchObject({ key: 6, state: false });
        });

        it('decodes a fan state response from golden wire bytes', () => {
            // key=134 fixed32 (1), state (2), oscillating (3), direction=REVERSE (5),
            // speed_level=2 (6), preset_mode="auto" (7).
            const payload = new Uint8Array([
                0x0d, 0x86, 0x00, 0x00, 0x00, 0x10, 0x01, 0x18, 0x01, 0x28, 0x01, 0x30, 0x02, 0x3a, 0x04, 0x61, 0x75,
                0x74, 0x6f,
            ]);
            expect(decodeState(readData(MessageTypes.FanStateResponse, payload))).toEqual({
                key: 134,
                state: true,
                oscillating: true,
                speed: FanSpeed.FAN_SPEED_LOW,
                direction: FanDirection.FAN_DIRECTION_REVERSE,
                speedLevel: 2,
                presetMode: 'auto',
            });
        });

        it('falls back to the protobuf defaults for an empty payload', () => {
            expect(decodeState(readData(MessageTypes.SensorStateResponse, new Uint8Array()))).toEqual({
                key: 0,
                state: 0,
                missingState: false,
            });
            expect(decodeState(readData(MessageTypes.CoverStateResponse, new Uint8Array()))).toEqual({
                key: 0,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_OPEN,
                position: 0,
                tilt: 0,
                currentOperation: CoverOperation.COVER_OPERATION_IDLE,
            });
            expect(ListEntitiesCoverResponse.decode(new Uint8Array()).supportsStop).toBe(false);
        });

        it('drops a malformed state frame instead of throwing', () => {
            const malformed = new Uint8Array(10).fill(0xff);

            expect(decodeState(readData(MessageTypes.SwitchStateResponse, malformed))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.LightStateResponse, malformed))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.FanStateResponse, malformed))).toBeUndefined();
        });

        it('returns undefined for non-state message types', () => {
            expect(decodeState(readData(MessageTypes.HelloResponse, new Uint8Array()))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.ListEntitiesSwitchResponse, switchPayload()))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.SubscribeStatesRequest, new Uint8Array()))).toBeUndefined();
        });
    });

    describe('message-type predicates', () => {
        const stateTypes = [
            MessageTypes.BinarySensorStateResponse,
            MessageTypes.CoverStateResponse,
            MessageTypes.FanStateResponse,
            MessageTypes.LightStateResponse,
            MessageTypes.SensorStateResponse,
            MessageTypes.SwitchStateResponse,
        ];
        const listTypes = [
            MessageTypes.ListEntitiesBinarySensorResponse,
            MessageTypes.ListEntitiesCoverResponse,
            MessageTypes.ListEntitiesFanResponse,
            MessageTypes.ListEntitiesLightResponse,
            MessageTypes.ListEntitiesSensorResponse,
            MessageTypes.ListEntitiesSwitchResponse,
        ];

        it('recognises every supported state and list type', () => {
            for (const type of stateTypes) {
                expect(isStateResponse(type)).toBe(true);
            }
            for (const type of listTypes) {
                expect(isComponentListResponse(type)).toBe(true);
            }
        });

        it('excludes done, unsupported kinds, and requests', () => {
            expect(isComponentListResponse(MessageTypes.ListEntitiesDoneResponse)).toBe(false);
            expect(isComponentListResponse(MessageTypes.ListEntitiesTextSensorResponse)).toBe(false);
            expect(isComponentListResponse(MessageTypes.ListEntitiesRequest)).toBe(false);
            expect(isStateResponse(MessageTypes.ListEntitiesDoneResponse)).toBe(false);
            expect(isStateResponse(MessageTypes.ListEntitiesSwitchResponse)).toBe(false);
        });
    });

    describe('discover', () => {
        it('creates a switch component and wires its state', () => {
            const stateEvents$ = new Subject<StateResponses>();
            const result = expectNew(
                discover(
                    readData(MessageTypes.ListEntitiesSwitchResponse, switchPayload()),
                    discoveryDeps(stateEvents$),
                ),
            );

            expect(result.id).toBe('created_switch');
            expect(result.component).toBeInstanceOf(SwitchComponent);
            const component = result.component as SwitchComponent;
            expect(component.type).toBe('switch');
            expect(component.name).toBe('Kitchen switch');
            expect(component.key).toBe(32);

            stateEvents$.next({ key: 32, state: true });
            expect(component.status).toBe(true);
        });

        it('creates a light component with its entity details', () => {
            const payload = ListEntitiesLightResponse.encode({
                objectId: 'created_light',
                key: 7,
                name: 'My light',
                uniqueId: 'uid_7',
                supportsBrightness: true,
                supportsRgb: true,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 153,
                maxMireds: 500,
                effects: ['None', 'Rainbow'],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            }).finish();
            const result = expectNew(
                discover(
                    readData(MessageTypes.ListEntitiesLightResponse, payload),
                    discoveryDeps(new Subject<StateResponses>()),
                ),
            );

            expect(result.id).toBe('created_light');
            expect(result.component).toBeInstanceOf(LightComponent);
            const component = result.component as LightComponent;
            expect(component.type).toBe('light');
            expect(component.supportsRgb).toBe(true);
            expect(component.supportsBrightness).toBe(true);
            expect(component.supportsColorMode).toBe(true);
            expect(component.supportedColorModes).toEqual([
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            ]);
            expect(component.supportsColorTemperature).toBe(true);
            expect(component.minMireds).toBe(153);
            expect(component.maxMireds).toBe(500);
            expect(component.availableEffects()).toEqual(['None', 'Rainbow']);
        });

        it('creates a cover component and wires its state', () => {
            const stateEvents$ = new Subject<StateResponses>();
            const payload = ListEntitiesCoverResponse.encode({
                objectId: 'created_cover',
                key: 9,
                name: 'Garage door',
                uniqueId: 'uid_cover',
                assumedState: true,
                supportsPosition: true,
                supportsTilt: false,
                supportsStop: true,
                deviceClass: 'garage',
            }).finish();
            const result = expectNew(
                discover(readData(MessageTypes.ListEntitiesCoverResponse, payload), discoveryDeps(stateEvents$)),
            );

            expect(result.id).toBe('created_cover');
            expect(result.component).toBeInstanceOf(CoverComponent);
            const component = result.component as CoverComponent;
            expect(component.type).toBe('cover');
            expect(component.supportsPosition).toBe(true);
            expect(component.supportsStop).toBe(true);
            expect(component.supportsTilt).toBe(false);
            expect(component.assumedState).toBe(true);
            expect(component.tilt).toBeUndefined();

            stateEvents$.next({
                key: 9,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_CLOSED,
                position: 0.4,
                tilt: 0,
                currentOperation: CoverOperation.COVER_OPERATION_IS_CLOSING,
            });
            expect(component.position).toBeCloseTo(0.4);
            expect(component.operation).toBe(CoverOperation.COVER_OPERATION_IS_CLOSING);
            expect(component.isClosed).toBe(false);
        });

        it('creates a fan component with its capabilities and state', () => {
            const stateEvents$ = new Subject<StateResponses>();
            const payload = ListEntitiesFanResponse.encode({
                objectId: 'created_fan',
                key: 10,
                name: 'Bedroom fan',
                uniqueId: 'uid_fan',
                supportsOscillation: true,
                supportsSpeed: true,
                supportsDirection: true,
                supportedSpeedCount: 4,
                supportedPresetModes: ['auto', 'sleep'],
            }).finish();
            const result = expectNew(
                discover(readData(MessageTypes.ListEntitiesFanResponse, payload), discoveryDeps(stateEvents$)),
            );

            expect(result.id).toBe('created_fan');
            expect(result.component).toBeInstanceOf(FanComponent);
            const component = result.component as FanComponent;
            expect(component.type).toBe('fan');
            expect(component.speedCount).toBe(4);
            expect(component.supportsSpeed).toBe(true);
            expect(component.supportsOscillation).toBe(true);
            expect(component.supportsDirection).toBe(true);
            expect(component.supportedPresetModes).toEqual(['auto', 'sleep']);
            expect(component.ready).toBe(false);

            stateEvents$.next({
                key: 10,
                state: true,
                speedLevel: 2,
                oscillating: true,
                direction: FanDirection.FAN_DIRECTION_REVERSE,
                presetMode: 'sleep',
            });
            expect(component.ready).toBe(true);
            expect(component.status).toBe(true);
            expect(component.speedLevel).toBe(2);
            expect(component.speedPercentage).toBe(50);
            expect(component.oscillating).toBe(true);
            expect(component.direction).toBe(FanDirection.FAN_DIRECTION_REVERSE);
            expect(component.presetMode).toBe('sleep');
        });

        it('decodes a fan list response from golden wire bytes', () => {
            // Pin the hand-added list fields independently of the generated
            // encoder: key=7 fixed32 (2), supports_speed (6),
            // supported_speed_count=3 (8), supported_preset_modes=["auto"] (12).
            const payload = new Uint8Array([
                0x15, 0x07, 0x00, 0x00, 0x00, 0x30, 0x01, 0x40, 0x03, 0x62, 0x04, 0x61, 0x75, 0x74, 0x6f,
            ]);
            const result = expectNew(
                discover(
                    readData(MessageTypes.ListEntitiesFanResponse, payload),
                    discoveryDeps(new Subject<StateResponses>()),
                ),
            );

            expect(result.id).toBe(fallbackEntityId(7));
            expect(result.component).toBeInstanceOf(FanComponent);
            const component = result.component as FanComponent;
            expect(component.key).toBe(7);
            expect(component.supportsSpeed).toBe(true);
            expect(component.speedCount).toBe(3);
            expect(component.supportedPresetModes).toEqual(['auto']);
        });

        it('uses the negotiated API version for the legacy fan speed enum', () => {
            const stateEvents$ = new Subject<StateResponses>();
            const payload = ListEntitiesFanResponse.encode({
                ...ListEntitiesFanResponse.decode(new Uint8Array()),
                objectId: 'legacy_fan',
                key: 13,
                name: 'Old fan',
                uniqueId: 'uid_old_fan',
                supportsSpeed: true,
            }).finish();
            const result = expectNew(
                discover(
                    readData(MessageTypes.ListEntitiesFanResponse, payload),
                    discoveryDeps(stateEvents$, new Map(), { major: 1, minor: 3 }),
                ),
            );

            expect(result.component).toBeInstanceOf(FanComponent);
            const component = result.component as FanComponent;
            expect(component.speedCount).toBe(3);

            stateEvents$.next({ key: 13, state: true, speed: FanSpeed.FAN_SPEED_HIGH });
            expect(component.speedLevel).toBe(3);
            expect(component.speedPercentage).toBe(100);
        });

        it('creates a sensor component with its entity details and state', () => {
            const stateEvents$ = new Subject<StateResponses>();
            const payload = ListEntitiesSensorResponse.encode({
                objectId: 'created_sensor',
                key: 1578816251,
                name: 'Living room temperature',
                uniqueId: 'uid_sensor',
                icon: 'mdi:thermometer',
                unitOfMeasurement: '°C',
                accuracyDecimals: 1,
                forceUpdate: true,
                deviceClass: 'temperature',
            }).finish();
            const result = expectNew(
                discover(readData(MessageTypes.ListEntitiesSensorResponse, payload), discoveryDeps(stateEvents$)),
            );

            expect(result.id).toBe('created_sensor');
            expect(result.component).toBeInstanceOf(SensorComponent);
            const component = result.component as SensorComponent;
            expect(component.type).toBe('sensor');
            expect(component.icon).toBe('mdi:thermometer');
            expect(component.unitOfMeasurement).toBe('°C');
            expect(component.deviceClass).toBe('temperature');

            stateEvents$.next({ key: 1578816251, state: 22.5 } as StateResponses);
            expect(component.value).toBeCloseTo(22.5);
        });

        it('creates a binary sensor component and wires its state', () => {
            const stateEvents$ = new Subject<StateResponses>();
            const payload = ListEntitiesBinarySensorResponse.encode({
                objectId: 'created_binary_sensor',
                key: 12,
                name: 'Back door',
                uniqueId: 'uid_bs',
                deviceClass: 'door',
                isStatusBinarySensor: true,
            }).finish();
            const result = expectNew(
                discover(readData(MessageTypes.ListEntitiesBinarySensorResponse, payload), discoveryDeps(stateEvents$)),
            );

            expect(result.id).toBe('created_binary_sensor');
            expect(result.component).toBeInstanceOf(BinarySensorComponent);
            const component = result.component as BinarySensorComponent;
            expect(component.type).toBe('binarySensor');
            expect(component.deviceClass).toBe('door');
            expect(component.ready).toBe(false);

            stateEvents$.next({ key: 12, state: true });
            expect(component.ready).toBe(true);
            expect(component.status).toBe(true);
        });

        it('returns a rebind for a known numeric key and filters state by key', async () => {
            const stateEvents$ = new Subject<StateResponses>();
            const result = expectKnown(
                discover(
                    readData(
                        MessageTypes.ListEntitiesSwitchResponse,
                        switchPayload({ objectId: 'already_known', key: 55 }),
                    ),
                    discoveryDeps(stateEvents$, new Map([['already_known', 55]])),
                ),
            );

            expect(result.id).toBe('already_known');
            const received = firstValueFrom(result.state$);
            stateEvents$.next({ key: 42, state: true });
            stateEvents$.next({ key: 55, state: false });

            await expect(received).resolves.toEqual({ key: 55, state: false });
        });

        it('uses deterministic key-based IDs for empty object IDs across every kind', () => {
            const entities = [
                [
                    MessageTypes.ListEntitiesBinarySensorResponse,
                    ListEntitiesBinarySensorResponse.encode({
                        ...ListEntitiesBinarySensorResponse.decode(new Uint8Array()),
                        key: 101,
                    }).finish(),
                    BinarySensorComponent,
                ],
                [
                    MessageTypes.ListEntitiesCoverResponse,
                    ListEntitiesCoverResponse.encode({
                        ...ListEntitiesCoverResponse.decode(new Uint8Array()),
                        key: 102,
                    }).finish(),
                    CoverComponent,
                ],
                [
                    MessageTypes.ListEntitiesSwitchResponse,
                    ListEntitiesSwitchResponse.encode({
                        ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                        key: 103,
                    }).finish(),
                    SwitchComponent,
                ],
                [
                    MessageTypes.ListEntitiesFanResponse,
                    ListEntitiesFanResponse.encode({
                        ...ListEntitiesFanResponse.decode(new Uint8Array()),
                        key: 106,
                    }).finish(),
                    FanComponent,
                ],
                [
                    MessageTypes.ListEntitiesLightResponse,
                    ListEntitiesLightResponse.encode({
                        ...ListEntitiesLightResponse.decode(new Uint8Array()),
                        key: 104,
                    }).finish(),
                    LightComponent,
                ],
                [
                    MessageTypes.ListEntitiesSensorResponse,
                    ListEntitiesSensorResponse.encode({
                        ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                        key: 105,
                    }).finish(),
                    SensorComponent,
                ],
            ] as const;

            for (const [type, payload, Component] of entities) {
                const result = expectNew(
                    discover(readData(type, payload), discoveryDeps(new Subject<StateResponses>())),
                );
                expect(result.id).toBe(fallbackEntityId(result.component.key));
                expect(result.component).toBeInstanceOf(Component);
            }
        });

        it('avoids a fallback ID already occupied by a different object ID', () => {
            const id = fallbackEntityId(17);
            const payload = ListEntitiesSensorResponse.encode({
                ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                key: 17,
            }).finish();
            const result = expectNew(
                discover(
                    readData(MessageTypes.ListEntitiesSensorResponse, payload),
                    discoveryDeps(new Subject<StateResponses>(), new Map([[id, 99]])),
                ),
            );

            expect(result.id).toBe(`${id}_1`);
            expect(result.component).toBeInstanceOf(SensorComponent);
        });

        it('reuses the existing ID by numeric key when the object ID changes', () => {
            const payload = ListEntitiesSensorResponse.encode({
                ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                objectId: '',
                key: 18,
            }).finish();
            const result = expectKnown(
                discover(
                    readData(MessageTypes.ListEntitiesSensorResponse, payload),
                    discoveryDeps(new Subject<StateResponses>(), new Map([['sensor_before', 18]])),
                ),
            );

            expect(result.id).toBe('sensor_before');
        });

        it('does not overwrite a different entity with a duplicate nonempty object ID', () => {
            const payload = ListEntitiesSwitchResponse.encode({
                ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                objectId: 'duplicate_object_id',
                key: 19,
            }).finish();
            const result = expectNew(
                discover(
                    readData(MessageTypes.ListEntitiesSwitchResponse, payload),
                    discoveryDeps(new Subject<StateResponses>(), new Map([['duplicate_object_id', 20]])),
                ),
            );

            expect(result.id).toBe(fallbackEntityId(19));
            expect(result.component).toBeInstanceOf(SwitchComponent);
        });

        it('returns undefined for message types outside the registry', () => {
            const deps = discoveryDeps(new Subject<StateResponses>());
            expect(discover(readData(MessageTypes.ListEntitiesRequest, new Uint8Array()), deps)).toBeUndefined();
            expect(
                discover(readData(MessageTypes.ListEntitiesTextSensorResponse, new Uint8Array()), deps),
            ).toBeUndefined();
            expect(discover(readData(MessageTypes.SubscribeLogsRequest, new Uint8Array()), deps)).toBeUndefined();
        });

        it('reports a malformed list frame by throwing', () => {
            const malformed = new Uint8Array(10).fill(0xff);
            expect(() =>
                discover(
                    readData(MessageTypes.ListEntitiesSwitchResponse, malformed),
                    discoveryDeps(new Subject<StateResponses>()),
                ),
            ).toThrow();
        });

        it('provides a no-op command sink for read-only components', () => {
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.PingRequest, new Uint8Array()),
            ).not.toThrow();
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.LightCommandRequest, new Uint8Array([1, 2, 3])),
            ).not.toThrow();
        });
    });
});
