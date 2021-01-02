import { createServer, Server } from 'net';
import { Subject } from 'rxjs';
import { delay, distinctUntilChanged, filter, skip, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { RxjsSocket } from '../../src';
import DoneCallback = jest.DoneCallback;

const isTrue = (val: boolean) => val;
const isFalse = (val: boolean) => !val;
const isRecord = (arg: unknown): arg is Record<string, unknown> => !!arg && typeof arg === 'object';

describe('RxjsSocket', () => {
    let client: RxjsSocket;
    let server: Server;
    const host = 'localhost';
    const port = 43788;
    const terminate = new Subject<void>();

    afterEach(() => {
        terminate.next();
        server.close();
        client.close(true);
        (client as unknown) = undefined;
    });

    describe('connected$', () => {
        beforeEach(() => {
            client = new RxjsSocket(host, port);

            server = createServer((socket) => {
                setTimeout(() => socket.end(), 10);
            }).listen(port);
        });

        it('emits true when connected', (done: DoneCallback) => {
            client.connected$
                .pipe(
                    filter(isTrue),
                    tap(() => done()),
                    takeUntil(terminate),
                )
                .subscribe();

            client.open();
        }, 1000);

        it('emits false when the connection is closed', (done: DoneCallback) => {
            client.connected$
                .pipe(
                    skip(2),
                    filter(isFalse),
                    tap(() => done()),
                    takeUntil(terminate),
                )
                .subscribe();

            client.open();
        }, 1000);
    });

    describe('timeout', () => {
        it('emits false when the timeout occurs', (done: DoneCallback) => {
            server = createServer(() => undefined).listen(port);
            client = new RxjsSocket(host, port, { timeout: 50 });
            client.timeout$
                .pipe(
                    tap(() => done()),
                    takeUntil(terminate),
                )
                .subscribe();
            client.open();
        }, 250);

        it('reconnects', (done) => {
            server = createServer((socket) => {
                socket.write('hello');
            }).listen(port);
            client = new RxjsSocket(host, port, { timeout: 50, reconnectOnTimeout: true });

            let index = 0;
            const expectedStatus = [false, true, false, true];
            client.connected$
                .pipe(
                    distinctUntilChanged(),
                    tap((status) => {
                        expect(status).toBe(expectedStatus[index]);
                        index++;
                        if (index === 4) {
                            done();
                        }
                    }),
                    take(4),
                    takeUntil(terminate),
                )
                .subscribe();
            client.open();
        });
    });

    describe('data$', () => {
        beforeEach(() => {
            client = new RxjsSocket(host, port);
        });

        it('receives data', (done) => {
            const first = [0x03, 0x03, 0x93, 0xfe];
            server = createServer((socket) => {
                socket.write(Uint8Array.from(first));
            }).listen(port);
            client.data$
                .pipe(
                    tap((buffer: Buffer) => {
                        expect(buffer).toEqual(Buffer.from(first));
                        done();
                    }),
                    takeUntil(terminate),
                )
                .subscribe();
            client.open();
        }, 100);
    });

    describe('send', () => {
        beforeEach(() => {
            client = new RxjsSocket(host, port);
            server = createServer((socket) => {
                socket.on('data', (buffer) => {
                    socket.write(buffer);
                });
            }).listen(port);
        });

        it('sends and receives the echo', (done) => {
            const payload = [0x23, 0x93, 0xfe, 0x54];
            const uint8Array = Uint8Array.from(payload);
            client.connected$
                .pipe(
                    filter(isTrue),
                    switchMap(() => client.send(uint8Array)),
                    switchMap(() => client.data$),
                    tap((buffer: Buffer) => {
                        expect(buffer).toEqual(Buffer.from(payload));
                        done();
                    }),
                    take(1),
                )
                .subscribe();
            client.open();
        });

        it('gives an observable that emits and completes immediately on a not connected socket', (done) => {
            let emitted = 0;
            client
                .send('data')
                .pipe(
                    tap(() => emitted++),
                    takeUntil(terminate),
                )
                .subscribe({
                    complete: () => {
                        expect(emitted).toBe(1);
                        done();
                    },
                });
        });
    });

    describe('close', () => {
        it('actually closes the connection', (done) => {
            server = createServer((socket) => {
                socket.on('end', () => done());
            }).listen(port);
            client = new RxjsSocket(host, port);

            client.connected$
                .pipe(
                    filter(isTrue),
                    take(1),
                    delay(50),
                    tap(() => client.close()),
                    takeUntil(terminate),
                )
                .subscribe();

            client.open();
        });

        it('simply does nothing when calling close without open', () => {
            client = new RxjsSocket(host, port);
            const f = () => client.close();
            expect(f).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('connection refused', (done) => {
            client = new RxjsSocket(host, port);
            client.connected$
                .pipe(
                    skip(1),
                    take(1),
                    tap((val: boolean) => fail(val)),
                    takeUntil(terminate),
                )
                .subscribe();
            client.error$
                .pipe(
                    take(1),
                    filter(isRecord),
                    tap((err: Record<string, unknown>) => expect(err.code).toBe('ECONNREFUSED')),
                    tap(() => done()),
                    takeUntil(terminate),
                )
                .subscribe();
            client.open();
        });
    });
});
