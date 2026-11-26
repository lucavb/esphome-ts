# Discovery reconciliation: a Component table owns identity and retention

List frames arrive one at a time, and a reconnect re-sends every one of them.
Before this decision, `componentKinds.discover()` decoded a frame and returned a
`DiscoveredEntity` union carrying the decoded entity, a key-filtered `state$`,
and a `create` thunk. `EspDevice.parseListResponse` then decided whether to
rebind or replace, mutated the retained Component through two public methods
(`provideStateObservable`, `provideListEntity`), and rebuilt an
`{ id → key }` map on every list frame. The registry's `CONTEXT.md` definition
(kinds → decoders and factory) did not describe the identity rules it actually
owned, and `EspDevice`'s component dictionary was both the store and the place
where retention policy lived.

## Decision

`src/components/componentTable.ts` owns the Components one Device currently
exposes.

- The table holds the record `EspDevice.components` returns, plus a
  `key → id` index and an `id → key` index.
- `applyListFrame(data)` is the whole Discovery transition for one list frame:
  decode through the Component-kind registry, resolve the public id, then
  create, rebind, or replace. It returns
  `{ status: 'created' | 'rebound' | 'replaced', id }`.
- Identity is the numeric entity key. An existing key keeps its public id even
  when `object_id` changes; an empty `object_id` falls back to a namespaced
  key-based id; a duplicate non-empty `object_id` never overwrites an existing
  entity. The key index makes this O(1) instead of a per-frame scan.
- `BaseComponent` exposes one `rebind({ state$, entity })`, marked
  `@internal`. It keeps the instance, the command pipeline, and the current
  state value, and adopts the refreshed list entity and state stream.
  `provideStateObservable` remains as a deprecated delegate because it shipped
  in v5.3.0; this change is not a major release. It is no longer called
  internally, so a subclass override compiled against v5.3.0 is not invoked.
  `provideListEntity` was added in the unreleased climate commit, so removing
  it breaks nothing.
- The protocol version stays one shared value that `EspDevice` updates in place
  through `ProtocolVersion.updateFrom` (`src/api/protocolVersion.ts`), so a
  handshake refresh needs no rebind.

## Considered options

- **A `discover(data, { components })` function that mutates an injected map** —
  rejected: the map stays on `EspDevice`, so the store and the policy still live
  in two modules.
- **Growing `componentKinds` to own retention** — rejected: it widens the
  registry past the job `CONTEXT.md` names for it, and puts "what kinds exist"
  and "which instance is retained" behind one interface.
- **Keying state routing by kind as well as key** — rejected: firmware entity
  keys are kind-independent, and the table's replace branch already compares the
  new kind against the retained Component's `type`.
- **Splitting `BaseComponent` into a public read interface and an internal
  `RebindableComponent`** — deferred: `rebind` stays public with `@internal`
  until the lifecycle change (`terminate()` currently leaves `state` and
  `state$` open) lands in the same class.

## Consequences

- `EspDevice.components` is `Readonly<Record<string, BaseComponent>>`: an own
  field holding the live table record, with the table as the only writer.
- Components are installed as own properties, so an `object_id` such as
  `__proto__` is an ordinary key instead of a prototype assignment that would
  hide the Component from `byId` and `terminate()`. The record keeps its normal
  prototype, so the published dictionary shape is unchanged.
- Discovery rules are testable without wire frames. `componentTable.spec.ts`
  owns creation wiring, identity, retention, kind changes, and termination;
  `componentKinds.spec.ts` keeps decoding and the wire-type claims;
  `socketLifecycle.spec.ts` keeps the reconnect and version-refresh paths.
- Adding a Component kind is still one registry entry. Adding a retention rule
  is one change in the table.
- Sub-device `device_id` routing is still unmodelled. When it lands, it belongs
  in the table's identity step, not in `EspDevice`.
- No behaviour change: same public ids, same retained instances, same key-only
  state routing, and the same dictionary shape for `EspDevice.components`. The
  one fix is an `object_id` of `__proto__`, which previously escaped the record.
