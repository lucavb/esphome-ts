import {ReadData} from './connection';
import {
    BinarySensorStateResponse,
    CoverStateResponse,
    LightStateResponse,
    ListEntitiesBinarySensorResponse, ListEntitiesLightResponse, ListEntitiesSensorResponse, ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from './protobuf/api';
import {MessageTypes} from './requestResponseMatching';
import {decode} from './client';
import {ListEntityResponses, StateResponses} from './interfaces';
import {CommandInterface} from '../components/commandInterface';
import {Observable} from 'rxjs';
import {filter} from 'rxjs/operators';
import {BaseComponent, BinarySensorComponent, LightComponent, SensorComponent, SwitchComponent} from '..';

export const stateParser = (data: ReadData): StateResponses => {
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
        default: {
            return decode(CoverStateResponse, data);
        }
    }
};

export const createComponents = (data: ReadData,
    stateEvents$: Observable<StateResponses>,
    connection: CommandInterface): { id: string, component?: BaseComponent } => {
    switch (data.type) {
        case MessageTypes.ListEntitiesBinarySensorResponse: {
            const response: ListEntitiesBinarySensorResponse = decode(ListEntitiesBinarySensorResponse, data);
            return {
                id: response.objectId,
                component: new BinarySensorComponent(response,
                    transformStates<BinarySensorStateResponse>(stateEvents$, response),
                    emptyCommandInterface,
                ),
            };
        }
        case MessageTypes.ListEntitiesSwitchResponse: {
            const response: ListEntitiesSwitchResponse = decode(ListEntitiesSwitchResponse, data);
            return {
                id: response.objectId,
                component: new SwitchComponent(response,
                    transformStates<SwitchStateResponse>(stateEvents$, response),
                    connection,
                ),
            };
        }
        case MessageTypes.ListEntitiesLightResponse: {
            const response: ListEntitiesLightResponse = decode(ListEntitiesLightResponse, data);
            return {
                id: response.objectId,
                component: new LightComponent(response,
                    transformStates<LightStateResponse>(stateEvents$, response),
                    connection,
                ),
            };
        }
        case MessageTypes.ListEntitiesSensorResponse: {
            const response: ListEntitiesSensorResponse = decode(ListEntitiesSensorResponse, data);
            return {
                id: response.objectId,
                component: new SensorComponent(response,
                    transformStates<SensorStateResponse>(stateEvents$, response),
                    emptyCommandInterface,
                ),
            };
        }
    }
    return {id: ''};
};

export const emptyCommandInterface: CommandInterface = {
    send: () => {
    },
};

export const transformStates = <T extends StateResponses>(stateEvents$: Observable<StateResponses>,
    listEntityResponse: ListEntityResponses): Observable<T> => {
    return stateEvents$.pipe(
        filter((stateEvent) => stateEvent.key === listEntityResponse.key),
    ) as Observable<T>;
};

export const isTrue = (val: unknown) => val === true;
export const isTruthy = (val: unknown) => !!val;

export const isFalse = (val: unknown) => val === false;
export const isFalsy = (val: unknown) => !val;
