import { type ReadData } from './espSocket';
import {
    catchError,
    distinctUntilChanged,
    filter,
    map,
    mapTo,
    shareReplay,
    switchMap,
    take,
    takeUntil,
    tap,
    timeout,
} from 'rxjs/operators';
import { Client } from './client';
import { createComponents, stateParser } from './helpers';
import { isFalse, isTrue } from './booleans';
import { listResponses, stateResponses } from './responses';
import { MessageTypes } from './requestResponseMatching';
import { type StateResponses } from './interfaces';
import { BaseComponent } from '../components/base';
import { BehaviorSubject, concat, EMPTY, merge, Observable, of, Subject, Subscription, timer } from 'rxjs';
import { EspSocket } from './espSocket';
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

    public readonly alive$: Observable<boolean>;

    constructor(
        private readonly host: string,
        private readonly password: string = '',
        private readonly port: number = 6053,
    ) {
        this.subscription = new Subscription();
        this.discovery = new BehaviorSubject<boolean>(false);
        this.discovery$ = this.discovery.asObservable();
        this.error$ = this.errors.asObservable();
        this.socket = new EspSocket(host, port, {
            timeout: PING_TIMEOUT,
        });
        this.client = new Client(this.socket);
        this.stateEvents$ = this.socket.espData$.pipe(
            filter((data: ReadData) => stateResponses.has(data.type)),
            map((data: ReadData) => stateParser(data)),
            filter((parsed): parsed is StateResponses => !!parsed),
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
                        if (!connected) {
                            this.socket.open();
                        }
                    }),
                    filter(isTrue),
                    switchMap(() => this.client.hello({ clientInfo: 'esphome-ts' })),
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
                    catchError((error: unknown, caught: Observable<void>) => {
                        this.errors.next(error);
                        if (error instanceof InvalidPasswordError) {
                            // A rejected password will not fix itself; retrying would only hammer the device.
                            return EMPTY;
                        }
                        // Anything else (e.g. an undecodable response): keep the
                        // reconnect logic alive and redo the handshake.
                        return timer(RETRY_DELAY).pipe(switchMap(() => caught));
                    }),
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
                    filter(() => !this.socket.isConnected()),
                )
                .subscribe(() => this.socket.open()),
        );

        this.alive$ = merge(
            this.socket.connected$,
            this.socket.espData$.pipe(
                switchMap(() => {
                    return concat(
                        of(true),
                        this.socket.espData$.pipe(
                            mapTo(true),
                            timeout(PING_TIMEOUT),
                            catchError(() => of(false)),
                            take(1),
                        ),
                    );
                }),
            ),
        ).pipe(distinctUntilChanged(), shareReplay(1));
    }

    public provideRetryObservable(retryWhen$: Observable<unknown>): void {
        this.subscription.add(
            this.alive$
                .pipe(
                    filter(isFalse),
                    switchMap(() =>
                        retryWhen$.pipe(
                            tap(() => this.socket.open()),
                            takeUntil(this.alive$.pipe(filter(isTrue))),
                        ),
                    ),
                )
                .subscribe(),
        );
    }

    public terminate(): void {
        Object.values(this.components).forEach((component: BaseComponent) => {
            component.terminate();
        });
        this.client.terminate();
        this.subscription.unsubscribe();
        this.errors.complete();
        this.socket.close(true);
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
