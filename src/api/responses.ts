import { MessageTypes } from './requestResponseMatching';

export const listResponses: Set<MessageTypes> = new Set([
    MessageTypes.ListEntitiesBinarySensorResponse,
    MessageTypes.ListEntitiesCoverResponse,
    MessageTypes.ListEntitiesFanResponse,
    MessageTypes.ListEntitiesLightResponse,
    MessageTypes.ListEntitiesSensorResponse,
    MessageTypes.ListEntitiesSwitchResponse,
    MessageTypes.ListEntitiesTextSensorResponse,
    MessageTypes.ListEntitiesDoneResponse,
]);

export const stateResponses: Set<MessageTypes> = new Set([
    MessageTypes.BinarySensorStateResponse,
    MessageTypes.CoverStateResponse,
    MessageTypes.FanStateResponse,
    MessageTypes.LightStateResponse,
    MessageTypes.SensorStateResponse,
    MessageTypes.SwitchStateResponse,
    MessageTypes.TextSensorStateResponse,
]);
