import {Socket} from 'net';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {BytePositions} from './bytePositions';
import {MessageTypes} from './requestResponseMatching';
import {filter, take, tap, timeout} from 'rxjs/operators';
import {isTrue} from './helpers';

const TIMEOUT: number = 120 * 1000;
const DEFAULT_API_PORT_NUMBER: number = 6053;
const FIRST_BYTE: number = 0x00;

export interface ReadData {
    type: number;
    payload: Uint8Array;
}

export class Connection {

    private readonly connected: BehaviorSubject<boolean>;
    private connectTimeout?: NodeJS.Timeout;
    public readonly connected$: Observable<boolean>;

    private readonly data: Subject<ReadData>;
    public readonly data$: Observable<ReadData>;

    private readonly socket: Socket;

    constructor(private readonly host: string,
                private readonly port: number = DEFAULT_API_PORT_NUMBER,
                private readonly connectOnSend: boolean = true) {
        this.data = new Subject<ReadData>();
        this.data$ = this.data.asObservable();
        this.socket = new Socket();
        this.socket.on('close', this.onClose);
        this.socket.on('data', this.onData);
        this.socket.setTimeout(TIMEOUT);
        this.connected = new BehaviorSubject<boolean>(false);
        this.connected$ = this.connected.asObservable();
    }

    open(): Observable<boolean> {
        if (this.connectTimeout) {
            clearTimeout(this.connectTimeout);
        }
        this.socket.connect(this.port, this.host, () => {
            this.connected.next(true);
            if (this.connectTimeout) {
                clearTimeout(this.connectTimeout);
            }
        });
        this.connectTimeout = setTimeout(() => {
            this.connected.next(false);
        }, TIMEOUT);
        return this.connected$;
    }

    close(): Observable<boolean> {
        if (this.connected.getValue()) {
            this.socket.end();
        }
        return this.connected$;
    }

    send(type: MessageTypes, payload: Uint8Array): void {
        if (this.connected.getValue()) {
            const final = new Uint8Array([FIRST_BYTE, payload.length, type, ...payload]);
            this.socket.write(final);
        } else if (this.connectOnSend) {
            this.open().pipe(
                timeout(5000),
                filter(isTrue),
                take(1),
                tap(() => {
                    const final = new Uint8Array([FIRST_BYTE, payload.length, type, ...payload]);
                    this.socket.write(final);
                }),
            ).subscribe();
        }
    }

    private onClose = (hadError: boolean) => {
        this.connected.next(false);
    };

    private onData = (buffer: Buffer): void => {
        // this assumes that every time there is only one message
        // we might want to fix this some day
        if (buffer.length < 3) {
            return;
        }
        const zero = buffer.readUInt8(BytePositions.ZERO);
        if (zero !== 0) {
            return;
        }
        const length: number = buffer.readUInt8(BytePositions.LENGTH);
        const type = buffer.readUInt8(BytePositions.TYPE);
        this.data.next({
            type,
            payload: buffer.slice(BytePositions.PAYLOAD, BytePositions.PAYLOAD + length),
        });
    };

}
