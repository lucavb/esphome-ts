import { type ReadData } from '../../src/api/framer';
import {
    BinarySensorStateResponse,
    ClimateAction,
    ClimateFanMode,
    ClimateMode,
    ClimatePreset,
    ClimateStateResponse,
    ClimateSwingMode,
    ColorMode,
    CoverOperation,
    CoverStateResponse,
    FanDirection,
    FanSpeed,
    FanStateResponse,
    LegacyCoverState,
    LightStateResponse,
    ListEntitiesCoverResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
    TemperatureUnit,
} from '../../src/api/protobuf/api';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import {
    decodeState,
    isComponentListResponse,
    isStateResponse,
    kindForListType,
} from '../../src/components/componentKinds';
import { type ClimateEntity, type FanEntity } from '../../src/components/entities';

const readData = (type: MessageTypes, payload: Uint8Array): ReadData => ({ type, payload });

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
            expect(sensor).toMatchObject({ key: 2, state: 21.5 });

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
            expect(cover).toMatchObject({
                key: 3,
                position: 0.75,
                tilt: 0.5,
                currentOperation: CoverOperation.COVER_OPERATION_IS_OPENING,
            });

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
                        colorTemperature: 300,
                        warmWhite: 0.5,
                    }).finish(),
                ),
            );
            expect(light).toMatchObject({
                key: 4,
                state: true,
                colorMode: ColorMode.COLOR_MODE_RGB,
                effect: 'Rainbow',
                colorTemperature: 300,
                warmWhite: 0.5,
            });

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

            const climate = decodeState(
                readData(
                    MessageTypes.ClimateStateResponse,
                    ClimateStateResponse.encode({
                        ...ClimateStateResponse.decode(new Uint8Array()),
                        key: 7,
                        mode: ClimateMode.CLIMATE_MODE_HEAT_COOL,
                        currentTemperature: 20.5,
                        targetTemperatureLow: 19,
                        targetTemperatureHigh: 22,
                        unusedLegacyAway: false,
                        action: 3,
                        fanMode: ClimateFanMode.CLIMATE_FAN_AUTO,
                        swingMode: 3,
                        customFanMode: 'Silent',
                        preset: ClimatePreset.CLIMATE_PRESET_AWAY,
                        customPreset: '',
                        currentHumidity: 51,
                        targetHumidity: 55,
                        missingState: false,
                    }).finish(),
                ),
            );
            expect(climate).toMatchObject({
                key: 7,
                mode: ClimateMode.CLIMATE_MODE_HEAT_COOL,
                currentTemperature: 20.5,
                targetTemperatureLow: 19,
                targetTemperatureHigh: 22,
                action: 3,
                fanMode: ClimateFanMode.CLIMATE_FAN_AUTO,
                swingMode: 3,
                customFanMode: 'Silent',
                preset: ClimatePreset.CLIMATE_PRESET_AWAY,
                currentHumidity: 51,
                targetHumidity: 55,
            });
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

        it('decodes a climate state response from golden wire bytes', () => {
            // Pin the hand-added state fields independently of the generated
            // encoder: key=134 fixed32 (1), custom_fan_mode="silent" (11),
            // preset=ECO (12), custom_preset="eco+" (13),
            // current_humidity=51 (14), target_humidity=55 (15),
            // missing_state=true (17).
            const payload = new Uint8Array([
                0x0d, 0x86, 0x00, 0x00, 0x00, 0x5a, 0x06, 0x73, 0x69, 0x6c, 0x65, 0x6e, 0x74, 0x60, 0x05, 0x6a, 0x04,
                0x65, 0x63, 0x6f, 0x2b, 0x75, 0x00, 0x00, 0x4c, 0x42, 0x7d, 0x00, 0x00, 0x5c, 0x42, 0x88, 0x01, 0x01,
            ]);
            expect(decodeState(readData(MessageTypes.ClimateStateResponse, payload))).toEqual({
                key: 134,
                mode: ClimateMode.CLIMATE_MODE_OFF,
                currentTemperature: 0,
                targetTemperature: 0,
                targetTemperatureLow: 0,
                targetTemperatureHigh: 0,
                unusedLegacyAway: false,
                action: ClimateAction.CLIMATE_ACTION_OFF,
                fanMode: ClimateFanMode.CLIMATE_FAN_ON,
                swingMode: 0,
                customFanMode: 'silent',
                preset: ClimatePreset.CLIMATE_PRESET_ECO,
                customPreset: 'eco+',
                currentHumidity: 51,
                targetHumidity: 55,
                missingState: true,
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
            expect(decodeState(readData(MessageTypes.ClimateStateResponse, new Uint8Array()))).toEqual({
                key: 0,
                mode: ClimateMode.CLIMATE_MODE_OFF,
                currentTemperature: 0,
                targetTemperature: 0,
                targetTemperatureLow: 0,
                targetTemperatureHigh: 0,
                unusedLegacyAway: false,
                action: ClimateAction.CLIMATE_ACTION_OFF,
                fanMode: ClimateFanMode.CLIMATE_FAN_ON,
                swingMode: ClimateSwingMode.CLIMATE_SWING_OFF,
                customFanMode: '',
                preset: ClimatePreset.CLIMATE_PRESET_NONE,
                customPreset: '',
                currentHumidity: 0,
                targetHumidity: 0,
                missingState: false,
            });
            expect(ListEntitiesCoverResponse.decode(new Uint8Array()).supportsStop).toBe(false);
        });

        it('drops a malformed state frame instead of throwing', () => {
            const malformed = new Uint8Array(10).fill(0xff);

            expect(decodeState(readData(MessageTypes.SwitchStateResponse, malformed))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.LightStateResponse, malformed))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.FanStateResponse, malformed))).toBeUndefined();
            expect(decodeState(readData(MessageTypes.ClimateStateResponse, malformed))).toBeUndefined();
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
            MessageTypes.ClimateStateResponse,
            MessageTypes.CoverStateResponse,
            MessageTypes.FanStateResponse,
            MessageTypes.LightStateResponse,
            MessageTypes.SensorStateResponse,
            MessageTypes.SwitchStateResponse,
        ];
        const listTypes = [
            MessageTypes.ListEntitiesBinarySensorResponse,
            MessageTypes.ListEntitiesClimateResponse,
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

        it('claims exactly the supported wire types', () => {
            // Enumerate the numeric enum members; the string entries are reverse
            // mappings. This fails when a kind claims a new list or state type
            // without a conscious update here.
            const allTypes = Object.values(MessageTypes).filter(
                (value): value is MessageTypes => typeof value === 'number',
            );
            const sorted = (types: readonly MessageTypes[]): MessageTypes[] => [...types].sort((a, b) => a - b);
            expect(sorted(allTypes.filter(isStateResponse))).toEqual(sorted(stateTypes));
            expect(sorted(allTypes.filter(isComponentListResponse))).toEqual(sorted(listTypes));
        });
    });

    describe('kindForListType', () => {
        it('decodes a fan list response from golden wire bytes', () => {
            // Pin the hand-added list fields independently of the generated
            // encoder: key=7 fixed32 (2), supports_speed (6),
            // supported_speed_count=3 (8), supported_preset_modes=["auto"] (12).
            const payload = new Uint8Array([
                0x15, 0x07, 0x00, 0x00, 0x00, 0x30, 0x01, 0x40, 0x03, 0x62, 0x04, 0x61, 0x75, 0x74, 0x6f,
            ]);
            const entity = kindForListType(MessageTypes.ListEntitiesFanResponse)?.decodeEntity(payload) as
                FanEntity | undefined;

            expect(entity).toMatchObject({
                key: 7,
                supportsSpeed: true,
                supportedSpeedCount: 3,
                supportedPresetModes: ['auto'],
            });
        });

        it('decodes a climate list response from golden wire bytes', () => {
            // Pin the hand-added list fields independently of the generated
            // encoder: key=134 fixed32 (2), legacy_supports_away (11),
            // supported_custom_fan_modes=["auto"] (15),
            // supported_presets packed (16; firmware emits the unpacked
            // form, pinned in climateProtocol.spec.ts),
            // supported_custom_presets=["eco+"] (17),
            // visual_current_temperature_step=0.1 (21),
            // supports_current_humidity (22), supports_target_humidity (23),
            // visual_min_humidity=30 (24), visual_max_humidity=60 (25),
            // temperature_unit=FAHRENHEIT (28).
            const payload = new Uint8Array([
                0x15, 0x86, 0x00, 0x00, 0x00, 0x58, 0x01, 0x7a, 0x04, 0x61, 0x75, 0x74, 0x6f, 0x82, 0x01, 0x03, 0x01,
                0x02, 0x05, 0x8a, 0x01, 0x04, 0x65, 0x63, 0x6f, 0x2b, 0xad, 0x01, 0xcd, 0xcc, 0xcc, 0x3d, 0xb0, 0x01,
                0x01, 0xb8, 0x01, 0x01, 0xc5, 0x01, 0x00, 0x00, 0xf0, 0x41, 0xcd, 0x01, 0x00, 0x00, 0x70, 0x42, 0xe0,
                0x01, 0x01,
            ]);
            const entity = kindForListType(MessageTypes.ListEntitiesClimateResponse)?.decodeEntity(payload) as
                ClimateEntity | undefined;

            expect(entity).toMatchObject({
                key: 134,
                legacySupportsAway: true,
                supportedCustomFanModes: ['auto'],
                supportedPresets: [
                    ClimatePreset.CLIMATE_PRESET_HOME,
                    ClimatePreset.CLIMATE_PRESET_AWAY,
                    ClimatePreset.CLIMATE_PRESET_ECO,
                ],
                supportedCustomPresets: ['eco+'],
                supportsCurrentHumidity: true,
                supportsTargetHumidity: true,
                temperatureUnit: TemperatureUnit.TEMPERATURE_UNIT_FAHRENHEIT,
            });
            // Floats widen from float32, so 0.1 is not exact.
            expect(entity?.visualCurrentTemperatureStep).toBeCloseTo(0.1);
            expect(entity?.visualMinHumidity).toBeCloseTo(30);
            expect(entity?.visualMaxHumidity).toBeCloseTo(60);
        });

        it('returns undefined for message types outside the registry', () => {
            expect(kindForListType(MessageTypes.ListEntitiesRequest)).toBeUndefined();
            expect(kindForListType(MessageTypes.ListEntitiesTextSensorResponse)).toBeUndefined();
            expect(kindForListType(MessageTypes.SubscribeLogsRequest)).toBeUndefined();
        });

        it('reports a malformed list frame by throwing', () => {
            const malformed = new Uint8Array(10).fill(0xff);
            expect(() => kindForListType(MessageTypes.ListEntitiesSwitchResponse)?.decodeEntity(malformed)).toThrow();
        });
    });
});
