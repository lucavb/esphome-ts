import * as api from '../../src';
import {
    ClimateAction,
    ClimateFanMode,
    ClimateMode,
    ClimatePreset,
    ClimateSwingMode,
    ColorMode,
    CoverOperation,
    FanDirection,
    FanSpeed,
    LegacyCoverState,
    TemperatureUnit,
} from '../../src/api/protobuf/api';

describe('package export surface', () => {
    it('exposes the documented runtime exports', () => {
        expect(api.EspDevice).toBeDefined();
        expect(api.InvalidPasswordError).toBeDefined();
        expect(api.EncryptionError).toBeDefined();
        expect(api.ConnectionHandshakeError).toBeDefined();
        expect(api.InvalidEncryptionKeyError).toBeDefined();
        expect(api.InvalidEncryptionKeyFormatError).toBeDefined();
        expect(api.EncryptionRequiredError).toBeDefined();
        expect(api.EncryptionPlaintextError).toBeDefined();
        expect(api.EncryptionHandshakeError).toBeDefined();
        expect(api.Client).toBeDefined();
        expect(api.EspSocket).toBeDefined();
        expect(api.MessageTypes).toBeDefined();
        expect(api.isSwitchComponent).toBeDefined();
        expect(api.isTrue).toBeDefined();
        expect(api.isFalse).toBeDefined();
    });

    it('keeps every encryption error under the EncryptionError base', () => {
        const errors = [
            new api.InvalidEncryptionKeyError(),
            new api.InvalidEncryptionKeyFormatError(),
            new api.EncryptionRequiredError(),
            new api.EncryptionPlaintextError(),
            new api.EncryptionHandshakeError('test'),
        ];
        for (const error of errors) {
            expect(error).toBeInstanceOf(api.EncryptionError);
        }
        expect(new api.ConnectionHandshakeError('test')).not.toBeInstanceOf(api.EncryptionError);
    });

    it('exposes every component class from the root barrel', () => {
        // Enumerated from src/components/index.ts: each component class must be
        // reachable through the root barrel.
        expect(api.BaseComponent).toBeDefined();
        expect(api.BinarySensorComponent).toBeDefined();
        expect(api.LightComponent).toBeDefined();
        expect(api.SensorComponent).toBeDefined();
        expect(api.SwitchComponent).toBeDefined();
        expect(api.CoverComponent).toBeDefined();
        expect(api.FanComponent).toBeDefined();
        expect(api.ClimateComponent).toBeDefined();
    });

    it('exposes BinarySensorTypes through the root barrel', () => {
        // test/components/binarySensor.spec.ts deep-imports past the barrel;
        // consumers using only the public surface still need it here.
        expect(api.BinarySensorTypes).toBeDefined();
    });

    it('exposes the cover and fan enums downstream code needs at runtime', () => {
        expect(api.CoverOperation).toBe(CoverOperation);
        expect(api.LegacyCoverState).toBe(LegacyCoverState);
        expect(api.FanDirection).toBe(FanDirection);
        expect(api.FanSpeed).toBe(FanSpeed);
    });

    it('exposes the climate enums downstream code needs at runtime', () => {
        expect(api.ClimateMode).toBe(ClimateMode);
        expect(api.ClimateFanMode).toBe(ClimateFanMode);
        expect(api.ClimateSwingMode).toBe(ClimateSwingMode);
        expect(api.ClimateAction).toBe(ClimateAction);
        expect(api.ClimatePreset).toBe(ClimatePreset);
        expect(api.TemperatureUnit).toBe(TemperatureUnit);
        // Pin every wire value: a regenerated proto that silently renumbers a
        // member would change what commands mean on the wire. ClimateMode is
        // checked against the upstream values after the heat/cool and auto
        // split: firmware older than that split reports its automatic
        // heat/cool mode as HEAT_COOL (1), and AUTO (6) is the newer value.
        const expectedModes: Record<string, number> = {
            CLIMATE_MODE_OFF: 0,
            CLIMATE_MODE_HEAT_COOL: 1,
            CLIMATE_MODE_COOL: 2,
            CLIMATE_MODE_HEAT: 3,
            CLIMATE_MODE_FAN_ONLY: 4,
            CLIMATE_MODE_DRY: 5,
            CLIMATE_MODE_AUTO: 6,
        };
        const expectedFanModes: Record<string, number> = {
            CLIMATE_FAN_ON: 0,
            CLIMATE_FAN_OFF: 1,
            CLIMATE_FAN_AUTO: 2,
            CLIMATE_FAN_LOW: 3,
            CLIMATE_FAN_MEDIUM: 4,
            CLIMATE_FAN_HIGH: 5,
            CLIMATE_FAN_MIDDLE: 6,
            CLIMATE_FAN_FOCUS: 7,
            CLIMATE_FAN_DIFFUSE: 8,
            CLIMATE_FAN_QUIET: 9,
        };
        const expectedSwingModes: Record<string, number> = {
            CLIMATE_SWING_OFF: 0,
            CLIMATE_SWING_BOTH: 1,
            CLIMATE_SWING_VERTICAL: 2,
            CLIMATE_SWING_HORIZONTAL: 3,
        };
        // ClimateAction deliberately has no value 1.
        const expectedActions: Record<string, number> = {
            CLIMATE_ACTION_OFF: 0,
            CLIMATE_ACTION_COOLING: 2,
            CLIMATE_ACTION_HEATING: 3,
            CLIMATE_ACTION_IDLE: 4,
            CLIMATE_ACTION_DRYING: 5,
            CLIMATE_ACTION_FAN: 6,
            CLIMATE_ACTION_DEFROSTING: 7,
        };
        const expectedPresets: Record<string, number> = {
            CLIMATE_PRESET_NONE: 0,
            CLIMATE_PRESET_HOME: 1,
            CLIMATE_PRESET_AWAY: 2,
            CLIMATE_PRESET_BOOST: 3,
            CLIMATE_PRESET_COMFORT: 4,
            CLIMATE_PRESET_ECO: 5,
            CLIMATE_PRESET_SLEEP: 6,
            CLIMATE_PRESET_ACTIVITY: 7,
        };
        const expectedTemperatureUnits: Record<string, number> = {
            TEMPERATURE_UNIT_CELSIUS: 0,
            TEMPERATURE_UNIT_FAHRENHEIT: 1,
            TEMPERATURE_UNIT_KELVIN: 2,
        };
        const expectations: [Record<string, number>, Record<string, number | string>][] = [
            [expectedModes, ClimateMode],
            [expectedFanModes, ClimateFanMode],
            [expectedSwingModes, ClimateSwingMode],
            [expectedActions, ClimateAction],
            [expectedPresets, ClimatePreset],
            [expectedTemperatureUnits, TemperatureUnit],
        ];
        for (const [expected, enumObject] of expectations) {
            for (const [name, value] of Object.entries(expected)) {
                expect(enumObject[name]).toBe(value);
            }
        }
    });

    it('exposes the light color mode enum downstream code needs at runtime', () => {
        expect(api.ColorMode).toBe(ColorMode);
        // Pin every wire value: ColorMode members are capability bitmasks, so a
        // regenerated enum with a wrong number would silently change commands.
        const expected: Record<string, number> = {
            COLOR_MODE_UNKNOWN: 0,
            COLOR_MODE_ON_OFF: 1,
            COLOR_MODE_LEGACY_BRIGHTNESS: 2,
            COLOR_MODE_BRIGHTNESS: 3,
            COLOR_MODE_WHITE: 7,
            COLOR_MODE_COLOR_TEMPERATURE: 11,
            COLOR_MODE_COLD_WARM_WHITE: 19,
            COLOR_MODE_RGB: 35,
            COLOR_MODE_RGB_WHITE: 39,
            COLOR_MODE_RGB_COLOR_TEMPERATURE: 47,
            COLOR_MODE_RGB_COLD_WARM_WHITE: 51,
        };
        for (const [name, value] of Object.entries(expected)) {
            expect(api.ColorMode[name as keyof typeof api.ColorMode]).toBe(value);
        }
    });

    it('exports exactly the supported runtime surface', () => {
        // This snapshot is the public runtime contract: additions, removals and
        // renames must update it consciously. It replaces the old name-by-name
        // absence list, which went vacuous when the discovery helpers were
        // renamed, and it keeps internal adapters such as RxjsSocket out of the
        // surface.
        expect(Object.keys(api).sort()).toEqual([
            'BaseComponent',
            'BinarySensorComponent',
            'BinarySensorTypes',
            'Client',
            'ClimateAction',
            'ClimateComponent',
            'ClimateFanMode',
            'ClimateMode',
            'ClimatePreset',
            'ClimateSwingMode',
            'ColorMode',
            'ConnectionHandshakeError',
            'CoverComponent',
            'CoverOperation',
            'EncryptionError',
            'EncryptionHandshakeError',
            'EncryptionPlaintextError',
            'EncryptionRequiredError',
            'EspDevice',
            'EspSocket',
            'FanComponent',
            'FanDirection',
            'FanSpeed',
            'InvalidEncryptionKeyError',
            'InvalidEncryptionKeyFormatError',
            'InvalidPasswordError',
            'LegacyCoverState',
            'LightComponent',
            'MessageTypes',
            'SensorComponent',
            'SwitchComponent',
            'TemperatureUnit',
            'isFalse',
            'isSwitchComponent',
            'isTrue',
        ]);
    });
});
