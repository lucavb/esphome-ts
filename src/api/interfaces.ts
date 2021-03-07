import {
    BinarySensorStateResponse,
    CoverCommandRequest,
    CoverStateResponse,
    FanCommandRequest,
    FanStateResponse,
    LightCommandRequest,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesCoverResponse,
    ListEntitiesFanResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    ListEntitiesTextSensorResponse,
    SensorStateResponse,
    SwitchCommandRequest,
    SwitchStateResponse,
    TextSensorStateResponse,
} from './protobuf/api';

export type ListEntityResponses =
    | ListEntitiesBinarySensorResponse
    | ListEntitiesCoverResponse
    | ListEntitiesFanResponse
    | ListEntitiesLightResponse
    | ListEntitiesSensorResponse
    | ListEntitiesSwitchResponse
    | ListEntitiesTextSensorResponse;

export type StateResponses =
    | BinarySensorStateResponse
    | CoverStateResponse
    | FanStateResponse
    | LightStateResponse
    | SensorStateResponse
    | SwitchStateResponse
    | TextSensorStateResponse;

export type CommandRequests = CoverCommandRequest | FanCommandRequest | LightCommandRequest | SwitchCommandRequest;
