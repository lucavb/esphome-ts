import {
    BinarySensorStateResponse,
    CoverStateResponse,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from './protobuf/api';

export type ListEntityResponses =
    | ListEntitiesBinarySensorResponse
    | ListEntitiesLightResponse
    | ListEntitiesSensorResponse
    | ListEntitiesSwitchResponse;

export type StateResponses =
    BinarySensorStateResponse | CoverStateResponse | LightStateResponse | SensorStateResponse | SwitchStateResponse;
