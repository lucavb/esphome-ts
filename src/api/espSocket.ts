import { EMPTY, from, Observable, Subject } from 'rxjs';
import { filter, mergeMap, switchMap, take, takeUntil, timeout } from 'rxjs/operators';
import { type CommandInterface } from '../components/commandInterface';
import { type Connection } from './connection';
import { TcpConnection } from './tcpConnection';
import { createFrameParser, encodeFrame, type ReadData } from './framer';
import { MessageTypes } from './requestResponseMatching';
import { isTrue } from './booleans';

export type { ReadData } from './framer';

export interface EspSocketConfiguration {
    timeout?: number;
    connection?: Connection;
}

export class EspSocket implements CommandInterface {
    private readonly connection: Connection;
    private readonly terminate$ = new Subject<void>();
    private readonly errors = new Subject<unknown>();

    public readonly connected$: Observable<boolean>;
    public readonly espData$: Observable<ReadData>;
    public readonly error$: Observable<unknown>;

    constructor(host: string, port: number, config?: EspSocketConfiguration) {
        this.connection = config?.connection ?? new TcpConnection(host, port, { timeout: config?.timeout });
        this.connected$ = this.connection.connected$;
        this.error$ = this.errors.asObservable();

        // Connection errors surface on error$ exactly as they did through the
        // framed socket's own error stream, so EspDevice's error-driven retry
        // keeps working for a failing connection attempt.
        this.connection.error$.subscribe({
            next: (error: unknown) => {
                this.errors.next(error);
            },
        });

        // Each subscription owns its parser, and each connection owns its
        // carry-over buffer: a frame is pushed into a parser exactly once per
        // subscriber, and a parser that still holds a partial frame is dropped
        // when the connection drops. Scoping the parser inside the switchMap is
        // what guarantees both — a shared parser field would be fed once per
        // subscriber and would survive reconnects.
        this.espData$ = this.connection.connected$.pipe(
            filter(isTrue),
            switchMap(() => {
                const frameParser = createFrameParser();
                return this.connection.chunks$.pipe(mergeMap((chunk: Buffer) => from(frameParser.push(chunk))));
            }),
        );
    }

    open(): void {
        this.connection.open();
    }

    isConnected(): boolean {
        return this.connection.isConnected();
    }

    terminate(): void {
        this.terminate$.next();
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
                takeUntil(this.terminate$),
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
