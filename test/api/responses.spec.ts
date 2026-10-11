import { listResponses, stateResponses } from '../../src/api/responses';
import { MessageTypes } from '../../src/api/requestResponseMatching';

describe('responses', () => {
    it('tracks every list response createComponents can handle, covers included', () => {
        expect(listResponses).toEqual(
            new Set([
                MessageTypes.ListEntitiesBinarySensorResponse,
                MessageTypes.ListEntitiesCoverResponse,
                MessageTypes.ListEntitiesLightResponse,
                MessageTypes.ListEntitiesSensorResponse,
                MessageTypes.ListEntitiesSwitchResponse,
                MessageTypes.ListEntitiesDoneResponse,
            ]),
        );
    });

    it('tracks every state response stateParser decodes', () => {
        expect(stateResponses).toEqual(
            new Set([
                MessageTypes.BinarySensorStateResponse,
                MessageTypes.CoverStateResponse,
                MessageTypes.LightStateResponse,
                MessageTypes.SensorStateResponse,
                MessageTypes.SwitchStateResponse,
            ]),
        );
    });
});
