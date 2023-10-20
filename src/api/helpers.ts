import { ReadData } from './connection';
import {
    BinarySensorStateResponse,
    CoverStateResponse,
    LegacyCoverState,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesCoverResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from './protobuf/api';
import { MessageTypes } from './requestResponseMatching';
import { decode } from './client';
import { ListEntityResponses, StateResponses } from './interfaces';
import { CommandInterface } from '../components';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BaseComponent, BinarySensorComponent, CoverComponent, LightComponent, SensorComponent, SwitchComponent } from '..';

export const stateParser = (data: ReadData): StateResponses | undefined => {
    switch (data.type) {
        case MessageTypes.BinarySensorStateResponse: {
            return decode(BinarySensorStateResponse, data);
        }
        case MessageTypes.LightStateResponse: {
            return decode(LightStateResponse, data);
        }
        case MessageTypes.SensorStateResponse: {
            return decode(SensorStateResponse, data);
        }
        case MessageTypes.SwitchStateResponse: {
            return decode(SwitchStateResponse, data);
        }
        case MessageTypes.CoverStateResponse: {
            return decode(CoverStateResponse, data);
        }
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
            const response: ListEntitiesBinarySensorResponse = decode(ListEntitiesBinarySensorResponse, data);
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
            const response: ListEntitiesSwitchResponse = decode(ListEntitiesSwitchResponse, data);
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
            const response: ListEntitiesLightResponse = decode(ListEntitiesLightResponse, data);
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
            const response: ListEntitiesSensorResponse = decode(ListEntitiesSensorResponse, data);
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
        case MessageTypes.ListEntitiesCoverResponse: {
            const response: ListEntitiesCoverResponse = decode(ListEntitiesCoverResponse, data);
            const state$ = transformStates<CoverStateResponse>(stateEvents$, response);
            return knownComponents.has(response.objectId)
                ? {
                      id: response.objectId,
                      state$,
                  }
                : {
                      id: response.objectId,
                      component: new CoverComponent(response, state$, connection),
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

export const isTrue = (val: unknown): val is true => val === true;
export const isTruthy = (val: unknown): boolean => !!val;

export const isFalse = (val: unknown): val is false => val === false;
export const isFalsy = (val: unknown): boolean => !val;
