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
import { EspSocket, type ReadData } from './espSocket';
import { MessageTypes } from './requestResponseMatching';
import { filter, map, Observable, of, Subscription, take, tap } from 'rxjs';
import type { MessageFns } from './protobuf/api_options';

export class Client {
    private readonly subscription: Subscription;

    constructor(private readonly socket: EspSocket) {
        this.subscription = new Subscription();
        this.subscription.add(
            this.socket.espData$
                .pipe(
                    tap((data: ReadData) => {
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

    public hello(request: HelloRequest): Observable<HelloResponse> {
        return this.request(
            MessageTypes.HelloRequest,
            MessageTypes.HelloResponse,
            HelloRequest.encode(request).finish(),
            HelloResponse,
        );
    }

    public connect(request: ConnectRequest): Observable<ConnectResponse> {
        return this.request(
            MessageTypes.ConnectRequest,
            MessageTypes.ConnectResponse,
            ConnectRequest.encode(request).finish(),
            ConnectResponse,
        );
    }

    public ping(): Observable<PingResponse> {
        return this.request(
            MessageTypes.PingRequest,
            MessageTypes.PingResponse,
            PingRequest.encode({}).finish(),
            PingResponse,
        );
    }

    public deviceInfo(): Observable<DeviceInfoResponse> {
        return this.request(
            MessageTypes.DeviceInfoRequest,
            MessageTypes.DeviceInfoResponse,
            DeviceInfoRequest.encode({}).finish(),
            DeviceInfoResponse,
        );
    }

    // Fire-and-forget requests: the protocol answers ListEntitiesRequest with
    // an unbounded stream of list responses and SubscribeStatesRequest with
    // nothing at all, so there is no single response to await here. The
    // observables emit once the request is on the wire and complete — callers
    // that need the results watch EspDevice's discovery$ and component streams.
    public listEntities(): Observable<void> {
        this.socket.sendEspMessage(MessageTypes.ListEntitiesRequest, ListEntitiesRequest.encode({}).finish());
        return of(undefined);
    }

    public subscribeStateChange(): Observable<void> {
        this.socket.sendEspMessage(MessageTypes.SubscribeStatesRequest, SubscribeStatesRequest.encode({}).finish());
        return of(undefined);
    }

    private request<T>(
        type: MessageTypes,
        responseType: MessageTypes,
        payload: Uint8Array,
        response: MessageFns<T>,
    ): Observable<T> {
        this.socket.sendEspMessage(type, payload);
        return this.socket.espData$.pipe(
            filter((data: ReadData) => data.type === responseType),
            take(1),
            map((data: ReadData) => response.decode(data.payload)),
        );
    }
}
