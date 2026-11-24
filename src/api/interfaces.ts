import {
    BinarySensorStateResponse,
    CoverStateResponse,
    FanStateResponse,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesCoverResponse,
    ListEntitiesFanResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from './protobuf/api';

export type ListEntityResponses =
    | ListEntitiesBinarySensorResponse
    | ListEntitiesCoverResponse
    | ListEntitiesFanResponse
    | ListEntitiesLightResponse
    | ListEntitiesSensorResponse
    | ListEntitiesSwitchResponse;

export type StateResponses =
    | BinarySensorStateResponse
    | CoverStateResponse
    | FanStateResponse
    | LightStateResponse
    | SensorStateResponse
    | SwitchStateResponse;
