import { type ReadData } from './espSocket';
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
import { MessageTypes } from './requestResponseMatching';
import { type ListEntityResponses, type StateResponses } from './interfaces';
import { type CommandInterface } from '../components/commandInterface';
import { filter, Observable } from 'rxjs';
import { BaseComponent } from '../components/base';
import { BinarySensorComponent } from '../components/binarySensor';
import { CoverComponent, type ApiVersion } from '../components/cover';
import { FanComponent } from '../components/fan';
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
            case MessageTypes.FanStateResponse: {
                return FanStateResponse.decode(data.payload);
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
    knownComponents: Set<string> | ReadonlyMap<string, number>,
    apiVersion: ApiVersion = { major: 1, minor: 8 },
): { id: string; key?: number; fallback?: boolean; component?: BaseComponent; state$?: Observable<StateResponses> } => {
    const identity = (objectId: string, key: number): { id: string; fallback: boolean; known: boolean } => {
        const knownById = knownComponents instanceof Set ? undefined : knownComponents;
        const knownIds = knownComponents instanceof Set ? knownComponents : undefined;
        // The numeric entity key is the protocol identity. Prefer its existing
        // public dictionary id before considering object_id, which may be
        // absent or may change on a later discovery.
        if (knownById) {
            for (const [knownId, knownKey] of knownById) {
                if (knownKey === key) {
                    return {
                        id: knownId,
                        fallback: objectId.length === 0,
                        known: true,
                    };
                }
            }
        }
        let fallback = objectId.length === 0;
        let id = fallback ? fallbackEntityId(key) : objectId;
        const knownKey = (candidate: string): number | undefined => knownById?.get(candidate);
        const isKnown = (candidate: string): boolean =>
            knownById ? knownKey(candidate) === key : (knownIds?.has(candidate) ?? false);

        if (knownById && knownById.has(id) && !isKnown(id)) {
            // Never let a fallback alias overwrite an existing object_id. If
            // two entities illegally reuse the same nonempty object_id, keep
            // the first public id and give the later entity a key-based id.
            fallback = true;
            id = fallbackEntityId(key);
            let suffix = 1;
            const baseId = id;
            while (knownById.has(id)) id = `${baseId}_${suffix++}`;
        }
        return { id, fallback, known: isKnown(id) };
    };
    switch (data.type) {
        case MessageTypes.ListEntitiesBinarySensorResponse: {
            const response: ListEntitiesBinarySensorResponse = ListEntitiesBinarySensorResponse.decode(data.payload);
            const state$ = transformStates<BinarySensorStateResponse>(stateEvents$, response);
            const entity = identity(response.objectId, response.key);
            return entity.known
                ? {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      state$,
                  }
                : {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      component: new BinarySensorComponent(response, state$, emptyCommandInterface),
                  };
        }
        case MessageTypes.ListEntitiesCoverResponse: {
            const response: ListEntitiesCoverResponse = ListEntitiesCoverResponse.decode(data.payload);
            const state$ = transformStates<CoverStateResponse>(stateEvents$, response);
            const entity = identity(response.objectId, response.key);
            return entity.known
                ? {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      state$,
                  }
                : {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      component: new CoverComponent(response, state$, connection, apiVersion),
                  };
        }
        case MessageTypes.ListEntitiesFanResponse: {
            const response: ListEntitiesFanResponse = ListEntitiesFanResponse.decode(data.payload);
            const state$ = transformStates<FanStateResponse>(stateEvents$, response);
            const entity = identity(response.objectId, response.key);
            return entity.known
                ? {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      state$,
                  }
                : {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      component: new FanComponent(response, state$, connection, apiVersion),
                  };
        }
        case MessageTypes.ListEntitiesSwitchResponse: {
            const response: ListEntitiesSwitchResponse = ListEntitiesSwitchResponse.decode(data.payload);
            const state$ = transformStates<SwitchStateResponse>(stateEvents$, response);
            const entity = identity(response.objectId, response.key);
            return entity.known
                ? {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      state$,
                  }
                : {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      component: new SwitchComponent(response, state$, connection),
                  };
        }
        case MessageTypes.ListEntitiesLightResponse: {
            const response: ListEntitiesLightResponse = ListEntitiesLightResponse.decode(data.payload);
            const state$ = transformStates<LightStateResponse>(stateEvents$, response);
            const entity = identity(response.objectId, response.key);
            return entity.known
                ? {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      state$,
                  }
                : {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      component: new LightComponent(response, state$, connection),
                  };
        }
        case MessageTypes.ListEntitiesSensorResponse: {
            const response: ListEntitiesSensorResponse = ListEntitiesSensorResponse.decode(data.payload);
            const state$ = transformStates<SensorStateResponse>(stateEvents$, response);
            const entity = identity(response.objectId, response.key);
            return entity.known
                ? {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      state$,
                  }
                : {
                      id: entity.id,
                      key: response.key,
                      fallback: entity.fallback,
                      component: new SensorComponent(response, state$, emptyCommandInterface),
                  };
        }
    }
    return { id: '' };
};

/** A stable, namespaced dictionary key for entities without an object_id. */
export const fallbackEntityId = (key: number): string => `__esphome_entity_key_${key}`;

export const emptyCommandInterface: CommandInterface = {
    sendEspMessage: () => undefined,
};

export const transformStates = <T extends StateResponses>(
    stateEvents$: Observable<StateResponses>,
    listEntityResponse: ListEntityResponses,
): Observable<T> => {
    return stateEvents$.pipe(filter((stateEvent) => stateEvent.key === listEntityResponse.key)) as Observable<T>;
};
