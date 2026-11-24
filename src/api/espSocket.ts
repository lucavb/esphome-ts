import {
    BehaviorSubject,
    catchError,
    distinctUntilChanged,
    EMPTY,
    filter,
    finalize,
    from,
    merge,
    mergeMap,
    Observable,
    share,
    Subject,
    Subscription,
    switchMap,
    take,
    takeUntil,
    tap,
    timeout,
} from 'rxjs';
import { type CommandInterface } from '../components/commandInterface';
import { type Connection } from './connection';
import { TcpConnection } from './tcpConnection';
import { type ReadData } from './framer';
import { createPlaintextCodec, type WireCodec } from './frameCodec';
import { parseNoisePsk } from './noise/crypto';
import { EncryptionHandshakeError } from './noise/errors';
import { createNoiseCodec } from './noise/frameCodec';
import { MessageTypes } from './requestResponseMatching';
import { isTrue } from './booleans';

export type { ReadData } from './framer';

// A plaintext send only waits for the TCP connection. A Noise send also waits
// for the handshake, and ESPHome's own handshake timeout is 60 seconds: weak
// ESP8266 links have been measured at 28-30 seconds, so the plaintext budget
// would abandon the initial HelloRequest before the session is ready.
const PLAINTEXT_READY_TIMEOUT = 5000;
const NOISE_READY_TIMEOUT = 60 * 1000;

export interface EspSocketConfiguration {
    /** Ignored when `connection` is set: idle-timeout teardown is owned by the injected adapter. */
    timeout?: number;
    connection?: Connection;
    /** Base64-encoded 32-byte Noise PSK from ESPHome's `api: encryption: key:`. */
    encryptionKey?: string;
}

/**
 * Retryable transport-phase failure: the peer closed before sending any data.
 * This is usually a wrong host/port or a non-ESPHome service, not an encryption
 * problem, so it is deliberately distinct from EncryptionHandshakeError.
 */
export class ConnectionHandshakeError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConnectionHandshakeError';
    }
}

export class EspSocket implements CommandInterface {
    private readonly connection: Connection;
    private readonly psk?: Buffer;
    private readonly teardown = new Subject<void>();
    private readonly errors = new Subject<unknown>();
    // Emits true once the current connection generation can carry application
    // messages: immediately for plaintext, after the handshake for Noise.
    private readonly ready = new BehaviorSubject<boolean>(false);
    private readonly subscription = new Subscription();
    private activeCodec?: WireCodec;
    // terminate() is final for an EspSocket: it tears down the codec pipeline
    // and the connection watchers, so a later open() is a no-op.
    private disposed = false;

    public readonly connected$: Observable<boolean>;
    public readonly espData$: Observable<ReadData>;
    public readonly error$: Observable<unknown>;

    constructor(host: string, port: number, config?: EspSocketConfiguration) {
        this.connection = config?.connection ?? new TcpConnection(host, port, { timeout: config?.timeout });
        const encryptionKey = config?.encryptionKey?.trim();
        this.psk = encryptionKey === undefined || encryptionKey === '' ? undefined : parseNoisePsk(encryptionKey);
        this.connected$ = this.connection.connected$;
        // The merge subscribes to the connection's error$ lazily, per consumer:
        // a late error after terminate() still reaches any NEW error$ subscriber,
        // while a terminated EspSocket with no consumers no longer retains an
        // immortal observer on a shared Connection.
        this.error$ = merge(this.errors, this.connection.error$);

        // One codec per connection generation: switchMap drops the old codec
        // (and its partial frame, handshake, and nonce state) on every reconnect.
        // share() multicasts the same parsed frames to every subscriber.
        this.espData$ = this.connection.connected$.pipe(
            // The Connection contract does not promise de-duplicated state;
            // a repeated `true` must not restart a live codec and handshake.
            distinctUntilChanged(),
            filter(isTrue),
            switchMap(() => this.startCodec()),
            share(),
        );

        // A lost transport does not switch the codec out (filter(isTrue) above
        // only reacts to connects), so reset readiness here and report a drop
        // that happened mid-handshake.
        this.subscription.add(
            this.connection.connected$.pipe(distinctUntilChanged()).subscribe((connected: boolean) => {
                if (connected) {
                    return;
                }
                this.ready.next(false);
                const codec = this.activeCodec;
                if (!this.disposed && codec !== undefined) {
                    if (codec.receivedData && !codec.ready) {
                        this.errors.next(
                            new EncryptionHandshakeError(
                                'The connection ended before the Noise handshake completed; the device may not use API encryption',
                            ),
                        );
                    } else if (!codec.receivedData) {
                        this.errors.next(
                            new ConnectionHandshakeError(
                                this.psk === undefined
                                    ? 'The connection ended before the device sent any data; check the host/port and whether the device requires API encryption'
                                    : 'The connection ended before the device sent any data; check the host/port and whether the device uses API encryption',
                            ),
                        );
                    }
                }
            }),
        );

        // Keep the codec driven even when the caller only sends commands. A
        // Noise handshake must complete before the first send can be sealed, and
        // that handshake is advanced exclusively by incoming chunks.
        this.subscription.add(this.espData$.subscribe());
    }

    public open(): void {
        if (this.disposed) {
            return;
        }
        this.connection.open();
    }

    public isConnected(): boolean {
        return this.connection.isConnected();
    }

    /**
     * Tear down the current connection but keep this socket reusable. Unlike
     * terminate(), a later open() starts a fresh connection generation.
     */
    public disconnect(): void {
        this.teardown.next();
        this.connection.terminate();
    }

    public terminate(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.teardown.next();
        this.subscription.unsubscribe();
        this.connection.terminate();
    }

    public sendEspMessage(type: MessageTypes, payload: Uint8Array): void {
        if (this.disposed) {
            return;
        }
        this.ready
            .pipe(
                timeout(this.psk === undefined ? PLAINTEXT_READY_TIMEOUT : NOISE_READY_TIMEOUT),
                filter(isTrue),
                take(1),
                tap(() => {
                    const codec = this.activeCodec;
                    if (codec === undefined) {
                        return;
                    }
                    this.connection.write(codec.seal(type, payload));
                }),
                // terminate() kills a pending send, but open() deliberately does
                // NOT: a command issued during a blip rides the reconnect within
                // its readiness window (5s plaintext, 60s Noise) — the commands
                // are idempotent absolute-state writes, so a stale resend is safe.
                takeUntil(this.teardown),
            )
            // Fire-and-forget by design (CommandInterface): the command is
            // silently dropped when the connection is not established within
            // the timeout, and a payload over the wire limit is rejected while
            // sealing. Both surface on error$ instead of crashing the host.
            .subscribe({
                error: (error: unknown) => {
                    this.errors.next(error instanceof Error ? error : new Error(String(error)));
                },
            });
    }

    private startCodec(): Observable<ReadData> {
        if (this.disposed) {
            // A late espData$ subscriber after terminate() must not revive the
            // pipeline and write a fresh handshake onto a shared Connection.
            return EMPTY;
        }
        const codec = this.psk === undefined ? createPlaintextCodec() : createNoiseCodec(this.psk);
        this.activeCodec = codec;
        for (const chunk of codec.start()) {
            this.connection.write(chunk);
        }
        this.ready.next(codec.ready);

        return this.connection.chunks$.pipe(
            mergeMap((chunk: Buffer) => {
                const frames = codec.push(chunk);
                if (codec.ready && !this.ready.getValue()) {
                    this.ready.next(true);
                }
                return from(frames);
            }),
            // A framing/handshake failure ends this connection generation: the
            // error is reported, the transport is torn down, and reconnection
            // stays driven by EspDevice.
            catchError((error: unknown) => {
                this.ready.next(false);
                if (this.activeCodec === codec) {
                    this.activeCodec = undefined;
                }
                this.errors.next(error);
                this.connection.terminate();
                return EMPTY;
            }),
            finalize(() => {
                // Only the generation that still owns the slot may clear
                // readiness: an old inner must not race a new generation's
                // ready(true) on reconnect.
                if (this.activeCodec === codec) {
                    this.activeCodec = undefined;
                    this.ready.next(false);
                }
            }),
        );
    }
}
