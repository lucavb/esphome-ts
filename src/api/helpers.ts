import {ReadData} from './connection';
import {
    BinarySensorStateResponse,
    CoverStateResponse,
    LightStateResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from './protobuf/api';
import {MessageTypes} from './requestResponseMatching';
import {decode} from './client';
import {ListEntityResponses, StateResponses} from './interfaces';
import {CommandInterface} from '../components/commandInterface';
import {Observable} from 'rxjs';
import {filter} from 'rxjs/operators';

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
