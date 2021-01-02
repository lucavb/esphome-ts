import { Socket } from 'net';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { take, takeUntil, tap } from 'rxjs/operators';

export interface RxjsSocketConfiguration {
    reconnectOnTimeout?: boolean;
    timeout?: number;
    disconnectOnTimeout?: boolean;
}

const defaultConfig: RxjsSocketConfiguration = {
    reconnectOnTimeout: false,
    disconnectOnTimeout: true,
};

export class RxjsSocket {
    private socket?: Socket;
    private readonly config: RxjsSocketConfiguration;

    // RxJS
    private readonly data = new Subject<Buffer>();
    public readonly data$: Observable<Buffer>;

    private readonly connected = new BehaviorSubject<boolean>(false);
    public readonly connected$: Observable<boolean>;

    private readonly timeout = new Subject<void>();
    public readonly timeout$: Observable<void>;

    private readonly error = new Subject<Error>();
    public readonly error$: Observable<Error>;

    protected readonly terminate = new Subject<void>();

    constructor(private readonly host: string, private readonly port: number, config?: RxjsSocketConfiguration) {
        this.config = { ...defaultConfig, ...config };
        this.data$ = this.data.asObservable();
        this.connected$ = this.connected.asObservable();
        this.timeout$ = this.timeout.asObservable();
        this.error$ = this.error.asObservable();
    }

    open(): void {
        if (this.socket?.connecting) {
            return;
        }

        this.close(true);
        this.socket = new Socket();
        if (this.config.timeout) {
            this.socket.setTimeout(this.config.timeout);
        }
        this.setupSocketEvents();
        this.socket.connect(this.port, this.host);
    }

    close(forceDestroy?: boolean): void {
        if (!this.socket) {
            return;
        }
        this.socket.end();
        if (forceDestroy) {
            this.destroySocket();
        }
    }

    send(data: string | Uint8Array, encoding?: BufferEncoding): Observable<void> {
        return new Observable<void>((subscriber) => {
            if (this.connected.getValue() && this.socket) {
                this.socket.write(data, encoding, (err?: Error) => {
                    if (err) {
                        throw err;
                    }
                    subscriber.next();
                    subscriber.complete();
                });
                return;
            }
            subscriber.next();
            subscriber.complete();
        });
    }

    private setupSocketEvents(): void {
        if (!this.socket) {
            return;
        }

        fromEvent<Error>(this.socket, 'error')
            .pipe(
                tap((err: Error) => this.error.next(err)),
                takeUntil(this.terminate),
            )
            .subscribe();
        fromEvent<Buffer>(this.socket, 'data')
            .pipe(
                tap((buffer: Buffer) => this.data.next(buffer)),
                takeUntil(this.terminate),
            )
            .subscribe();
        fromEvent<void>(this.socket, 'connect')
            .pipe(
                take(1),
                tap(() => this.connected.next(true)),
                takeUntil(this.terminate),
            )
            .subscribe();
        fromEvent<void>(this.socket, 'close')
            .pipe(
                take(1),
                tap(() => this.connected.next(false)),
                takeUntil(this.terminate),
            )
            .subscribe();
        fromEvent<void>(this.socket, 'end')
            .pipe(
                take(1),
                tap(() => this.socket?.end()),
                tap(() => this.connected.next(false)),
                takeUntil(this.terminate),
            )
            .subscribe();

        if (this.config.timeout && this.config.timeout > 0) {
            fromEvent<void>(this.socket, 'timeout')
                .pipe(
                    tap(() => this.timeout.next()),
                    tap(() => {
                        if (this.config.disconnectOnTimeout) {
                            this.destroySocket();
                        }
                        if (this.config.reconnectOnTimeout) {
                            this.reconnect();
                        }
                    }),
                    takeUntil(this.terminate),
                )
                .subscribe();
        }
    }

    private reconnect(): void {
        this.terminate.next();
        this.destroySocket();
        this.open();
    }

    private destroySocket(): void {
        this.socket?.destroy();
        this.socket = undefined;
        this.connected.next(false);
    }
}
