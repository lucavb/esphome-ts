import {
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
    BinarySensorStateResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from '../../src/api/protobuf/api';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { type StateResponses } from '../../src/api/interfaces';
import {
    createComponents,
    emptyCommandInterface,
    fallbackEntityId,
    stateParser,
    transformStates,
} from '../../src/api/helpers';
import {
    BinarySensorComponent,
    CoverComponent,
    FanComponent,
    LightComponent,
    SensorComponent,
    SwitchComponent,
} from '../../src/components';
import { type ReadData } from '../../src/api/espSocket';
import { Subject, firstValueFrom } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';

const readData = (type: MessageTypes, payload: Uint8Array): ReadData => ({ type, payload });

describe('helpers', () => {
    describe('stateParser', () => {
        it('decodes a binary sensor state response', () => {
            const payload = BinarySensorStateResponse.encode({ key: 1234, state: true, missingState: false }).finish();
            const parsed = stateParser(readData(MessageTypes.BinarySensorStateResponse, payload));
            expect(parsed).toEqual({ key: 1234, state: true, missingState: false });
        });

        it('decodes a sensor state response with a float payload', () => {
            const payload = SensorStateResponse.encode({ key: 42, state: 21.5, missingState: false }).finish();
            const parsed = stateParser(readData(MessageTypes.SensorStateResponse, payload)) as SensorStateResponse;
            expect(parsed.key).toBe(42);
            expect(parsed.state).toBeCloseTo(21.5);
            expect(parsed.missingState).toBe(false);
        });

        it('decodes a switch state response', () => {
            const payload = SwitchStateResponse.encode({ key: 7, state: false }).finish();
            const parsed = stateParser(readData(MessageTypes.SwitchStateResponse, payload));
            expect(parsed).toEqual({ key: 7, state: false });
        });

        it('decodes a light state response', () => {
            const payload = LightStateResponse.encode({
                key: 5,
                state: true,
                brightness: 0.5,
                red: 1,
                green: 0.2,
                blue: 0.3,
                white: 0,
                colorTemperature: 153,
                effect: 'float',
                colorBrightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB,
                coldWhite: 1,
                warmWhite: 1,
            }).finish();
            const parsed = stateParser(readData(MessageTypes.LightStateResponse, payload)) as LightStateResponse;
            expect(parsed.key).toBe(5);
            expect(parsed.state).toBe(true);
            expect(parsed.brightness).toBeCloseTo(0.5);
            expect(parsed.effect).toBe('float');
            expect(parsed.colorTemperature).toBe(153);
            expect(parsed.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
            expect(parsed.colorBrightness).toBeCloseTo(1);
            expect(parsed.coldWhite).toBeCloseTo(1);
            expect(parsed.warmWhite).toBeCloseTo(1);
        });

        it('decodes a cover state response', () => {
            const payload = CoverStateResponse.encode({
                key: 9,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_OPEN,
                position: 0.75,
                tilt: 0.5,
                currentOperation: CoverOperation.COVER_OPERATION_IS_OPENING,
            }).finish();
            const parsed = stateParser(readData(MessageTypes.CoverStateResponse, payload)) as CoverStateResponse;
            expect(parsed.key).toBe(9);
            expect(parsed.legacyState).toBe(LegacyCoverState.LEGACY_COVER_STATE_OPEN);
            expect(parsed.position).toBeCloseTo(0.75);
            expect(parsed.tilt).toBeCloseTo(0.5);
            expect(parsed.currentOperation).toBe(CoverOperation.COVER_OPERATION_IS_OPENING);
        });

        it('decodes a fan state response', () => {
            const payload = FanStateResponse.encode({
                key: 11,
                state: true,
                oscillating: true,
                speed: FanSpeed.FAN_SPEED_MEDIUM,
                direction: FanDirection.FAN_DIRECTION_REVERSE,
                speedLevel: 2,
                presetMode: 'auto',
            }).finish();
            const parsed = stateParser(readData(MessageTypes.FanStateResponse, payload)) as FanStateResponse;
            expect(parsed.key).toBe(11);
            expect(parsed.state).toBe(true);
            expect(parsed.oscillating).toBe(true);
            expect(parsed.speed).toBe(FanSpeed.FAN_SPEED_MEDIUM);
            expect(parsed.direction).toBe(FanDirection.FAN_DIRECTION_REVERSE);
            expect(parsed.speedLevel).toBe(2);
            expect(parsed.presetMode).toBe('auto');
        });

        it('decodes a fan state response from golden wire bytes', () => {
            // Pin the state field numbers independently of the generated
            // encoder: key=134 fixed32 (1), state (2), oscillating (3),
            // direction=REVERSE (5), speed_level=2 (6), preset_mode="auto" (7).
            const payload = new Uint8Array([
                0x0d, 0x86, 0x00, 0x00, 0x00, 0x10, 0x01, 0x18, 0x01, 0x28, 0x01, 0x30, 0x02, 0x3a, 0x04, 0x61, 0x75,
                0x74, 0x6f,
            ]);
            const parsed = stateParser(readData(MessageTypes.FanStateResponse, payload)) as FanStateResponse;
            expect(parsed).toEqual({
                key: 134,
                state: true,
                oscillating: true,
                speed: FanSpeed.FAN_SPEED_LOW,
                direction: FanDirection.FAN_DIRECTION_REVERSE,
                speedLevel: 2,
                presetMode: 'auto',
            });
        });

        it('decodes a fan list response from golden wire bytes', () => {
            // Pin the hand-added list fields independently of the generated
            // encoder: key=7 fixed32 (2), supports_speed (6),
            // supported_speed_count=3 (8), supported_preset_modes=["auto"] (12).
            const payload = new Uint8Array([
                0x15, 0x07, 0x00, 0x00, 0x00, 0x30, 0x01, 0x40, 0x03, 0x62, 0x04, 0x61, 0x75, 0x74, 0x6f,
            ]);
            const parsed = ListEntitiesFanResponse.decode(payload);
            expect(parsed.key).toBe(7);
            expect(parsed.supportsSpeed).toBe(true);
            expect(parsed.supportedSpeedCount).toBe(3);
            expect(parsed.supportedPresetModes).toEqual(['auto']);
        });

        it('falls back to the protobuf defaults for an empty payload', () => {
            const parsed = stateParser(readData(MessageTypes.SensorStateResponse, new Uint8Array()));
            expect(parsed as SensorStateResponse).toEqual({ key: 0, state: 0, missingState: false });

            const emptyCover = stateParser(readData(MessageTypes.CoverStateResponse, new Uint8Array()));
            expect(emptyCover as CoverStateResponse).toEqual({
                key: 0,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_OPEN,
                position: 0,
                tilt: 0,
                currentOperation: CoverOperation.COVER_OPERATION_IDLE,
            });
            expect(ListEntitiesCoverResponse.decode(new Uint8Array()).supportsStop).toBe(false);
        });

        it('returns undefined instead of throwing for a malformed payload', () => {
            const malformed = new Uint8Array(10).fill(0xff);

            expect(stateParser(readData(MessageTypes.SwitchStateResponse, malformed))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.LightStateResponse, malformed))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.FanStateResponse, malformed))).toBeUndefined();
        });

        it('returns undefined for non state message types', () => {
            expect(stateParser(readData(MessageTypes.HelloResponse, new Uint8Array()))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.ConnectResponse, new Uint8Array()))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.SubscribeStatesRequest, new Uint8Array()))).toBeUndefined();
        });

        it('returns undefined for list entity message types', () => {
            const payload = ListEntitiesSensorResponse.encode({
                objectId: 'sensor',
                key: 1,
                name: 'Sensor',
                uniqueId: 'uid',
                icon: '',
                unitOfMeasurement: '',
                accuracyDecimals: 0,
                forceUpdate: false,
                deviceClass: '',
            }).finish();
            expect(stateParser(readData(MessageTypes.ListEntitiesSensorResponse, payload))).toBeUndefined();
        });
    });

    describe('transformStates', () => {
        it('only forwards state events for the matching key', async () => {
            const stateEvents$ = new Subject<StateResponses>();
            const listEntity: ListEntitiesLightResponse = {
                objectId: 'transform_test',
                key: 99,
                name: 'My light',
                uniqueId: 'transform_test_uid',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [],
            };
            const transformed$ = transformStates<LightStateResponse>(stateEvents$, listEntity);

            const firstMatchingEvent = firstValueFrom(transformed$);
            stateEvents$.next({ key: 42 } as StateResponses);
            stateEvents$.next({ key: 99, state: true, brightness: 1 });

            const received = await firstMatchingEvent;
            expect(received).toEqual({ key: 99, state: true, brightness: 1 });
        });
    });

    describe('createComponents', () => {
        let stateEvents$: Subject<StateResponses>;
        let debugConnection: DebugConnection;

        beforeEach(() => {
            stateEvents$ = new Subject<StateResponses>();
            debugConnection = new DebugConnection();
        });

        it('creates a switch component and wires its state', () => {
            const payload = ListEntitiesSwitchResponse.encode({
                objectId: 'created_switch',
                key: 32,
                name: 'Kitchen switch',
                uniqueId: 'uid_32',
                icon: 'mdi:toggle-switch',
                assumedState: true,
            }).finish();
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesSwitchResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_switch');
            expect(component).toBeInstanceOf(SwitchComponent);
            const switchComponent = component as SwitchComponent;
            expect(switchComponent.type).toBe('switch');
            expect(switchComponent.name).toBe('Kitchen switch');
            expect(switchComponent.key).toBe(32);

            stateEvents$.next({ key: 32, state: true });
            expect(switchComponent.status).toBe(true);
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
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesLightResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_light');
            expect(component).toBeInstanceOf(LightComponent);
            const lightComponent = component as LightComponent;
            expect(lightComponent.type).toBe('light');
            expect(lightComponent.supportsRgb).toBe(true);
            expect(lightComponent.supportsBrightness).toBe(true);
            expect(lightComponent.supportsColorMode).toBe(true);
            expect(lightComponent.supportedColorModes).toEqual([
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            ]);
            expect(lightComponent.supportsColorTemperature).toBe(true);
            expect(lightComponent.minMireds).toBe(153);
            expect(lightComponent.maxMireds).toBe(500);
            expect(lightComponent.availableEffects()).toEqual(['None', 'Rainbow']);
        });

        it('creates a cover component with its entity details', () => {
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
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesCoverResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_cover');
            expect(component).toBeInstanceOf(CoverComponent);
            const coverComponent = component as CoverComponent;
            expect(coverComponent.type).toBe('cover');
            expect(coverComponent.supportsPosition).toBe(true);
            expect(coverComponent.supportsStop).toBe(true);
            expect(coverComponent.supportsTilt).toBe(false);
            expect(coverComponent.assumedState).toBe(true);
            expect(coverComponent.tilt).toBeUndefined();

            stateEvents$.next({
                key: 9,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_CLOSED,
                position: 0.4,
                tilt: 0,
                currentOperation: CoverOperation.COVER_OPERATION_IS_CLOSING,
            });
            expect(coverComponent.position).toBeCloseTo(0.4);
            expect(coverComponent.operation).toBe(CoverOperation.COVER_OPERATION_IS_CLOSING);
            expect(coverComponent.isClosed).toBe(false);
        });

        it('creates a fan component with its capabilities and state', () => {
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
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesFanResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_fan');
            expect(component).toBeInstanceOf(FanComponent);
            const fanComponent = component as FanComponent;
            expect(fanComponent.type).toBe('fan');
            expect(fanComponent.speedCount).toBe(4);
            expect(fanComponent.supportsSpeed).toBe(true);
            expect(fanComponent.supportsOscillation).toBe(true);
            expect(fanComponent.supportsDirection).toBe(true);
            expect(fanComponent.supportedPresetModes).toEqual(['auto', 'sleep']);
            expect(fanComponent.ready).toBe(false);

            stateEvents$.next({
                key: 10,
                state: true,
                speedLevel: 2,
                oscillating: true,
                direction: FanDirection.FAN_DIRECTION_REVERSE,
                presetMode: 'sleep',
            });
            expect(fanComponent.ready).toBe(true);
            expect(fanComponent.status).toBe(true);
            expect(fanComponent.speedLevel).toBe(2);
            expect(fanComponent.speedPercentage).toBe(50);
            expect(fanComponent.oscillating).toBe(true);
            expect(fanComponent.direction).toBe(FanDirection.FAN_DIRECTION_REVERSE);
            expect(fanComponent.presetMode).toBe('sleep');
        });

        it('creates a fan component that uses the legacy speed enum for old API versions', () => {
            const payload = ListEntitiesFanResponse.encode({
                ...ListEntitiesFanResponse.decode(new Uint8Array()),
                objectId: 'legacy_fan',
                key: 13,
                name: 'Old fan',
                uniqueId: 'uid_old_fan',
                supportsSpeed: true,
            }).finish();
            const { component } = createComponents(
                readData(MessageTypes.ListEntitiesFanResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
                { major: 1, minor: 3 },
            );

            expect(component).toBeInstanceOf(FanComponent);
            const fanComponent = component as FanComponent;
            expect(fanComponent.speedCount).toBe(3);

            stateEvents$.next({ key: 13, state: true, speed: FanSpeed.FAN_SPEED_HIGH });
            expect(fanComponent.speedLevel).toBe(3);
            expect(fanComponent.speedPercentage).toBe(100);
        });

        it('creates a sensor component with its entity details and state', () => {
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
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesSensorResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_sensor');
            expect(component).toBeInstanceOf(SensorComponent);
            const sensorComponent = component as SensorComponent;
            expect(sensorComponent.type).toBe('sensor');
            expect(sensorComponent.icon).toBe('mdi:thermometer');
            expect(sensorComponent.unitOfMeasurement).toBe('°C');
            expect(sensorComponent.deviceClass).toBe('temperature');

            stateEvents$.next({ key: 1578816251, state: 22.5 } as StateResponses);
            expect(sensorComponent.value).toBeCloseTo(22.5);
        });

        it('creates a binary sensor component which receives its state', () => {
            const payload = ListEntitiesBinarySensorResponse.encode({
                objectId: 'created_binary_sensor',
                key: 12,
                name: 'Back door',
                uniqueId: 'uid_bs',
                deviceClass: 'door',
                isStatusBinarySensor: true,
            }).finish();
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesBinarySensorResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_binary_sensor');
            expect(component).toBeInstanceOf(BinarySensorComponent);
            const binarySensorComponent = component as BinarySensorComponent;
            expect(binarySensorComponent.type).toBe('binarySensor');
            expect(binarySensorComponent.deviceClass).toBe('door');
            expect(binarySensorComponent.ready).toBe(false);

            stateEvents$.next({ key: 12, state: true });
            expect(binarySensorComponent.ready).toBe(true);
            expect(binarySensorComponent.status).toBe(true);
        });

        it('only provides the state observable for known components', async () => {
            const objectId = 'already_known';
            const payload = ListEntitiesSwitchResponse.encode({
                objectId,
                key: 55,
                name: 'Hallway switch',
                uniqueId: 'uid_55',
                icon: '',
                assumedState: false,
            }).finish();
            const { id, component, state$ } = createComponents(
                readData(MessageTypes.ListEntitiesSwitchResponse, payload),
                stateEvents$,
                debugConnection,
                new Set([objectId]),
            );

            expect(component).toBeUndefined();
            expect(id).toBe(objectId);
            expect(state$).toBeDefined();

            const firstMatchingEvent = firstValueFrom(state$!);
            stateEvents$.next({ key: 42, state: true });
            stateEvents$.next({ key: 55, state: false });

            const received = await firstMatchingEvent;
            expect(received).toEqual({ key: 55, state: false });
        });

        it('uses deterministic key-based IDs for empty object IDs across every supported entity type', () => {
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

            for (const [type, payload, componentType] of entities) {
                const result = createComponents(readData(type, payload), stateEvents$, debugConnection, new Set());
                expect(result.id).toBe(fallbackEntityId(result.key!));
                expect(result.component).toBeInstanceOf(componentType);
                expect(result.fallback).toBe(true);
            }
        });

        it('avoids a fallback ID already occupied by a different object ID', () => {
            const id = fallbackEntityId(17);
            const response = ListEntitiesSensorResponse.encode({
                ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                key: 17,
            }).finish();
            const result = createComponents(
                readData(MessageTypes.ListEntitiesSensorResponse, response),
                stateEvents$,
                debugConnection,
                new Map([[id, 99]]),
            );

            expect(result.id).toBe(`${id}_1`);
            expect(result.component).toBeInstanceOf(SensorComponent);
        });

        it('reuses the existing ID by numeric key when object ID changes', () => {
            const existingId = 'sensor_before';
            const response = ListEntitiesSensorResponse.encode({
                ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                objectId: '',
                key: 18,
            }).finish();
            const result = createComponents(
                readData(MessageTypes.ListEntitiesSensorResponse, response),
                stateEvents$,
                debugConnection,
                new Map([[existingId, 18]]),
            );

            expect(result.id).toBe(existingId);
            expect(result.component).toBeUndefined();
            expect(result.state$).toBeDefined();
        });

        it('does not overwrite a different entity with a duplicate nonempty object ID', () => {
            const response = ListEntitiesSwitchResponse.encode({
                ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                objectId: 'duplicate_object_id',
                key: 19,
            }).finish();
            const result = createComponents(
                readData(MessageTypes.ListEntitiesSwitchResponse, response),
                stateEvents$,
                debugConnection,
                new Map([['duplicate_object_id', 20]]),
            );

            expect(result.id).toBe(fallbackEntityId(19));
            expect(result.fallback).toBe(true);
            expect(result.component).toBeInstanceOf(SwitchComponent);
        });

        it('returns an empty entry for list entity message types outside the component switch', () => {
            const result = createComponents(
                readData(MessageTypes.ListEntitiesRequest, new Uint8Array()),
                stateEvents$,
                debugConnection,
                new Set(),
            );
            expect(result).toEqual({ id: '' });
            expect(result.component).toBeUndefined();
            expect(result.state$).toBeUndefined();
        });

        it('returns an empty entry for plain requests sent through the switch', () => {
            const result = createComponents(
                readData(MessageTypes.SubscribeLogsRequest, new Uint8Array()),
                stateEvents$,
                debugConnection,
                new Set(['whatever']),
            );
            expect(result).toEqual({ id: '' });
        });
    });

    describe('emptyCommandInterface', () => {
        it('silently accepts any command', () => {
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.PingRequest, new Uint8Array()),
            ).not.toThrow();
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.LightCommandRequest, new Uint8Array([1, 2, 3])),
            ).not.toThrow();
        });
    });
});
