import {Socket} from 'net';
import {fromEvent, merge, noop, Observable, of, Subscription} from 'rxjs';
import {BytePositions} from './bytePositions';
import {MessageTypes} from './requestResponseMatching';
import {distinctUntilChanged, filter, map, mapTo, shareReplay, take, tap, timeout} from 'rxjs/operators';
import {isTrue} from './helpers';

const DEFAULT_API_PORT_NUMBER: number = 6053;
const FIRST_BYTE: number = 0x00;

export interface ReadData {
    type: number;
    payload: Uint8Array;
}

export class Connection {

    public readonly connected$: Observable<boolean>;
    public readonly data$: Observable<ReadData>;

    private readonly socket: Socket;
    private subscription: Subscription;

    constructor(private readonly host: string,
                private readonly port: number = DEFAULT_API_PORT_NUMBER) {
        this.subscription = new Subscription();
        this.socket = new Socket();
        this.connected$ = merge(of(false), fromEvent(this.socket, 'close').pipe(
            mapTo(false),
        ), fromEvent(this.socket, 'ready').pipe(
            mapTo(true),
        )).pipe(
            distinctUntilChanged(),
            tap((connected: boolean) => connected ? noop() : this.subscription.unsubscribe()),
            shareReplay(1),
        );
        fromEvent<Error>(this.socket, 'error').pipe(
            tap((error) => {
                console.log(error);
            }),
        ).subscribe();
        this.data$ = fromEvent<Buffer>(this.socket, 'data').pipe(
            filter((buffer: Buffer) => buffer.length >= 3),
            filter((buffer: Buffer) => buffer.readUInt8(BytePositions.ZERO) === FIRST_BYTE),
            map((buffer: Buffer) => ({
                type: buffer.readUInt8(BytePositions.TYPE),
                payload: buffer.slice(BytePositions.PAYLOAD, BytePositions.PAYLOAD + buffer.readUInt8(BytePositions.LENGTH)),
            })),
        );
    }

    open(): Observable<boolean> {
        this.subscription = new Subscription();
        this.socket.connect(this.port, this.host);
        return this.connected$;
    }

    close(): Observable<boolean> {
        this.subscription.unsubscribe();
        this.socket.end();
        return this.connected$;
    }

    send(type: MessageTypes, payload: Uint8Array): void {
        this.subscription.add(this.connected$.pipe(
            timeout(5000),
            filter(isTrue),
            take(1),
            tap(() => {
                const final = new Uint8Array([FIRST_BYTE, payload.length, type, ...payload]);
                this.socket.write(final);
            }),
        ).subscribe());
    }

}
