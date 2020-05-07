import {Server, Socket} from 'net';
import {fromEvent, Subject, Subscription} from 'rxjs';
import {take, tap} from 'rxjs/operators';
import {MessageTypes} from '../../src/api/requestResponseMatching';
import {
    ConnectResponse,
    DeviceInfoResponse,
    HelloResponse,
    ListEntitiesDoneResponse,
    PingRequest,
} from '../../src/api/protobuf/api';

const sendOverSocket = (socket: Socket, type: MessageTypes, payload: Uint8Array): void => {
    const final = new Uint8Array([0x0, payload.length, type, ...payload]);
    socket.write(final);
};

export class EspDeviceMock {

    receivedTypes: MessageTypes[] = [];
    server: Server;
    subscription: Subscription;
    private isPasswordInvalid: boolean = false;
    currentSocket?: Socket;
    types$: Subject<MessageTypes>;
    connected$: Subject<boolean> = new Subject<boolean>();

    listEntities?: { data: Uint8Array, type: MessageTypes }[] = [];

    constructor(private readonly portNumber: number) {
        this.subscription = new Subscription();
        this.types$ = new Subject<MessageTypes>();
        this.server = new Server();
        this.server.listen(portNumber);
        this.subscription.add(fromEvent<Socket>(this.server, 'connection').pipe(
            tap(() => this.connected$.next(true)),
            tap((socket) => {
                const innerSubscription = new Subscription();
                this.subscription.add(innerSubscription);
                this.currentSocket = socket;
                innerSubscription.add(fromEvent<Uint8Array>(socket, 'data').pipe(
                    tap(([zero, length, type]) => this.receivedTypes.push(type)),
                    tap(([zero, length, type]) => this.types$.next(type)),
                    tap(([zero, length, type, ...payload]) => {
                        switch (type) {
                            case MessageTypes.HelloRequest: {
                                sendOverSocket(socket, MessageTypes.HelloResponse, HelloResponse.encode({
                                    serverInfo: 'demo',
                                    apiVersionMajor: 1.0,
                                    apiVersionMinor: 1.0,
                                }).finish());
                                break;
                            }
                            case MessageTypes.ConnectRequest: {
                                sendOverSocket(socket, MessageTypes.ConnectResponse, ConnectResponse.encode({
                                    invalidPassword: this.isPasswordInvalid,
                                }).finish());
                                break;
                            }
                            case MessageTypes.DeviceInfoRequest: {
                                sendOverSocket(socket, MessageTypes.DeviceInfoResponse, DeviceInfoResponse.encode({
                                    compilationTime: new Date().toString(),
                                    esphomeVersion: '1.1',
                                    hasDeepSleep: false,
                                    macAddress: '00:00:00:33:33:33',
                                    model: 'nodemcuv2',
                                    name: 'my amazing esp',
                                    usesPassword: false,
                                }).finish());
                                break;
                            }
                            case MessageTypes.ListEntitiesRequest: {
                                this.listEntities?.forEach((listEntity) => {
                                    sendOverSocket(socket, listEntity.type, listEntity.data);
                                });
                                sendOverSocket(socket, MessageTypes.ListEntitiesDoneResponse, ListEntitiesDoneResponse.encode({}).finish());
                                break;
                            }
                            case MessageTypes.SubscribeStatesRequest: {
                                break;
                            }
                        }
                    }),
                ).subscribe());

                fromEvent(socket, 'close').pipe(
                    take(1),
                    tap(() => this.connected$.next(false)),
                    tap(() => innerSubscription.unsubscribe()),
                ).subscribe();
            }),
        ).subscribe());
    }

    set passwordInvalid(val: boolean) {
        this.isPasswordInvalid = val;
    }

    ping(): void {
        if (this.currentSocket) {
            sendOverSocket(this.currentSocket, MessageTypes.PingRequest, PingRequest.encode({}).finish());
        }
    }

    terminate(): void {
        this.currentSocket?.end();
        this.currentSocket = undefined;
        this.connected$.next(false);
        this.server.close();
    }

}
