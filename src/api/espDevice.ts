import {Connection, ReadData} from './connection';
import {
    catchError,
    delay,
    distinctUntilChanged,
    filter,
    map,
    mapTo,
    shareReplay,
    switchMap,
    take,
    tap,
    timeout,
} from 'rxjs/operators';
import {Client, decode} from './client';
import {DeviceInfoRequest, DeviceInfoResponse} from './protobuf/api';
import {MessageTypes} from './requestResponseMatching';
import {BaseComponent} from '../components/base';
import {BehaviorSubject, concat, merge, Observable, of, Subscription} from 'rxjs';
import {createComponents, isFalse, isTrue, stateParser} from './helpers';
import {StateResponses} from './interfaces';

const PING_TIMEOUT = 90 * 1000;

const listResponses: Set<MessageTypes> = new Set([
    MessageTypes.ListEntitiesBinarySensorResponse,
    MessageTypes.ListEntitiesCoverResponse,
    MessageTypes.ListEntitiesFanResponse,
    MessageTypes.ListEntitiesLightResponse,
    MessageTypes.ListEntitiesSensorResponse,
    MessageTypes.ListEntitiesSwitchResponse,
    MessageTypes.ListEntitiesTextSensorResponse,
    MessageTypes.ListEntitiesDoneResponse,
]);

const stateResponses: Set<MessageTypes> = new Set([
    MessageTypes.BinarySensorStateResponse,
    MessageTypes.CoverStateResponse,
    MessageTypes.FanStateResponse,
    MessageTypes.LightStateResponse,
    MessageTypes.SensorStateResponse,
    MessageTypes.SwitchStateResponse,
    MessageTypes.TextSensorStateResponse,
]);

export class EspDevice {

    private readonly connection: Connection;
    private readonly client: Client;

    private readonly stateEvents$: Observable<StateResponses>;

    public deviceInfo?: DeviceInfoRequest;

    public readonly components: { [key: string]: BaseComponent } = {};

    private readonly discovery: BehaviorSubject<boolean>;
    public readonly discovery$: Observable<boolean>;

    private readonly subscription: Subscription;

    public readonly alive$: Observable<boolean>;

    constructor(private readonly host: string,
                private readonly password: string = '',
                private readonly port: number = 6053) {
        this.subscription = new Subscription();
        this.discovery = new BehaviorSubject<boolean>(false);
        this.discovery$ = this.discovery.asObservable();
        this.connection = new Connection(host, port);
        this.client = new Client(this.connection);
        this.stateEvents$ = this.connection.data$.pipe(
            filter((data: ReadData) => stateResponses.has(data.type)),
            map((data: ReadData) => stateParser(data)),
        );
        this.subscription.add(this.connection.data$.pipe(
            tap((data: ReadData) => {
                if (listResponses.has(data.type)) {
                    this.parseListResponse(data);
                } else if (data.type === MessageTypes.DeviceInfoResponse) {
                    this.deviceInfo = decode(DeviceInfoResponse, data);
                }
            }),
        ).subscribe());

        this.subscription.add(this.connection.connected$.pipe(
            distinctUntilChanged(),
            filter(isFalse),
            delay(2 * 1000),
            switchMap(() => this.connection.open()),
            filter(isTrue),
            switchMap(() => this.client.hello({clientInfo: 'esphome-ts'})),
            switchMap(() => this.client.connect({password})),
            switchMap(() => this.client.deviceInfo()),
            switchMap(() => this.client.listEntities()),
            switchMap(() => this.client.subscribeStateChange()),
        ).subscribe());

        this.alive$ = merge(this.connection.connected$, this.connection.data$.pipe(
            switchMap(() => {
                return concat(of(true), this.connection.data$.pipe(
                    mapTo(true),
                    timeout(PING_TIMEOUT),
                    catchError(() => of(false)),
                    take(1),
                ));
            }),
        )).pipe(
            distinctUntilChanged(),
            shareReplay(1),
        );
    }

    public terminate(): void {
        Object.values(this.components).forEach((component) => {
            component.terminate();
        });
        this.client.terminate();
        this.connection.close();
        this.subscription.unsubscribe();
    }

    private parseListResponse = (data: ReadData) => {
        if (data.type === MessageTypes.ListEntitiesDoneResponse) {
            this.discovery.next(true);
        } else {
            const {id, component} = createComponents(data, this.stateEvents$, this.connection);
            if (component) {
                this.components[id] = this.components[id] ?? component;
            }
        }
    };

}
