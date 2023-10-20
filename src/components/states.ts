import { CoverOperation, LegacyCoverState } from "../api/protobuf/api";

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

export interface LightStateEvent extends StateEvent {
    state?: boolean;
    brightness?: number;
    red?: number;
    green?: number;
    blue?: number;
    effect?: string;
}

export interface CoverStateEvent extends StateEvent {
    state?: LegacyCoverState;
    position?: number;
    tilt?: number;
    operationr?: CoverOperation;
}
