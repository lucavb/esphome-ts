import { Socket } from 'net';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { take, takeUntil, tap } from 'rxjs/operators';
import { type Connection } from './connection';

export class TcpConnection implements Connection {
    private socket?: Socket;
    private readonly timeout?: number;

    // RxJS
    private readonly chunks = new Subject<Buffer>();
    public readonly chunks$: Observable<Buffer>;

    private readonly connected = new BehaviorSubject<boolean>(false);
    public readonly connected$: Observable<boolean>;

    private readonly error = new Subject<Error>();
    public readonly error$: Observable<unknown>;

    // Internal teardown signal; ends the socket event subscriptions.
    private readonly teardown = new Subject<void>();

    // Cancels a pending graceful termination when a new connection is opened.
    private gracefulDestroy?: () => void;

    constructor(
        private readonly host: string,
        private readonly port: number,
        config?: { timeout?: number },
    ) {
        this.timeout = config?.timeout;
        this.chunks$ = this.chunks.asObservable();
        this.connected$ = this.connected.asObservable();
        this.error$ = this.error.asObservable();
    }

    open(): void {
        if (this.socket?.connecting) {
            return;
        }

        this.teardownSocket();
        this.socket = new Socket();
        if (this.timeout) {
            this.socket.setTimeout(this.timeout);
        }
        this.setupSocketEvents();
        this.socket.connect(this.port, this.host);
    }

    terminate(): void {
        if (!this.socket || this.gracefulDestroy) {
            return;
        }
        this.connected.next(false);
        this.teardown.next();
        this.socket.end();

        // Graceful-then-force: wait for the socket's 'close' event (the grace
        // period started by end()), but destroy after 250ms at the latest —
        // whichever comes first. An unconditional immediate destroy() sends RST
        // and flakes teardown.
        const socket = this.socket;
        let settled = false;
        const finish = (): void => {
            if (settled) {
                return;
            }
            settled = true;
            this.gracefulDestroy = undefined;
            if (this.socket === socket) {
                this.destroySocket();
            }
        };
        const safety = setTimeout(finish, 250);
        safety.unref();
        socket.once('close', finish);
        const cancel = (): void => {
            settled = true;
            clearTimeout(safety);
            socket.removeListener('close', finish);
            this.gracefulDestroy = undefined;
        };
        this.gracefulDestroy = cancel;
    }

    isConnected(): boolean {
        return this.connected.getValue();
    }

    // Fire-and-forget: a write while disconnected is silently dropped, a write
    // error is surfaced on error$ instead of escaping into Node's write-completion
    // context as an uncaught exception.
    write(data: Uint8Array): void {
        if (!this.isConnected() || !this.socket) {
            return;
        }
        this.socket.write(data, (err?: Error | null) => {
            if (err) {
                this.error.next(err);
            }
        });
    }

    private setupSocketEvents(): void {
        const socket = this.socket;
        if (!socket) {
            return;
        }

        socket.on('error', (err: Error) => this.error.next(err));
        fromEvent<Buffer>(socket, 'data')
            .pipe(
                tap((buffer: Buffer) => this.chunks.next(buffer)),
                takeUntil(this.teardown),
            )
            .subscribe();
        fromEvent<void>(socket, 'connect')
            .pipe(
                take(1),
                tap(() => this.connected.next(true)),
                takeUntil(this.teardown),
            )
            .subscribe();
        fromEvent<void>(socket, 'close')
            .pipe(
                take(1),
                tap(() => this.connected.next(false)),
                takeUntil(this.teardown),
            )
            .subscribe();
        fromEvent<void>(socket, 'end')
            .pipe(
                take(1),
                tap(() => this.socket?.end()),
                tap(() => this.connected.next(false)),
                takeUntil(this.teardown),
            )
            .subscribe();

        // The socket is idle: wait no longer, tear the connection down.
        // Reconnection stays driven by EspDevice.
        if (this.timeout && this.timeout > 0) {
            fromEvent<void>(socket, 'timeout')
                .pipe(
                    tap(() => {
                        this.teardown.next();
                        this.destroySocket();
                    }),
                    takeUntil(this.teardown),
                )
                .subscribe();
        }
    }

    private teardownSocket(): void {
        this.gracefulDestroy?.();
        this.gracefulDestroy = undefined;
        if (!this.socket) {
            return;
        }
        this.teardown.next();
        this.socket.destroy();
        this.socket = undefined;
        this.connected.next(false);
    }

    private destroySocket(): void {
        this.socket?.destroy();
        this.socket = undefined;
        this.connected.next(false);
    }
}
