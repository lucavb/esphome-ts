import {Socket} from 'net';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {BytePositions} from './bytePositions';
import {MessageTypes} from './requestResponseMatching';

const TIMEOUT = 120 * 1000;

export interface ReadData {
    type: number;
    payload: Uint8Array;
}

export class Connection {

    private dead: boolean = false;

    private readonly connected: BehaviorSubject<boolean>;
    private connectTimeout: NodeJS.Timeout | undefined;
    public readonly connected$: Observable<boolean>;

    private readonly data: Subject<ReadData>;
    public readonly data$: Observable<ReadData>;

    private readonly socket: Socket;

    constructor(private readonly host: string, private readonly port: number = 6053) {
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
        if (this.dead) {
            return this.connected$;
        }
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
        if (this.dead) {
            return this.connected$;
        }
        if (this.connected.getValue()) {
            this.socket.end();
        }
        return this.connected$;
    }

    send(type: MessageTypes, payload: Uint8Array): void {
        const final = new Uint8Array([0x00, payload.length, type, ...payload]);
        this.socket.write(final);
    }

    private onClose = (hadError: boolean) => {
        if (hadError) {
            this.dead = true;
        }
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
