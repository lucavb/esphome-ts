import { filter, type Observable } from 'rxjs';
import { type ReadData } from '../api/framer';
import { type ApiVersion } from '../api/protocolVersion';
import { type BaseComponent } from './base';
import {
    componentTypeForListType,
    kindForListType,
    type AnyComponentKind,
    type StateResponses,
} from './componentKinds';
import { type CommandInterface } from './commandInterface';
import { type ListEntity } from './entities';

export interface ComponentTableDeps {
    readonly stateEvents$: Observable<StateResponses>;
    readonly connection: CommandInterface;
    readonly apiVersion: ApiVersion;
}

export interface ListFrameOutcome {
    readonly status: 'created' | 'rebound' | 'replaced';
    readonly id: string;
}

/** A stable, namespaced dictionary key for entities without an object_id. */
export const fallbackEntityId = (key: number): string => `__esphome_entity_key_${key}`;

/**
 * The set of Components one Device currently exposes, and the reconciliation
 * Discovery runs against it: every list frame is decoded through the
 * Component-kind registry, resolved to a public id by numeric key first, and
 * either created, rebound onto the retained instance, or replaced when the
 * entity changed kind under the same key.
 *
 * The table is the only writer. Callers read through {@link byId}, which is
 * the record `EspDevice.components` exposes.
 */
export class ComponentTable {
    private readonly components: { [id: string]: BaseComponent } = {};
    private readonly keyById = new Map<string, number>();
    private readonly idByKey = new Map<number, string>();

    constructor(private readonly deps: ComponentTableDeps) {}

    public get byId(): Readonly<Record<string, BaseComponent>> {
        return this.components;
    }

    /**
     * Decode and reconcile one list frame. Returns `undefined` for list types
     * outside the registry. A malformed list frame throws: discovery is
     * critical, so the device reports it instead of dropping the frame.
     */
    public applyListFrame(data: ReadData): ListFrameOutcome | undefined {
        const kind = kindForListType(data.type);
        if (kind === undefined) {
            return undefined;
        }
        const entity = kind.decodeEntity(data.payload);
        const { id, known } = this.resolveEntityIdentity(entity.objectId, entity.key);
        const state$ = this.stateFor(entity.key);
        const componentType = componentTypeForListType(data.type);

        if (!known) {
            this.install(id, entity.key, kind, entity, state$);
            return { status: 'created', id };
        }
        const retained = this.components[id];
        if (retained === undefined) {
            this.install(id, entity.key, kind, entity, state$);
            return { status: 'created', id };
        }
        if (componentType !== undefined && retained.type !== componentType) {
            retained.terminate();
            this.install(id, entity.key, kind, entity, state$);
            return { status: 'replaced', id };
        }
        retained.rebind({ state$, entity });
        return { status: 'rebound', id };
    }

    /** Terminate every retained Component, leaving the table otherwise intact. */
    public terminate(): void {
        for (const component of Object.values(this.components)) {
            component.terminate();
        }
    }

    private install(
        id: string,
        key: number,
        kind: AnyComponentKind,
        entity: ListEntity,
        state$: Observable<StateResponses>,
    ): void {
        // Define an own property instead of assigning: an object_id such as
        // "__proto__" would otherwise invoke the prototype setter and hide the
        // Component from byId and terminate(). The record keeps its normal
        // prototype, so the published dictionary shape is unchanged.
        Object.defineProperty(this.components, id, {
            value: kind.create(entity, state$, {
                connection: this.deps.connection,
                apiVersion: this.deps.apiVersion,
            }),
            enumerable: true,
            writable: true,
            configurable: true,
        });
        this.keyById.set(id, key);
        this.idByKey.set(key, id);
    }

    /**
     * The numeric entity key is the protocol identity. Prefer its existing
     * public dictionary id before considering object_id, which may be absent
     * or may change on a later discovery.
     */
    private resolveEntityIdentity(objectId: string, key: number): { id: string; known: boolean } {
        const knownId = this.idByKey.get(key);
        if (knownId !== undefined) {
            return { id: knownId, known: true };
        }
        let id = objectId.length === 0 ? fallbackEntityId(key) : objectId;
        if (this.keyById.has(id) && this.keyById.get(id) !== key) {
            // Never let a fallback alias overwrite an existing object_id. If two
            // entities illegally reuse the same nonempty object_id, keep the first
            // public id and give the later entity a key-based id.
            id = fallbackEntityId(key);
            let suffix = 1;
            const baseId = id;
            while (this.keyById.has(id)) id = `${baseId}_${suffix++}`;
        }
        return { id, known: this.keyById.get(id) === key };
    }

    private stateFor(key: number): Observable<StateResponses> {
        return this.deps.stateEvents$.pipe(filter((state) => state.key === key));
    }
}
