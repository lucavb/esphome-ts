import { type Observable } from 'rxjs';
import { type ReadData } from '../api/framer';
import {
    BinarySensorStateResponse,
    ClimateStateResponse,
    CoverStateResponse,
    FanStateResponse,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesClimateResponse,
    ListEntitiesCoverResponse,
    ListEntitiesFanResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from '../api/protobuf/api';
import { MessageTypes } from '../api/requestResponseMatching';
import { type ApiVersion } from '../api/protocolVersion';
import { type BaseComponent } from './base';
import { BinarySensorComponent } from './binarySensor';
import { ClimateComponent } from './climate';
import { emptyCommandInterface, type CommandInterface } from './commandInterface';
import { CoverComponent } from './cover';
import {
    type BinarySensorEntity,
    type ClimateEntity,
    type ComponentType,
    type CoverEntity,
    type FanEntity,
    type LightEntity,
    type ListEntity,
    type SensorEntity,
} from './entities';
import { FanComponent } from './fan';
import { LightComponent } from './light';
import { SensorComponent } from './sensor';
import { SwitchComponent } from './switch';

export type StateResponses =
    | BinarySensorStateResponse
    | ClimateStateResponse
    | CoverStateResponse
    | FanStateResponse
    | LightStateResponse
    | SensorStateResponse
    | SwitchStateResponse;

interface CreateDeps {
    readonly connection: CommandInterface;
    readonly apiVersion: ApiVersion;
}

interface ComponentKind<E extends ListEntity, S extends StateResponses> {
    readonly listType: MessageTypes;
    readonly stateType: MessageTypes;
    readonly decodeEntity: (payload: Uint8Array) => E;
    readonly decodeState: (payload: Uint8Array) => S;
    readonly create: (entity: E, state$: Observable<S>, deps: CreateDeps) => BaseComponent;
}

/**
 * Erased view of a kind for the registry maps and for the Component table. The
 * concrete `create` function is contravariant in its entity type, which a
 * heterogeneous map cannot express; `defineKind` localizes the cast to the
 * point where each record is registered.
 */
export interface AnyComponentKind {
    readonly listType: MessageTypes;
    readonly stateType: MessageTypes;
    readonly decodeEntity: (payload: Uint8Array) => ListEntity;
    readonly decodeState: (payload: Uint8Array) => StateResponses;
    readonly create: (entity: ListEntity, state$: Observable<StateResponses>, deps: CreateDeps) => BaseComponent;
}

const defineKind = <E extends ListEntity, S extends StateResponses>(kind: ComponentKind<E, S>): AnyComponentKind =>
    kind as unknown as AnyComponentKind;

// Text sensor list and state frames arrive on the wire but have no component
// yet, so they are deliberately absent from this registry. Adding one is a
// follow-up, not an oversight.
//
// Keyed by ComponentType so the registry and the public kind union cannot
// drift: `satisfies Record<ComponentType, AnyComponentKind>` makes a missing or
// excess kind a compile error.
const kinds = {
    binarySensor: defineKind<BinarySensorEntity, BinarySensorStateResponse>({
        listType: MessageTypes.ListEntitiesBinarySensorResponse,
        stateType: MessageTypes.BinarySensorStateResponse,
        decodeEntity: (payload) => ListEntitiesBinarySensorResponse.decode(payload),
        decodeState: (payload) => BinarySensorStateResponse.decode(payload),
        create: (entity, state$) => new BinarySensorComponent(entity, state$, emptyCommandInterface),
    }),
    climate: defineKind<ClimateEntity, ClimateStateResponse>({
        listType: MessageTypes.ListEntitiesClimateResponse,
        stateType: MessageTypes.ClimateStateResponse,
        decodeEntity: (payload) => ListEntitiesClimateResponse.decode(payload),
        decodeState: (payload) => ClimateStateResponse.decode(payload),
        create: (entity, state$, deps) => new ClimateComponent(entity, state$, deps.connection, deps.apiVersion),
    }),
    cover: defineKind<CoverEntity, CoverStateResponse>({
        listType: MessageTypes.ListEntitiesCoverResponse,
        stateType: MessageTypes.CoverStateResponse,
        decodeEntity: (payload) => ListEntitiesCoverResponse.decode(payload),
        decodeState: (payload) => CoverStateResponse.decode(payload),
        create: (entity, state$, deps) => new CoverComponent(entity, state$, deps.connection, deps.apiVersion),
    }),
    fan: defineKind<FanEntity, FanStateResponse>({
        listType: MessageTypes.ListEntitiesFanResponse,
        stateType: MessageTypes.FanStateResponse,
        decodeEntity: (payload) => ListEntitiesFanResponse.decode(payload),
        decodeState: (payload) => FanStateResponse.decode(payload),
        create: (entity, state$, deps) => new FanComponent(entity, state$, deps.connection, deps.apiVersion),
    }),
    light: defineKind<LightEntity, LightStateResponse>({
        listType: MessageTypes.ListEntitiesLightResponse,
        stateType: MessageTypes.LightStateResponse,
        decodeEntity: (payload) => ListEntitiesLightResponse.decode(payload),
        decodeState: (payload) => LightStateResponse.decode(payload),
        create: (entity, state$, deps) => new LightComponent(entity, state$, deps.connection),
    }),
    sensor: defineKind<SensorEntity, SensorStateResponse>({
        listType: MessageTypes.ListEntitiesSensorResponse,
        stateType: MessageTypes.SensorStateResponse,
        decodeEntity: (payload) => ListEntitiesSensorResponse.decode(payload),
        decodeState: (payload) => SensorStateResponse.decode(payload),
        create: (entity, state$) => new SensorComponent(entity, state$, emptyCommandInterface),
    }),
    switch: defineKind<ListEntity, SwitchStateResponse>({
        listType: MessageTypes.ListEntitiesSwitchResponse,
        stateType: MessageTypes.SwitchStateResponse,
        decodeEntity: (payload) => ListEntitiesSwitchResponse.decode(payload),
        decodeState: (payload) => SwitchStateResponse.decode(payload),
        create: (entity, state$, deps) => new SwitchComponent(entity, state$, deps.connection),
    }),
} satisfies Record<ComponentType, AnyComponentKind>;

const kindEntries = Object.entries(kinds) as [ComponentType, AnyComponentKind][];
const kindList = kindEntries.map(([, kind]) => kind);
const componentTypeByListType = new Map<MessageTypes, ComponentType>(
    kindEntries.map(([componentType, kind]) => [kind.listType, componentType]),
);

// The Maps are keyed by wire type, not ComponentType. Reject a duplicate at
// load time: Map construction is otherwise last-wins and would silently drop a
// kind. The base switch caught exact duplicate case labels via eslint.
const indexKinds = (typeOf: (kind: AnyComponentKind) => MessageTypes): Map<MessageTypes, AnyComponentKind> => {
    const index = new Map<MessageTypes, AnyComponentKind>();
    for (const kind of kindList) {
        const type = typeOf(kind);
        if (index.has(type)) {
            throw new Error(`Duplicate component-kind message type: ${MessageTypes[type]}`);
        }
        index.set(type, kind);
    }
    return index;
};

const componentKinds = indexKinds((kind) => kind.listType);
const stateKinds = indexKinds((kind) => kind.stateType);

export const isStateResponse = (type: MessageTypes): boolean => stateKinds.has(type);

export const isComponentListResponse = (type: MessageTypes): boolean => componentKinds.has(type);

/** The component kind a list frame belongs to, for kind-aware re-discovery. */
export const componentTypeForListType = (type: MessageTypes): ComponentType | undefined =>
    componentTypeByListType.get(type);

/** The erased kind for a list frame, for the Component table to decode and create from. */
export const kindForListType = (type: MessageTypes): AnyComponentKind | undefined => componentKinds.get(type);

/**
 * Decode one state frame. A malformed state frame is dropped: state traffic is
 * high-volume and one lying length must not tear down every component's stream.
 * List frames surface their decode failure to the device instead.
 */
export const decodeState = (data: ReadData): StateResponses | undefined => {
    const kind = stateKinds.get(data.type);
    if (kind === undefined) {
        return undefined;
    }
    try {
        return kind.decodeState(data.payload);
    } catch {
        return undefined;
    }
};
