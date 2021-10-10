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
import { Observable, of, Subscription } from 'rxjs';
import { MessageTypes } from './requestResponseMatching';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { Reader } from 'protobufjs/minimal';
import { EspSocket, ReadData } from './espSocket';
import { voidMessage } from './protobuf/api_options';

export interface Decoder<T> {
    decode: (reader: Reader, length?: number) => T;
}

export const decode = <T>(decoder: Decoder<T>, data: ReadData): T => {
    return decoder.decode(new Reader(data.payload));
};

export class Client {
    private readonly subscription: Subscription;

    constructor(private readonly socket: EspSocket) {
        this.subscription = new Subscription();
        this.subscription.add(
            this.socket.espData$
                .pipe(
                    tap((data) => {
                        if (data.type === MessageTypes.PingRequest) {
                            this.socket.sendEspMessage(MessageTypes.PingResponse, PingResponse.encode({}).finish());
                        }
                    }),
                )
                .subscribe(),
        );
    }

    public terminate(): void {
        this.subscription.unsubscribe();
    }

    hello(request: HelloRequest): Observable<HelloResponse> {
        const data = HelloRequest.encode(request).finish();
        this.socket.sendEspMessage(MessageTypes.HelloRequest, data);
        return this.socket.espData$.pipe(
            filter((value: ReadData) => value.type === MessageTypes.HelloResponse),
            take(1),
            switchMap((data: ReadData) => of(HelloResponse.decode(new Reader(data.payload)))),
        );
    }

    connect(request: ConnectRequest): Observable<ConnectResponse> {
        const data = ConnectRequest.encode(request).finish();
        this.socket.sendEspMessage(MessageTypes.ConnectRequest, data);
        return this.socket.espData$.pipe(
            filter((value: ReadData) => value.type === MessageTypes.ConnectResponse),
            take(1),
            switchMap((data: ReadData) => of(ConnectResponse.decode(new Reader(data.payload)))),
        );
    }

    ping(): Observable<PingResponse> {
        const data = PingRequest.encode({}).finish();
        this.socket.sendEspMessage(MessageTypes.ConnectRequest, data);
        return this.socket.espData$.pipe(
            filter((value: ReadData) => value.type === MessageTypes.PingResponse),
            take(1),
            switchMap((data: ReadData) => of(PingResponse.decode(new Reader(data.payload)))),
        );
    }

    deviceInfo(): Observable<DeviceInfoResponse> {
        const data = DeviceInfoRequest.encode({}).finish();
        this.socket.sendEspMessage(MessageTypes.DeviceInfoRequest, data);
        return this.socket.espData$.pipe(
            filter(({ type }: ReadData) => type === MessageTypes.DeviceInfoResponse),
            take(1),
            switchMap(({ payload }: ReadData) => of(DeviceInfoResponse.decode(new Reader(payload)))),
        );
    }

    listEntities(): Observable<voidMessage> {
        const data = ListEntitiesRequest.encode({}).finish();
        this.socket.sendEspMessage(MessageTypes.ListEntitiesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }

    subscribeStateChange(): Observable<voidMessage> {
        const data = SubscribeStatesRequest.encode({}).finish();
        this.socket.sendEspMessage(MessageTypes.SubscribeStatesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }
}
