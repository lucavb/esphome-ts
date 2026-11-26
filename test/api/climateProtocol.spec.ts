import {
    ClimateAction,
    ClimateCommandRequest,
    ClimateFanMode,
    ClimateMode,
    ClimatePreset,
    ClimateStateResponse,
    ClimateSwingMode,
    ListEntitiesClimateResponse,
} from '../../src/api/protobuf/api';

/**
 * These frames are built by hand the way ESPHome encodes them on the wire.
 * They pin the field numbers against the firmware rather than against our
 * own encoder, so a regression like silently renumbering a command field
 * fails here.
 */
const tag = (field: number, wireType: number): number[] => {
    let value = (field << 3) | wireType;
    const bytes: number[] = [];
    while (value > 0x7f) {
        bytes.push((value & 0x7f) | 0x80);
        value >>>= 7;
    }
    bytes.push(value);
    return bytes;
};

const fixed32 = (value: number): number[] => {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, value, true);
    return [...new Uint8Array(view.buffer)];
};

const float = (value: number): number[] => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, value, true);
    return [...new Uint8Array(view.buffer)];
};

const string = (field: number, value: string): number[] => {
    const bytes = [...new TextEncoder().encode(value)];
    return [...tag(field, 2), bytes.length, ...bytes];
};

const bool = (field: number, value: boolean): number[] => [...tag(field, 0), value ? 1 : 0];

describe('climate protocol fields', () => {
    it('uses the firmware command field numbers for the legacy away toggle and the fields after it', () => {
        const expected = new Uint8Array([
            ...tag(1, 5),
            ...fixed32(134),
            ...bool(10, true), // unused_has_legacy_away
            ...bool(11, true), // unused_legacy_away
            ...bool(16, true), // has_custom_fan_mode
            ...string(17, 'silent'),
            ...bool(18, true), // has_preset
            ...tag(19, 0),
            ClimatePreset.CLIMATE_PRESET_ECO, // preset
            ...bool(20, true), // has_custom_preset
            ...string(21, 'eco+'),
            ...bool(22, true), // has_target_humidity
            ...tag(23, 5),
            ...float(1),
        ]);

        const decoded = ClimateCommandRequest.decode(expected);
        expect(decoded.key).toBe(134);
        expect(decoded.unusedHasLegacyAway).toBe(true);
        expect(decoded.unusedLegacyAway).toBe(true);
        expect(decoded.hasCustomFanMode).toBe(true);
        expect(decoded.customFanMode).toBe('silent');
        expect(decoded.hasPreset).toBe(true);
        expect(decoded.preset).toBe(ClimatePreset.CLIMATE_PRESET_ECO);
        expect(decoded.hasCustomPreset).toBe(true);
        expect(decoded.customPreset).toBe('eco+');
        expect(decoded.hasTargetHumidity).toBe(true);
        expect(decoded.targetHumidity).toBeCloseTo(1);

        const encoded = ClimateCommandRequest.encode({
            ...ClimateCommandRequest.decode(new Uint8Array()),
            key: 134,
            unusedHasLegacyAway: true,
            unusedLegacyAway: true,
            hasCustomFanMode: true,
            customFanMode: 'silent',
            hasPreset: true,
            preset: ClimatePreset.CLIMATE_PRESET_ECO,
            hasCustomPreset: true,
            customPreset: 'eco+',
            hasTargetHumidity: true,
            targetHumidity: 1,
        }).finish();
        expect([...encoded]).toEqual([...expected]);
    });

    it('encodes zero setpoints as the has flag with the float omitted', () => {
        const encoded = ClimateCommandRequest.encode({
            ...ClimateCommandRequest.decode(new Uint8Array()),
            key: 134,
            hasTargetTemperature: true,
            targetTemperature: 0,
            hasTargetHumidity: true,
            targetHumidity: 0,
        }).finish();

        expect([...encoded]).toEqual([
            ...tag(1, 5),
            ...fixed32(134),
            ...bool(4, true), // has_target_temperature
            ...bool(22, true), // has_target_humidity
        ]);
    });

    it('uses the firmware command field numbers for mode, setpoints, fan and swing', () => {
        const expected = new Uint8Array([
            ...tag(1, 5),
            ...fixed32(134),
            ...bool(2, true), // has_mode
            ...tag(3, 0),
            ClimateMode.CLIMATE_MODE_COOL,
            ...bool(4, true), // has_target_temperature
            ...tag(5, 5),
            ...float(21.5),
            ...bool(6, true), // has_target_temperature_low
            ...tag(7, 5),
            ...float(19),
            ...bool(8, true), // has_target_temperature_high
            ...tag(9, 5),
            ...float(23),
            ...bool(12, true), // has_fan_mode
            ...tag(13, 0),
            ClimateFanMode.CLIMATE_FAN_HIGH,
            ...bool(14, true), // has_swing_mode
            ...tag(15, 0),
            ClimateSwingMode.CLIMATE_SWING_BOTH,
        ]);

        const decoded = ClimateCommandRequest.decode(expected);
        expect(decoded.key).toBe(134);
        expect(decoded.hasMode).toBe(true);
        expect(decoded.mode).toBe(ClimateMode.CLIMATE_MODE_COOL);
        expect(decoded.hasTargetTemperature).toBe(true);
        expect(decoded.targetTemperature).toBeCloseTo(21.5);
        expect(decoded.hasTargetTemperatureLow).toBe(true);
        expect(decoded.targetTemperatureLow).toBeCloseTo(19);
        expect(decoded.hasTargetTemperatureHigh).toBe(true);
        expect(decoded.targetTemperatureHigh).toBeCloseTo(23);
        expect(decoded.hasFanMode).toBe(true);
        expect(decoded.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_HIGH);
        expect(decoded.hasSwingMode).toBe(true);
        expect(decoded.swingMode).toBe(ClimateSwingMode.CLIMATE_SWING_BOTH);

        const encoded = ClimateCommandRequest.encode({
            ...ClimateCommandRequest.decode(new Uint8Array()),
            key: 134,
            hasMode: true,
            mode: ClimateMode.CLIMATE_MODE_COOL,
            hasTargetTemperature: true,
            targetTemperature: 21.5,
            hasTargetTemperatureLow: true,
            targetTemperatureLow: 19,
            hasTargetTemperatureHigh: true,
            targetTemperatureHigh: 23,
            hasFanMode: true,
            fanMode: ClimateFanMode.CLIMATE_FAN_HIGH,
            hasSwingMode: true,
            swingMode: ClimateSwingMode.CLIMATE_SWING_BOTH,
        }).finish();
        expect([...encoded]).toEqual([...expected]);
    });

    it('uses the firmware field numbers for the state response, including the legacy away flag', () => {
        // Field 7 is the legacy away toggle this client renamed to
        // unused_legacy_away. Pin it (and the surrounding state fields)
        // against hand-built firmware bytes, not our own encoder: a
        // renumbering here would silently disable the pre-1.5 preset path.
        const expected = new Uint8Array([
            ...tag(1, 5),
            ...fixed32(134),
            ...tag(2, 0),
            ClimateMode.CLIMATE_MODE_HEAT_COOL,
            ...tag(3, 5),
            ...float(21.5),
            ...tag(4, 5),
            ...float(23),
            ...tag(5, 5),
            ...float(19),
            ...tag(6, 5),
            ...float(24),
            ...bool(7, true), // unused_legacy_away
            ...tag(8, 0),
            ClimateAction.CLIMATE_ACTION_DEFROSTING,
            ...tag(9, 0),
            ClimateFanMode.CLIMATE_FAN_HIGH,
            ...tag(10, 0),
            ClimateSwingMode.CLIMATE_SWING_BOTH,
        ]);

        const decoded = ClimateStateResponse.decode(expected);
        expect(decoded.key).toBe(134);
        expect(decoded.mode).toBe(ClimateMode.CLIMATE_MODE_HEAT_COOL);
        expect(decoded.currentTemperature).toBeCloseTo(21.5);
        expect(decoded.targetTemperature).toBeCloseTo(23);
        expect(decoded.targetTemperatureLow).toBeCloseTo(19);
        expect(decoded.targetTemperatureHigh).toBeCloseTo(24);
        expect(decoded.unusedLegacyAway).toBe(true);
        expect(decoded.action).toBe(ClimateAction.CLIMATE_ACTION_DEFROSTING);
        expect(decoded.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_HIGH);
        expect(decoded.swingMode).toBe(ClimateSwingMode.CLIMATE_SWING_BOTH);
    });

    it('decodes the unpacked repeated enums the firmware actually emits', () => {
        const bytes = new Uint8Array([
            ...tag(2, 5),
            ...fixed32(134),
            // One tag per element, as ListEntitiesClimateResponse::encode_msg emits it.
            ...tag(7, 0),
            ClimateMode.CLIMATE_MODE_COOL,
            ...tag(13, 0),
            ClimateFanMode.CLIMATE_FAN_QUIET,
            ...tag(14, 0),
            ClimateSwingMode.CLIMATE_SWING_BOTH,
            ...tag(16, 0),
            ClimatePreset.CLIMATE_PRESET_HOME,
            ...tag(16, 0),
            ClimatePreset.CLIMATE_PRESET_AWAY,
            ...tag(16, 0),
            ClimatePreset.CLIMATE_PRESET_ECO,
        ]);

        const decoded = ListEntitiesClimateResponse.decode(bytes);
        expect(decoded.key).toBe(134);
        expect(decoded.supportedModes).toEqual([ClimateMode.CLIMATE_MODE_COOL]);
        expect(decoded.supportedFanModes).toEqual([ClimateFanMode.CLIMATE_FAN_QUIET]);
        expect(decoded.supportedSwingModes).toEqual([ClimateSwingMode.CLIMATE_SWING_BOTH]);
        expect(decoded.supportedPresets).toEqual([
            ClimatePreset.CLIMATE_PRESET_HOME,
            ClimatePreset.CLIMATE_PRESET_AWAY,
            ClimatePreset.CLIMATE_PRESET_ECO,
        ]);
    });
});
