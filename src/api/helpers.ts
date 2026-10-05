import { type ReadData } from './espSocket';
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
import { MessageTypes } from './requestResponseMatching';
import { type ListEntityResponses, type StateResponses } from './interfaces';
import { type CommandInterface } from '../components/commandInterface';
import { filter, Observable } from 'rxjs';
import { BaseComponent } from '../components/base';
import { BinarySensorComponent } from '../components/binarySensor';
import { LightComponent } from '../components/light';
import { SensorComponent } from '../components/sensor';
import { SwitchComponent } from '../components/switch';

export const stateParser = (data: ReadData): StateResponses | undefined => {
    try {
        switch (data.type) {
            case MessageTypes.BinarySensorStateResponse: {
                return BinarySensorStateResponse.decode(data.payload);
            }
            case MessageTypes.LightStateResponse: {
                return LightStateResponse.decode(data.payload);
            }
            case MessageTypes.SensorStateResponse: {
                return SensorStateResponse.decode(data.payload);
            }
            case MessageTypes.SwitchStateResponse: {
                return SwitchStateResponse.decode(data.payload);
            }
            case MessageTypes.CoverStateResponse: {
                return CoverStateResponse.decode(data.payload);
            }
        }
    } catch {
        // A frame with a lying length or type byte decodes to garbage that
        // throws here. Dropping the frame keeps every subscriber of
        // stateEvents$ alive instead of tearing them down with the error.
        return undefined;
    }
    return undefined;
};

export const createComponents = (
    data: ReadData,
    stateEvents$: Observable<StateResponses>,
    connection: CommandInterface,
    knownComponents: Set<string>,
): { id: string; component?: BaseComponent; state$?: Observable<StateResponses> } => {
    switch (data.type) {
        case MessageTypes.ListEntitiesBinarySensorResponse: {
            const response: ListEntitiesBinarySensorResponse = ListEntitiesBinarySensorResponse.decode(data.payload);
            const state$ = transformStates<BinarySensorStateResponse>(stateEvents$, response);
            return knownComponents.has(response.objectId)
                ? {
                      id: response.objectId,
                      state$,
                  }
                : {
                      id: response.objectId,
                      component: new BinarySensorComponent(response, state$, emptyCommandInterface),
                  };
        }
        case MessageTypes.ListEntitiesSwitchResponse: {
            const response: ListEntitiesSwitchResponse = ListEntitiesSwitchResponse.decode(data.payload);
            const state$ = transformStates<SwitchStateResponse>(stateEvents$, response);
            return knownComponents.has(response.objectId)
                ? {
                      id: response.objectId,
                      state$,
                  }
                : {
                      id: response.objectId,
                      component: new SwitchComponent(response, state$, connection),
                  };
        }
        case MessageTypes.ListEntitiesLightResponse: {
            const response: ListEntitiesLightResponse = ListEntitiesLightResponse.decode(data.payload);
            const state$ = transformStates<LightStateResponse>(stateEvents$, response);
            return knownComponents.has(response.objectId)
                ? {
                      id: response.objectId,
                      state$,
                  }
                : {
                      id: response.objectId,
                      component: new LightComponent(response, state$, connection),
                  };
        }
        case MessageTypes.ListEntitiesSensorResponse: {
            const response: ListEntitiesSensorResponse = ListEntitiesSensorResponse.decode(data.payload);
            const state$ = transformStates<SensorStateResponse>(stateEvents$, response);
            return knownComponents.has(response.objectId)
                ? {
                      id: response.objectId,
                      state$,
                  }
                : {
                      id: response.objectId,
                      component: new SensorComponent(response, state$, emptyCommandInterface),
                  };
        }
    }
    return { id: '' };
};

export const emptyCommandInterface: CommandInterface = {
    sendEspMessage: () => undefined,
};

export const transformStates = <T extends StateResponses>(
    stateEvents$: Observable<StateResponses>,
    listEntityResponse: ListEntityResponses,
): Observable<T> => {
    return stateEvents$.pipe(filter((stateEvent) => stateEvent.key === listEntityResponse.key)) as Observable<T>;
};
