import { ReadData } from './connection';
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
import {
    Client,
    createComponents,
    decode,
    isFalse,
    isTrue,
    listResponses,
    MessageTypes,
    stateParser,
    stateResponses,
    StateResponses,
} from './';
import { BaseComponent } from '../components/base';
import { BehaviorSubject, concat, merge, Observable, of, Subscription } from 'rxjs';
import { EspSocket } from './espSocket';
import { DeviceInfoRequest, DeviceInfoResponse } from './protobuf';

const PING_TIMEOUT = 90 * 1000;

export class EspDevice {
    private readonly socket: EspSocket;
    private readonly client: Client;

    private readonly stateEvents$: Observable<StateResponses>;

    public deviceInfo?: DeviceInfoRequest;

    public readonly components: { [key: string]: BaseComponent } = {};

    private readonly discovery: BehaviorSubject<boolean>;
    public readonly discovery$: Observable<boolean>;

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
        this.socket = new EspSocket(host, port, {
            timeout: 20 * 1000,
        });
        this.client = new Client(this.socket);
        this.stateEvents$ = this.socket.espData$.pipe(
            filter((data: ReadData) => stateResponses.has(data.type)),
            map((data: ReadData) => stateParser(data)),
        );
        this.subscription.add(
            this.socket.espData$
                .pipe(
                    tap((data: ReadData) => {
                        if (listResponses.has(data.type)) {
                            this.parseListResponse(data);
                        } else if (data.type === MessageTypes.DeviceInfoResponse) {
                            this.deviceInfo = decode(DeviceInfoResponse, data);
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
                    switchMap(() => this.client.deviceInfo()),
                    switchMap(() => this.client.listEntities()),
                    switchMap(() => this.client.subscribeStateChange()),
                )
                .subscribe(),
        );

        this.socket.timeout$.pipe(tap(() => console.log('timeout'))).subscribe();

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
        this.socket.close(true);
        this.subscription.unsubscribe();
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
