import { type CoverOperation, type FanDirection, type FanSpeed, type LegacyCoverState } from '../api/protobuf/api';

export interface StateEvent {
    key: number;
}

export interface SensorStateEvent extends StateEvent {
    state?: number;
}

export interface BinarySensorStateEvent extends StateEvent {
    state?: boolean;
}

export type SwitchStateEvent = BinarySensorStateEvent;

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
    effect?: string;
}
