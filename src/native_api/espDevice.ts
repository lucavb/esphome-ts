import {NativeApiConnection, ReadData} from './connection';
import {filter, flatMap, map, skip, take, tap} from 'rxjs/operators';
import {decode, NativeApiClient} from './client';
import {
    BinarySensorStateResponse,
    DeviceInfoRequest,
    DeviceInfoResponse,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from '../api/protobuf/api';
import {MessageTypes} from './requestResponseMatching';
import {BaseComponent} from '../components/base';
import {BinarySensorComponent} from '../components/binarySensor';
import {BehaviorSubject, Observable} from 'rxjs';
import {emptyCommandInterface, stateParser, transformStates} from './helpers';
import {StateResponses} from './interfaces';
import {SwitchComponent} from '../components/switch';
import {LightComponent} from '../components/light';
import {SensorComponent} from '../components/sensor';

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

export class NativeApiEspDevice {

    private readonly connection: NativeApiConnection;
    private readonly client: NativeApiClient;

    private readonly stateEvents$: Observable<StateResponses>;

    public deviceInfo?: DeviceInfoRequest;

    public readonly components: {[key: string]: BaseComponent} = {};

    private readonly discovery: BehaviorSubject<boolean>;
    public readonly discovery$: Observable<boolean>;

    constructor(private readonly host: string,
                private readonly password: string = '',
                private readonly port: number = 6053) {

        this.discovery = new BehaviorSubject<boolean>(false);
        this.discovery$ = this.discovery.asObservable();
        this.connection = new NativeApiConnection(host, port);
        this.client = new NativeApiClient(this.connection);
        this.connection.open().pipe(
            skip(1), // behaviour subject, very first call
            take(1),
            filter((connected: boolean) => connected),
            flatMap(() => this.client.hello({clientInfo: 'esphome-ts'})),
            flatMap(() => this.client.connect({password})),
            flatMap(() => this.client.deviceInfo()),
            flatMap(() => this.client.listEntities()),
            flatMap(() => this.client.subscribeStateChange()),
        ).subscribe();
        this.stateEvents$ = this.connection.data$.pipe(
            filter((data: ReadData) => stateResponses.has(data.type)),
            map((data: ReadData) => stateParser(data)),
        );
        this.connection.data$.pipe(
            tap((data: ReadData) => {
                if (listResponses.has(data.type)) {
                    this.parseListResponse(data);
                } else if (stateResponses.has(data.type)) {
                    stateParser(data);
                } else if (data.type === MessageTypes.DeviceInfoResponse) {
                    this.deviceInfo = decode(DeviceInfoResponse, data);
                }
            }),
        ).subscribe();
    }

    private parseListResponse = (data: ReadData) => {
        switch (data.type) {
            case MessageTypes.ListEntitiesBinarySensorResponse: {
                const response: ListEntitiesBinarySensorResponse = decode(ListEntitiesBinarySensorResponse, data);
                this.components[response.objectId] = new BinarySensorComponent(response,
                    transformStates<BinarySensorStateResponse>(this.stateEvents$, response),
                    emptyCommandInterface,
                );
                break;
            }
            case MessageTypes.ListEntitiesSwitchResponse: {
                const response: ListEntitiesSwitchResponse = decode(ListEntitiesSwitchResponse, data);
                this.components[response.objectId] = new SwitchComponent(response,
                    transformStates<SwitchStateResponse>(this.stateEvents$, response),
                    this.connection,
                );
                break;
            }
            case MessageTypes.ListEntitiesLightResponse: {
                const response: ListEntitiesLightResponse = decode(ListEntitiesLightResponse, data);
                this.components[response.objectId] = new LightComponent(response,
                    transformStates<LightStateResponse>(this.stateEvents$, response),
                    this.connection,
                );
                break;
            }
            case MessageTypes.ListEntitiesSensorResponse: {
                const response: ListEntitiesSensorResponse = decode(ListEntitiesSensorResponse, data);
                this.components[response.objectId] = new SensorComponent(response,
                    transformStates<SensorStateResponse>(this.stateEvents$, response),
                    this.connection,
                );
                break;
            }
            case MessageTypes.ListEntitiesDoneResponse: {
                this.discovery.next(true);
                break;
            }
        }
    };

}
