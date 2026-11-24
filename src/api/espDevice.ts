import { EspSocket, type ReadData, ConnectionHandshakeError } from './espSocket';
import { Client } from './client';
import { type Connection } from './connection';
import { createComponents, stateParser } from './helpers';
import { isFalse, isTrue } from './booleans';
import { listResponses, stateResponses } from './responses';
import { MessageTypes } from './requestResponseMatching';
import { type StateResponses } from './interfaces';
import { BaseComponent } from '../components/base';
import {
    BehaviorSubject,
    concat,
    defer,
    distinctUntilChanged,
    EMPTY,
    filter,
    map,
    merge,
    Observable,
    of,
    retry,
    share,
    shareReplay,
    Subject,
    Subscription,
    switchMap,
    takeUntil,
    tap,
    timer,
} from 'rxjs';
import { ConnectResponse, DeviceInfoResponse } from './protobuf/api';
import {
    EncryptionHandshakeError,
    EncryptionPlaintextError,
    EncryptionRequiredError,
    InvalidEncryptionKeyError,
} from './noise/errors';

const PING_TIMEOUT = 90 * 1000;
const RETRY_DELAY = 1000;

export class InvalidPasswordError extends Error {
    constructor(host: string) {
        super(`The ESPHome device at ${host} rejected the connection password`);
        this.name = 'InvalidPasswordError';
    }
}

export interface EspDeviceOptions {
    /**
     * An injected Connection owns its own liveness/idle teardown — the
     * socket-level `PING_TIMEOUT` does not apply to it.
     */
    connection?: Connection;
    /** Base64-encoded 32-byte Noise PSK from ESPHome's `api: encryption: key:`. */
    encryptionKey?: string;
}

export class EspDevice {
    private readonly socket: EspSocket;
    private readonly client: Client;

    private readonly stateEvents$: Observable<StateResponses>;

    public deviceInfo?: DeviceInfoResponse;

    // The HelloResponse selects the protocol version for each connection. Keep
    // one mutable per-device value so covers created on discovery and reused
    // after reconnects see the version negotiated on the latest handshake.
    private readonly apiVersion = { major: 0, minor: 0 };

    public readonly components: { [key: string]: BaseComponent } = {};

    private readonly discovery: BehaviorSubject<boolean>;
    public readonly discovery$: Observable<boolean>;

    private readonly errors = new Subject<unknown>();
    /**
     * Device level failures: undecodable frames, password/encryption handshake
     * problems such as InvalidPasswordError and InvalidEncryptionKeyError, and
     * retryable EncryptionHandshakeError/ConnectionHandshakeError. Plain socket
     * errors are available on the socket itself.
     */
    public readonly error$: Observable<unknown>;

    private readonly subscription: Subscription;
    private retrySubscription?: Subscription;
    // Latched when the device reports a terminal connection failure (rejected
    // password or encryption key, missing key, plaintext/encrypted mismatch):
    // auto-reconnect stays off until provideRetryObservable() explicitly re-arms it.
    private terminalFailure = false;
    // A retryable handshake/transport failure must not turn the immediate
    // reconnect path into a hot loop; the one-second retry cadence handles it.
    private handshakeRetryPending = false;

    public readonly alive$: Observable<boolean>;

    constructor(
        private readonly host: string,
        private readonly password: string = '',
        private readonly port: number = 6053,
        options?: EspDeviceOptions,
    ) {
        this.subscription = new Subscription();
        this.discovery = new BehaviorSubject<boolean>(false);
        this.discovery$ = this.discovery.asObservable();
        this.error$ = this.errors.asObservable();
        this.socket = new EspSocket(host, port, {
            timeout: PING_TIMEOUT,
            connection: options?.connection,
            encryptionKey: options?.encryptionKey,
        });
        this.client = new Client(this.socket);
        this.stateEvents$ = this.socket.espData$.pipe(
            filter((data: ReadData) => stateResponses.has(data.type)),
            map((data: ReadData) => stateParser(data)),
            filter((parsed): parsed is StateResponses => !!parsed),
            // One decode shared by all components: without this, every discovered
            // component re-runs the filter+decode chain for the same state frame.
            share(),
        );
        // Subscribe in this order: terminal failures first, then frame handling
        // (which must be ready before opening the connection), then the
        // connection and its retries.
        this.watchHandshakeErrors();
        this.watchDeviceMessages();
        this.watchConnection();
        this.retryFailedConnections();
        this.alive$ = this.createLivenessObservable();
    }

    private watchHandshakeErrors(): void {
        this.subscription.add(
            this.socket.error$.subscribe((error: unknown) => {
                if (error instanceof EncryptionHandshakeError || error instanceof ConnectionHandshakeError) {
                    // Retryable: surface it on the device stream, but let the
                    // one-second retry cadence try again instead of reopening
                    // immediately and hot-looping on a persistently broken device.
                    this.handshakeRetryPending = true;
                    this.errors.next(error);
                    return;
                }
                if (
                    error instanceof InvalidEncryptionKeyError ||
                    error instanceof EncryptionRequiredError ||
                    error instanceof EncryptionPlaintextError
                ) {
                    this.failTerminally(error);
                }
            }),
        );
    }

    private failTerminally(error: Error): void {
        if (this.terminalFailure) {
            return;
        }
        this.terminalFailure = true;
        this.errors.next(error);
        // Drop the current connection but keep the socket reusable: a later
        // provideRetryObservable() re-arm can open a fresh generation.
        this.socket.disconnect();
    }

    private watchDeviceMessages(): void {
        this.subscription.add(this.socket.espData$.subscribe((data) => this.handleDeviceMessage(data)));
    }

    private handleDeviceMessage(data: ReadData): void {
        try {
            if (listResponses.has(data.type)) {
                this.parseListResponse(data);
            } else if (data.type === MessageTypes.DeviceInfoResponse) {
                this.deviceInfo = DeviceInfoResponse.decode(data.payload);
            } else if (data.type === MessageTypes.ConnectResponse) {
                if (ConnectResponse.decode(data.payload).invalidPassword) {
                    this.failTerminally(new InvalidPasswordError(this.host));
                }
            }
        } catch (error: unknown) {
            // A malformed frame must not tear down discovery for good.
            this.errors.next(error);
        }
    }

    private watchConnection(): void {
        this.subscription.add(
            this.socket.connected$
                .pipe(
                    distinctUntilChanged(),
                    tap((connected: boolean) => {
                        if (connected) {
                            this.handshakeRetryPending = false;
                            return;
                        }
                        if (!this.terminalFailure && !this.handshakeRetryPending) {
                            this.socket.open();
                        }
                    }),
                    filter((connected: boolean) => connected && !this.terminalFailure),
                    // A new connection cancels the previous handshake and its retry timer.
                    switchMap(() => this.handshake()),
                )
                .subscribe(),
        );
    }

    private handshake(): Observable<void> {
        // Client requests send eagerly. defer sends a fresh HelloRequest on every retry.
        return defer(() => this.client.hello({ clientInfo: 'esphome-ts' })).pipe(
            tap((helloResponse) => {
                this.apiVersion.major = helloResponse.apiVersionMajor;
                this.apiVersion.minor = helloResponse.apiVersionMinor;
            }),
            switchMap(() => {
                // Newer devices ignore authentication; send it without waiting for
                // a response. A rejection is handled by watchDeviceMessages().
                this.client.connect({ password: this.password });
                return this.terminalFailure ? EMPTY : this.client.deviceInfo();
            }),
            switchMap(() => this.client.listEntities()),
            switchMap(() => this.client.subscribeStateChange()),
            retry({
                delay: (error: unknown) => {
                    this.errors.next(error);
                    return timer(RETRY_DELAY);
                },
            }),
        );
    }

    private retryFailedConnections(): void {
        // watchConnection() only reacts to connected$ transitions, and a
        // connection attempt that fails never leaves `false`. Retry those (and
        // sends that timed out while disconnected) here, but never tear down a
        // healthy connection because of an unrelated send error.
        this.subscription.add(
            this.socket.error$
                .pipe(
                    switchMap(() => timer(RETRY_DELAY)),
                    filter(() => !this.terminalFailure && !this.socket.isConnected()),
                )
                .subscribe(() => this.socket.open()),
        );
    }

    private createLivenessObservable(): Observable<boolean> {
        // Liveness: connected$ reports transport state; the watchdog reports a
        // silently silent peer. Every frame re-arms the PING_TIMEOUT timer via
        // switchMap teardown — a frame arriving first cancels the pending timer.
        const trafficLiveness$ = this.socket.espData$.pipe(
            switchMap(() => concat(of(true), timer(PING_TIMEOUT).pipe(map(() => false)))),
        );
        return merge(this.socket.connected$, trafficLiveness$).pipe(
            distinctUntilChanged(),
            // refCount releases the watchdog source and its pending timer when
            // the last subscriber leaves, e.g. after terminate().
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    /**
     * Provides the reconnect cadence used while the device is unreachable.
     * Calling this again replaces the previously provided retry signal, so
     * repeated calls cannot stack parallel reconnect loops. Providing a cadence
     * is also the explicit opt-in re-arm after a terminal connection failure.
     */
    public provideRetryObservable(retryWhen$: Observable<unknown>): void {
        // Explicit opt-in re-arm: re-providing a retry cadence re-enables
        // auto-reconnect after a rejected password or encryption key.
        this.terminalFailure = false;
        this.handshakeRetryPending = false;
        this.retrySubscription?.unsubscribe();
        this.retrySubscription = this.alive$
            .pipe(
                filter(isFalse),
                switchMap(() =>
                    retryWhen$.pipe(
                        tap(() => this.socket.open()),
                        takeUntil(this.alive$.pipe(filter(isTrue))),
                    ),
                ),
            )
            .subscribe();
        this.subscription.add(this.retrySubscription);
    }

    public terminate(): void {
        Object.values(this.components).forEach((component: BaseComponent) => {
            component.terminate();
        });
        this.client.terminate();
        this.subscription.unsubscribe();
        this.errors.complete();
        this.socket.terminate();
    }

    private parseListResponse(data: ReadData) {
        if (data.type === MessageTypes.ListEntitiesDoneResponse) {
            this.discovery.next(true);
        } else {
            const knownComponents = new Map<string, number>(
                Object.entries(this.components).map(([id, component]) => [id, component.key]),
            );
            const { id, component, state$ } = createComponents(
                data,
                this.stateEvents$,
                this.socket,
                knownComponents,
                this.apiVersion,
            );
            if (component) {
                this.components[id] = this.components[id] ?? component;
            } else if (state$) {
                // createComponents resolves a known entity by its numeric key,
                // retaining the original public id when object_id changes.
                this.components[id]?.provideStateObservable(state$);
            }
        }
    }
}
