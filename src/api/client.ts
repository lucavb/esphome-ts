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
} from './protobuf/api';
import {Connection, ReadData} from './connection';
import {Observable, of} from 'rxjs';
import {MessageTypes} from './requestResponseMatching';
import {filter, switchMap, take, tap} from 'rxjs/operators';
import {Reader} from 'protobufjs/minimal';
import {voidMessage} from './protobuf/api_options';

export interface Decoder<T> {
    decode: (reader: Reader, length?: number) => T;
}

export const decode = <T>(decoder: Decoder<T>, data: ReadData): T => {
    return decoder.decode(new Reader(data.payload));
};

export class Client {

    constructor(private readonly connection: Connection) {
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

    deviceInfo(): Observable<DeviceInfoResponse> {
        const data = DeviceInfoRequest.encode({}).finish();
        this.connection.send(MessageTypes.DeviceInfoRequest, data);
        return this.connection.data$.pipe(
            filter((value) => value.type === MessageTypes.DeviceInfoResponse),
            take(1),
            switchMap((data) => of(DeviceInfoResponse.decode(new Reader(data.payload)))),
        );
    }

    listEntities(): Observable<voidMessage> {
        const data = ListEntitiesRequest.encode({}).finish();
        this.connection.send(MessageTypes.ListEntitiesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }

    subscribeStateChange(): Observable<voidMessage> {
        const data = SubscribeStatesRequest.encode({}).finish();
        this.connection.send(MessageTypes.SubscribeStatesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }


}
