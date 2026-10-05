# The Connection seam: EspSocket is the deep transport module

`EspSocket` inherited from the publicly exported `RxjsSocket` class, so raw chunk (`data$`) and unframed send (`send()`) surfaces leaked across the ESPHome seam and specs had to enter through a process-global `vi.mock('net')` back-door. We replaced the inheritance with composition over a `Connection` interface — the transport seam — satisfied by two adapters: a TCP connection in production and an in-memory connection in specs. Wire framing, teardown policy, and Command sending now live inside `EspSocket` behind seven members; unframed bytes are no longer reachable from outside. Idle-timeout teardown (the keepalive-buster that turns a silently silent peer into a disconnected one) is TCP-adapter behaviour; reconnection stays driven by `EspDevice`, as it already was in production.

## Considered options

- **Keep inheritance + `vi.mock('net')` specs** — rejected: the mock enters past the module's own interface, and framing could be bypassed via the inherited raw surfaces.
- **Seam at `EspSocket` level** (fake the whole EspSocket in specs) — rejected: leaves the transport seam hypothetical; framing × connection-lifecycle behaviour would still need net mocks or real sockets.
- **A "Transport" interface** — rejected as vocabulary: `CONTEXT.md` already defines Connection, and the adapters are literally connections. "Transport" is recorded as avoided vocabulary there.
- **Auto-reconnect inside the socket** — rejected: production reconnection was already driven by `EspDevice` (`connected$` → false, `provideRetryObservable`); the `reconnectOnTimeout` knob was dead in production and was deleted with it.

## Consequences

Breaking, bundled into one semver-major: `RxjsSocket` is no longer exported (it became the internal TCP adapter); `EspSocket` loses `data$`, `send()`, `timeout$`, and `close(force?)`; the `reconnectOnTimeout`/`disconnectOnTimeout` knobs are gone (idle timeout now always tears the connection down). `EspDevice` gains an additive options constructor parameter for injecting a `Connection`. Real sockets now appear only in the TCP adapter's own spec and the end-to-end `espDeviceMock` suite.
