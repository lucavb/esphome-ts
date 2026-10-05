import { BehaviorSubject, Subject } from 'rxjs';
import { type Connection } from '../../src/api/connection';

export interface InMemoryServerDriver {
    /** Flip connected$ to true (the device accepted the connection). */
    connect(): void;
    /** Flip connected$ to false (graceful disconnect). */
    disconnect(): void;
    /** Device → library bytes (emitted on chunks$). */
    push(chunk: Buffer): void;
    /** Surface a connection error on error$. */
    emitError(err: Error): void;
    /** Library → device writes, in order. */
    written: Uint8Array[];
}

/**
 * Minimal in-memory Connection with a server-side driver: specs play the device.
 * No idle-timeout simulation, no evasion — disconnects are always driver-driven.
 */
export function createInMemoryConnection(): { connection: Connection; server: InMemoryServerDriver } {
    const connected = new BehaviorSubject<boolean>(false);
    const chunks = new Subject<Buffer>();
    const error = new Subject<Error>();
    const terminate$ = new Subject<void>();
    const written: Uint8Array[] = [];

    const connection: Connection = {
        open(): void {
            // Repeatable no-op: EspDevice and EspSocket may call open() on retry.
        },
        terminate(): void {
            connected.next(false);
            terminate$.next();
        },
        isConnected(): boolean {
            return connected.getValue();
        },
        connected$: connected.asObservable(),
        chunks$: chunks.asObservable(),
        error$: error.asObservable(),
        write(data: Uint8Array): void {
            // Mirrors the TCP adapter contract: silent drop when disconnected.
            if (!connected.getValue()) {
                return;
            }
            written.push(data);
        },
    };

    const server = {
        connect: (): void => {
            connected.next(true);
        },
        disconnect: (): void => {
            connected.next(false);
        },
        push: (chunk: Buffer): void => {
            chunks.next(chunk);
        },
        emitError: (err: Error): void => {
            error.next(err);
        },
        written,
    };

    return { connection, server };
}
