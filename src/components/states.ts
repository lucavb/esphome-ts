import {
    type ClimateAction,
    type ClimateFanMode,
    type ClimateMode,
    type ClimatePreset,
    type ClimateSwingMode,
    type ColorMode,
    type CoverOperation,
    type FanDirection,
    type FanSpeed,
    type LegacyCoverState,
} from '../api/protobuf/api';

export interface StateEvent {
    key: number;
}

export interface SensorStateEvent extends StateEvent {
    state?: number;
    /**
     * True while the device has not published a valid state yet. Unlike
     * ClimateComponent, the sensor components do not suppress their getters
     * for such frames — `state` is the protobuf default 0 — so read this
     * flag to tell a real zero apart from a placeholder.
     */
    missingState?: boolean;
}

export interface BinarySensorStateEvent extends StateEvent {
    state?: boolean;
    /**
     * True while the device has not published a valid state yet. Unlike
     * ClimateComponent, the binary sensor component does not suppress its
     * getter for such frames — `state` is the protobuf default false — so
     * read this flag to tell a real off apart from a placeholder.
     */
    missingState?: boolean;
}

/**
 * The switch state frame. Unlike the binary sensor, the repo's
 * SwitchStateResponse does not model the wire's missing_state field, so no
 * flag is advertised here.
 */
export interface SwitchStateEvent extends StateEvent {
    state?: boolean;
}

export interface CoverStateEvent extends StateEvent {
    legacyState?: LegacyCoverState;
    position?: number;
    tilt?: number;
    currentOperation?: CoverOperation;
}

export interface FanStateEvent extends StateEvent {
    state?: boolean;
    oscillating?: boolean;
    /**
     * Legacy three-valued speed. Firmware before API 1.4 reports only this
     * field; 1.4/1.5 report both this and speedLevel; 1.6+ reports only
     * speedLevel. The component ignores it from API 1.4 onward.
     */
    speed?: FanSpeed;
    direction?: FanDirection;
    /**
     * Discrete speed level in the 1..supportedSpeedCount range. 0 means no
     * level has been reported; firmware retains the last level while off, so
     * use `state` for on/off.
     */
    speedLevel?: number;
    presetMode?: string;
}

export interface LightStateEvent extends StateEvent {
    state?: boolean;
    brightness?: number;
    red?: number;
    green?: number;
    blue?: number;
    /**
     * Active color mode. Firmware that predates color modes leaves it at
     * COLOR_MODE_UNKNOWN.
     */
    colorMode?: ColorMode;
    /**
     * Level of the RGB channels relative to the master brightness, 0..1. When
     * firmware does not report it, the channels are already at full scale.
     */
    colorBrightness?: number;
    white?: number;
    colorTemperature?: number;
    coldWhite?: number;
    warmWhite?: number;
    effect?: string;
}

export interface ClimateStateEvent extends StateEvent {
    mode?: ClimateMode;
    currentTemperature?: number;
    targetTemperature?: number;
    targetTemperatureLow?: number;
    targetTemperatureHigh?: number;
    /**
     * Legacy away flag, only sent by firmware before API 1.5. Newer firmware
     * reports the preset instead; the component's preset getter normalises
     * the two forms.
     */
    unusedLegacyAway?: boolean;
    action?: ClimateAction;
    fanMode?: ClimateFanMode;
    swingMode?: ClimateSwingMode;
    customFanMode?: string;
    preset?: ClimatePreset;
    customPreset?: string;
    currentHumidity?: number;
    targetHumidity?: number;
    /** True while the device has not published a valid state yet. */
    missingState?: boolean;
}
