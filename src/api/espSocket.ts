import {
    EMPTY,
    filter,
    from,
    merge,
    mergeMap,
    Observable,
    share,
    Subject,
    switchMap,
    take,
    takeUntil,
    timeout,
} from 'rxjs';
import { type CommandInterface } from '../components/commandInterface';
import { type Connection } from './connection';
import { TcpConnection } from './tcpConnection';
import { createFrameParser, encodeFrame, type ReadData } from './framer';
import { MessageTypes } from './requestResponseMatching';
import { isTrue } from './booleans';

export type { ReadData } from './framer';

export interface EspSocketConfiguration {
    /** Ignored when `connection` is set: idle-timeout teardown is owned by the injected adapter. */
    timeout?: number;
    connection?: Connection;
}

export class EspSocket implements CommandInterface {
    private readonly connection: Connection;
    private readonly teardown = new Subject<void>();
    private readonly errors = new Subject<unknown>();

    public readonly connected$: Observable<boolean>;
    public readonly espData$: Observable<ReadData>;
    public readonly error$: Observable<unknown>;

    constructor(host: string, port: number, config?: EspSocketConfiguration) {
        this.connection = config?.connection ?? new TcpConnection(host, port, { timeout: config?.timeout });
        this.connected$ = this.connection.connected$;
        // The merge subscribes to the connection's error$ lazily, per consumer:
        // a late error after terminate() still reaches any NEW error$ subscriber,
        // while a terminated EspSocket with no consumers no longer retains an
        // immortal observer on a shared Connection.
        this.error$ = merge(this.errors, this.connection.error$);

        // One frame parser per connection generation: the parser is created inside
        // the switchMap, so a reconnect drops any partial frame together with the
        // parser that holds it. share() hands every subscriber the SAME parsed
        // frames instead of each subscriber running its own parser over the same
        // chunks; EspDevice's discovery tap keeps the shared pipeline warm for the
        // device's lifetime and a refcount-zero reset simply re-arms it.
        this.espData$ = this.connection.connected$.pipe(
            filter(isTrue),
            switchMap(() => {
                const frameParser = createFrameParser();
                return this.connection.chunks$.pipe(mergeMap((chunk: Buffer) => from(frameParser.push(chunk))));
            }),
            share(),
        );
    }

    open(): void {
        this.connection.open();
    }

    isConnected(): boolean {
        return this.connection.isConnected();
    }

    terminate(): void {
        this.teardown.next();
        this.connection.terminate();
    }

    sendEspMessage(type: MessageTypes, payload: Uint8Array): void {
        this.connection.connected$
            .pipe(
                timeout(5000),
                filter(isTrue),
                take(1),
                switchMap(() => {
                    const final = encodeFrame(type, payload);
                    this.connection.write(final);
                    return EMPTY;
                }),
                // terminate() kills a pending send, but open() deliberately does
                // NOT: a command issued during a blip rides the reconnect within
                // its 5-second window — the commands are idempotent absolute-state
                // writes, so a ≤5s-old resend is safe.
                takeUntil(this.teardown),
            )
            // Fire-and-forget by design (CommandInterface): the command is
            // silently dropped when the connection is not established within
            // the timeout, and a payload over the wire limit is rejected by
            // encodeFrame. Both surface on error$ instead of crashing the host.
            .subscribe({
                error: (error: unknown) => {
                    this.errors.next(error instanceof Error ? error : new Error(String(error)));
                },
            });
    }
}
