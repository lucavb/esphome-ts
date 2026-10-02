import { Server, Socket } from 'net';
import { from, fromEvent, Observable, Subject } from 'rxjs';
import { map, mergeMap, take, takeUntil, tap } from 'rxjs/operators';
import { MessageTypes } from '../../src';
import { createFrameParser, encodeFrame, type ReadData } from '../../src/api/framer';
import {
    ConnectResponse,
    DeviceInfoResponse,
    HelloResponse,
    ListEntitiesDoneResponse,
    PingRequest,
} from '../../src/api/protobuf/api';

const sendOverSocket = (socket: Socket, type: MessageTypes, payload: Uint8Array): void => {
    socket.write(encodeFrame(type, payload));
};

export class EspDeviceMock {
    receivedTypes: MessageTypes[] = [];
    server: Server;
    private readonly teardown = new Subject<void>();
    private isPasswordInvalid: boolean = false;
    latestSocket?: Socket;
    sockets: Socket[] = [];
    types$: Subject<MessageTypes>;
    connected$: Subject<boolean> = new Subject<boolean>();

    listEntities?: { data: Uint8Array; type: MessageTypes }[] = [];

    constructor(private readonly portNumber: number) {
        this.types$ = new Subject<MessageTypes>();
        this.server = new Server();
        this.server.listen(portNumber);
        fromEvent<Socket>(this.server, 'connection')
            .pipe(
                tap(() => this.connected$.next(true)),
                tap((socket: Socket) => {
                    this.latestSocket = socket;
                    this.sockets.push(socket);
                    const innerTeardown = new Subject<void>();

                    const frameParser = createFrameParser();

                    fromEvent<Buffer>(socket, 'data')
                        .pipe(
                            mergeMap((chunk: Buffer) => from(frameParser.push(chunk))),
                            map((frame: ReadData) => frame.type),
                            tap((type: MessageTypes) => this.receivedTypes.push(type)),
                            tap((type: MessageTypes) => this.types$.next(type)),
                            tap((type: MessageTypes) => {
                                switch (type) {
                                    case MessageTypes.HelloRequest: {
                                        sendOverSocket(
                                            socket,
                                            MessageTypes.HelloResponse,
                                            HelloResponse.encode({
                                                serverInfo: 'demo',
                                                apiVersionMajor: 1.0,
                                                apiVersionMinor: 1.0,
                                            }).finish(),
                                        );
                                        break;
                                    }
                                    case MessageTypes.ConnectRequest: {
                                        sendOverSocket(
                                            socket,
                                            MessageTypes.ConnectResponse,
                                            ConnectResponse.encode({
                                                invalidPassword: this.isPasswordInvalid,
                                            }).finish(),
                                        );
                                        break;
                                    }
                                    case MessageTypes.DeviceInfoRequest: {
                                        sendOverSocket(
                                            socket,
                                            MessageTypes.DeviceInfoResponse,
                                            DeviceInfoResponse.encode({
                                                compilationTime: new Date().toString(),
                                                esphomeVersion: '1.1',
                                                hasDeepSleep: false,
                                                macAddress: '00:00:00:33:33:33',
                                                model: 'nodemcuv2',
                                                name: 'my amazing esp',
                                                usesPassword: false,
                                            }).finish(),
                                        );
                                        break;
                                    }
                                    case MessageTypes.ListEntitiesRequest: {
                                        this.listEntities?.forEach((listEntity) => {
                                            sendOverSocket(socket, listEntity.type, listEntity.data);
                                        });
                                        sendOverSocket(
                                            socket,
                                            MessageTypes.ListEntitiesDoneResponse,
                                            ListEntitiesDoneResponse.encode({}).finish(),
                                        );
                                        break;
                                    }
                                    case MessageTypes.SubscribeStatesRequest: {
                                        break;
                                    }
                                }
                            }),
                            takeUntil(innerTeardown),
                            takeUntil(this.teardown),
                        )
                        .subscribe();

                    fromEvent<void>(socket, 'close')
                        .pipe(
                            take(1),
                            tap(() => {
                                this.sockets.splice(this.sockets.indexOf(socket), 1);
                                innerTeardown.next();
                                this.connected$.next(false);
                            }),
                            takeUntil(this.teardown),
                        )
                        .subscribe();
                }),
            )
            .subscribe();
    }

    set passwordInvalid(val: boolean) {
        this.isPasswordInvalid = val;
    }

    ping(): void {
        if (this.latestSocket) {
            sendOverSocket(this.latestSocket, MessageTypes.PingRequest, PingRequest.encode({}).finish());
        }
    }

    terminate(): Observable<void> {
        return new Observable<void>((subscriber) => {
            this.teardown.next();
            this.sockets.forEach((socket) => socket.destroy());
            const callback = (err?: Error) => {
                this.latestSocket = undefined;
                this.connected$.next(false);
                if (err) {
                    subscriber.error(err);
                } else {
                    subscriber.next();
                }
                subscriber.complete();
            };
            if (this.server.listening) {
                this.server.close(callback);
            } else {
                callback();
            }
        });
    }
}
