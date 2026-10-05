import { type Observable } from 'rxjs';

/**
 * Connection seam: the live path between the library and a device, along which
 * frames travel as byte chunks. The TCP path is the production Connection; any
 * implementation satisfying the same interface may substitute for it.
 *
 * Contract per member:
 * - `open()`: repeatable — a no-op while a connect attempt is already in flight;
 *   otherwise a call with a live path tears it down and opens a fresh one.
 * - `terminate()`: with a path or failed attempt open, tears it down and emits `false` on
 *   `connected$`; with nothing open it is a no-op — first or repeat call alike.
 * - `connected$`: hot state stream that MUST emit its current value synchronously to every new
 *   subscriber (e.g. a BehaviorSubject seeded false pre-connect) — `EspDevice` drives its initial
 *   `open()` from the synchronous seed; a plain hot Subject or cold observable silently never
 *   connects. Never completes.
 * - `chunks$`: hot, no emission while disconnected, never completes.
 * - `error$`: hot, never completes — late errors after `terminate()` keep arriving.
 */
export interface Connection {
    open(): void;
    terminate(): void;
    isConnected(): boolean;
    readonly connected$: Observable<boolean>;
    readonly chunks$: Observable<Buffer>;
    readonly error$: Observable<unknown>;
    /** Fire-and-forget. Silently drops when not connected. Write errors surface on error$. */
    write(data: Uint8Array): void;
}
