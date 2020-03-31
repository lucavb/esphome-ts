import {NativeApiConnection, ReadData} from './connection';
import {filter, flatMap, skip, take, tap} from 'rxjs/operators';
import {NativeApiWrapper} from './wrapper';
import {
    BinarySensorStateResponse,
    ConnectResponse,
    HelloResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesLightResponse,
} from '../api/protobuf/api';
import {MessageTypes} from './requestResponseMatching';
import {Reader} from 'protobufjs/minimal';

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
    private readonly client: NativeApiWrapper;

    constructor(private readonly host: string, private readonly password: string = '', private readonly port: number = 6053) {
        this.connection = new NativeApiConnection(host, port);
        this.client = new NativeApiWrapper(this.connection);
        this.connection.open().pipe(
            skip(1), // behaviour subject, very first call
            take(1),
            filter((connected: boolean) => connected),
            flatMap(() => this.client.hello({clientInfo: 'esphome-ts'})),
            flatMap((response: HelloResponse) => this.client.connect({password})),
            flatMap((response: ConnectResponse) => this.client.listEntities({})),
            flatMap(() => this.client.subscribeStateChange({})),
        ).subscribe();
        this.connection.data$.pipe(
            filter((data) => listResponses.has(data.type)),
            tap((data: ReadData) => {
                switch (data.type) {
                case MessageTypes.ListEntitiesBinarySensorResponse: {
                    console.log(ListEntitiesBinarySensorResponse.decode(new Reader(data.payload)));
                    break;
                }
                case MessageTypes.ListEntitiesLightResponse: {
                    console.log(ListEntitiesLightResponse.decode(new Reader(data.payload)));
                    break;
                }
                }
            }),
        ).subscribe();
        this.connection.data$.pipe(
            filter((data: ReadData) => stateResponses.has(data.type)),
            tap((data: ReadData) => {
                switch (data.type) {
                case MessageTypes.BinarySensorStateResponse: {
                    console.log('state binary', BinarySensorStateResponse.decode(new Reader(data.payload)));
                }
                }
            }),
        ).subscribe();
    }


}
