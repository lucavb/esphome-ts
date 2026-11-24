import { MessageTypes } from './requestResponseMatching';

// Only message types EspDevice can actually handle are tracked here: list
// responses feed createComponents, state responses are decoded by stateParser.
// Text sensor announcements arrive on the wire but have no component support
// yet, so they are deliberately not listed.
export const listResponses: ReadonlySet<MessageTypes> = new Set([
    MessageTypes.ListEntitiesBinarySensorResponse,
    MessageTypes.ListEntitiesCoverResponse,
    MessageTypes.ListEntitiesFanResponse,
    MessageTypes.ListEntitiesLightResponse,
    MessageTypes.ListEntitiesSensorResponse,
    MessageTypes.ListEntitiesSwitchResponse,
    MessageTypes.ListEntitiesDoneResponse,
]);

export const stateResponses: ReadonlySet<MessageTypes> = new Set([
    MessageTypes.BinarySensorStateResponse,
    MessageTypes.CoverStateResponse,
    MessageTypes.FanStateResponse,
    MessageTypes.LightStateResponse,
    MessageTypes.SensorStateResponse,
    MessageTypes.SwitchStateResponse,
]);
