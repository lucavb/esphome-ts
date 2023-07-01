import {
    ConnectRequest,
    ConnectResponse,
    DeviceInfoResponse,
    HelloRequest,
    HelloResponse,
    PingResponse,
} from './protobuf/api';
import { ReadData } from './connection';
import { Observable, of, Subscription } from 'rxjs';
import { Reader } from 'protobufjs/minimal';
import { voidMessage } from './protobuf/api_options';

export interface Decoder<T> {
    decode: (reader: Reader, length?: number) => T;
}

export const decode = <T>(decoder: Decoder<T>, data: ReadData): T => {
    return decoder.decode(new Reader(data.payload));
};

export interface Client{
    terminate(): void;
    hello(request: HelloRequest): Observable<HelloResponse>;
    connect(request: ConnectRequest): Observable<ConnectResponse>;
    ping(): Observable<PingResponse>;
    deviceInfo(): Observable<DeviceInfoResponse>;
    subscribeStateChange(): Observable<voidMessage>;
    listEntities(): Observable<voidMessage>;
}