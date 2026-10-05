import { type Observable } from 'rxjs';

/**
 * Transport seam between the library and a device: the live path along which
 * frames travel as byte chunks. Satisfied by the TCP adapter in production and
 * by in-memory adapters in specs.
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
