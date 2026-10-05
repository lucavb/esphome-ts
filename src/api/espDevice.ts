import { EspSocket, type ReadData } from './espSocket';
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
import { type ConnectResponse, DeviceInfoResponse } from './protobuf/api';

const PING_TIMEOUT = 90 * 1000;
const RETRY_DELAY = 1000;

export class InvalidPasswordError extends Error {
    constructor(host: string) {
        super(`The ESPHome device at ${host} rejected the connection password`);
        this.name = 'InvalidPasswordError';
    }
}

export class EspDevice {
    private readonly socket: EspSocket;
    private readonly client: Client;

    private readonly stateEvents$: Observable<StateResponses>;

    public deviceInfo?: DeviceInfoResponse;

    public readonly components: { [key: string]: BaseComponent } = {};

    private readonly discovery: BehaviorSubject<boolean>;
    public readonly discovery$: Observable<boolean>;

    private readonly errors = new Subject<unknown>();
    /**
     * Device level failures: frames that could not be decoded and handshake
     * problems such as an `InvalidPasswordError`. Socket level errors are
     * available on the socket itself.
     */
    public readonly error$: Observable<unknown>;

    private readonly subscription: Subscription;
    private retrySubscription?: Subscription;
    // Latched when the device rejects the constructed password: terminal for
    // auto-reconnect until provideRetryObservable() explicitly re-arms it.
    private passwordRejected = false;

    public readonly alive$: Observable<boolean>;

    constructor(
        private readonly host: string,
        private readonly password: string = '',
        private readonly port: number = 6053,
        /**
         * An injected Connection owns its own liveness/idle teardown — the
         * socket-level `PING_TIMEOUT` does not apply to it.
         */
        options?: { connection?: Connection },
    ) {
        this.subscription = new Subscription();
        this.discovery = new BehaviorSubject<boolean>(false);
        this.discovery$ = this.discovery.asObservable();
        this.error$ = this.errors.asObservable();
        this.socket = new EspSocket(host, port, {
            timeout: PING_TIMEOUT,
            connection: options?.connection,
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
        this.subscription.add(
            this.socket.espData$
                .pipe(
                    tap((data: ReadData) => {
                        try {
                            if (listResponses.has(data.type)) {
                                this.parseListResponse(data);
                            } else if (data.type === MessageTypes.DeviceInfoResponse) {
                                this.deviceInfo = DeviceInfoResponse.decode(data.payload);
                            }
                        } catch (error: unknown) {
                            // A malformed frame must not tear down discovery for good.
                            this.errors.next(error);
                        }
                    }),
                )
                .subscribe(),
        );

        this.subscription.add(
            this.socket.connected$
                .pipe(
                    distinctUntilChanged(),
                    tap((connected: boolean) => {
                        if (!connected && !this.passwordRejected) {
                            this.socket.open();
                        }
                    }),
                    filter((connected: boolean) => connected && !this.passwordRejected),
                    switchMap(() =>
                        // defer() re-runs this factory on every retry:
                        // Client.request() sends eagerly when called (not on
                        // subscription), so without it a retried handshake
                        // would never put a fresh HelloRequest on the wire —
                        // and a real device only answers HelloRequest, never
                        // speaks first.
                        defer(() => this.client.hello({ clientInfo: 'esphome-ts' })).pipe(
                            switchMap(() => this.client.connect({ password })),
                            map((response: ConnectResponse) => {
                                if (response.invalidPassword) {
                                    throw new InvalidPasswordError(this.host);
                                }
                                return response;
                            }),
                            switchMap(() => this.client.deviceInfo()),
                            switchMap(() => this.client.listEntities()),
                            switchMap(() => this.client.subscribeStateChange()),
                            retry({
                                delay: (error: unknown) => {
                                    this.errors.next(error);
                                    if (error instanceof InvalidPasswordError) {
                                        // The password is fixed at construction, so a rejection cannot
                                        // fix itself: it is terminal for auto-reconnect. Drop the
                                        // half-authenticated session so we stop auto-answering the
                                        // device's keepalive pings; provideRetryObservable() is the
                                        // explicit opt-in re-arm.
                                        this.passwordRejected = true;
                                        this.socket.terminate();
                                        return EMPTY;
                                    }
                                    // Anything else (e.g. an undecodable
                                    // response): redo the whole handshake after a
                                    // pause; the connection logic above stays
                                    // armed for a future reconnect either way.
                                    return timer(RETRY_DELAY);
                                },
                            }),
                        ),
                    ),
                )
                .subscribe(),
        );

        // The reconnect logic above only reacts to connected$ transitions, and a
        // connection attempt that fails never leaves `false`. Retry those (and
        // sends that timed out while disconnected) here, but never tear down a
        // healthy connection because of an unrelated send error.
        this.subscription.add(
            this.socket.error$
                .pipe(
                    switchMap(() => timer(RETRY_DELAY)),
                    filter(() => !this.passwordRejected && !this.socket.isConnected()),
                )
                .subscribe(() => this.socket.open()),
        );

        // Liveness: connected$ reports transport state; the watchdog reports a
        // silently silent peer. Every frame re-arms the PING_TIMEOUT timer via
        // switchMap teardown — a frame arriving first cancels the pending timer.
        this.alive$ = merge(
            this.socket.connected$,
            this.socket.espData$.pipe(switchMap(() => concat(of(true), timer(PING_TIMEOUT).pipe(map(() => false))))),
        ).pipe(
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
     * is also the explicit opt-in re-arm after a password rejection.
     */
    public provideRetryObservable(retryWhen$: Observable<unknown>): void {
        // Explicit opt-in re-arm: re-providing a retry cadence re-enables
        // auto-reconnect after a password rejection.
        this.passwordRejected = false;
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
            const knownComponents = new Set<string>(Object.keys(this.components));
            const { id, component, state$ } = createComponents(data, this.stateEvents$, this.socket, knownComponents);
            if (component) {
                this.components[id] = this.components[id] ?? component;
            } else if (state$) {
                this.components[id].provideStateObservable(state$);
            }
        }
    }
}
