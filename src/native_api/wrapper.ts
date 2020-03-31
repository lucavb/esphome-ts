import {
    ConnectRequest,
    ConnectResponse,
    DeviceInfoRequest,
    DeviceInfoResponse,
    HelloRequest,
    HelloResponse,
    ListEntitiesRequest,
    PingRequest,
    PingResponse,
    SubscribeStatesRequest,
} from '../api/protobuf/api';
import {NativeApiConnection} from './connection';
import {Observable, of} from 'rxjs';
import {MessageTypes} from './requestResponseMatching';
import {filter, switchMap, take, tap} from 'rxjs/operators';
import {Reader} from 'protobufjs/minimal';
import {voidMessage} from '../api/protobuf/api_options';

export class NativeApiWrapper {

    constructor(private readonly connection: NativeApiConnection) {
        this.connection.data$.pipe(
            tap((data) => {
                if (data.type === MessageTypes.PingRequest) {
                    connection.send(MessageTypes.PingResponse, PingResponse.encode({}).finish());
                }
            }),
        ).subscribe();
    }

    hello(request: HelloRequest): Observable<HelloResponse> {
        const data = HelloRequest.encode(request).finish();
        this.connection.send(MessageTypes.HelloRequest, data);
        return this.connection.data$.pipe(
            filter((value) => value.type === MessageTypes.HelloResponse),
            take(1),
            switchMap((data) => of(HelloResponse.decode(new Reader(data.payload)))),
        );
    }

    connect(request: ConnectRequest): Observable<ConnectResponse> {
        const data = ConnectRequest.encode(request).finish();
        this.connection.send(MessageTypes.ConnectRequest, data);
        return this.connection.data$.pipe(
            filter((value) => value.type === MessageTypes.ConnectResponse),
            take(1),
            switchMap((data) => of(ConnectResponse.decode(new Reader(data.payload)))),
        );
    }

    ping(): Observable<PingResponse> {
        const data = PingRequest.encode({}).finish();
        this.connection.send(MessageTypes.ConnectRequest, data);
        return this.connection.data$.pipe(
            filter((value) => value.type === MessageTypes.PingResponse),
            take(1),
            switchMap((data) => of(PingResponse.decode(new Reader(data.payload)))),
        );
    }

    deviceInfo(request: DeviceInfoRequest): Observable<DeviceInfoResponse> {
        const data = DeviceInfoRequest.encode(request).finish();
        this.connection.send(MessageTypes.DeviceInfoRequest, data);
        return this.connection.data$.pipe(
            filter((value) => value.type === MessageTypes.DeviceInfoResponse),
            take(1),
            switchMap((data) => of(DeviceInfoResponse.decode(new Reader(data.payload)))),
        );
    }

    listEntities(request: ListEntitiesRequest): Observable<voidMessage> {
        const data = ListEntitiesRequest.encode(request).finish();
        this.connection.send(MessageTypes.ListEntitiesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }

    subscribeStateChange(request: SubscribeStatesRequest): Observable<voidMessage> {
        const data = SubscribeStatesRequest.encode(request).finish();
        this.connection.send(MessageTypes.SubscribeStatesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }


}
