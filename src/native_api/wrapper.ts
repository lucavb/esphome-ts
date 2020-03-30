import {
    ConnectRequest,
    ConnectResponse,
    HelloRequest,
    HelloResponse,
    PingRequest,
    PingResponse
} from '../api/protobuf/api';
import {NativeApiConnection} from './connection';
import {Observable, of} from 'rxjs';
import {MessageTypes} from './requestResponseMatching';
import {filter, switchMap, take} from 'rxjs/operators';
import {Reader} from 'protobufjs/minimal';

export class NativeApiWrapper {

    constructor(private readonly connection: NativeApiConnection) {
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


}
