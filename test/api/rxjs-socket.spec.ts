import { createServer, Server } from 'net';
import { firstValueFrom } from 'rxjs';
import { delay, distinctUntilChanged, filter, skip, switchMap, take, tap } from 'rxjs/operators';
import { RxjsSocket } from '../../src';

const isTrue = (val: boolean) => val;
const isFalse = (val: boolean) => !val;
const isRecord = (arg: unknown): arg is Record<string, unknown> =>
    !!arg && typeof arg === 'object' && !Array.isArray(arg);

const closeServer = (srv: Server): Promise<void> =>
    new Promise((resolve) => {
        srv.close(() => resolve());
    });

describe('RxjsSocket', () => {
    let client: RxjsSocket = new RxjsSocket('localhost', 43788);
    let server: Server = createServer();
    const host = 'localhost';
    const port = 43788;

    afterEach(async () => {
        // Tear the client down first: server.close() waits for open connections to end.
        client.close(true);
        await closeServer(server);
        // Reset to harmless, un-bound no-op stubs so a misordered teardown cannot leak.
        client = new RxjsSocket(host, port);
        server = createServer();
    });

    describe('connected$', () => {
        beforeEach(() => {
            client = new RxjsSocket(host, port);

            server = createServer((socket) => {
                setTimeout(() => socket.end(), 10);
            }).listen(port);
        });

        it('emits true when connected', async () => {
            const connected = firstValueFrom(client.connected$.pipe(filter(isTrue), take(1)));
            client.open();
            await connected;
        }, 2000);

        it('emits false when the connection is closed', async () => {
            const closed = firstValueFrom(client.connected$.pipe(skip(2), filter(isFalse), take(1)));
            client.open();
            await closed;
        }, 2000);
    });

    describe('timeout', () => {
        it('emits on timeout$ and disconnects when the timeout occurs', async () => {
            server = createServer(() => undefined).listen(port);
            client = new RxjsSocket(host, port, { timeout: 50 });
            const timeout$ = firstValueFrom(client.timeout$.pipe(take(1)));
            const disconnected = firstValueFrom(client.connected$.pipe(skip(1), filter(isFalse), take(1)));
            client.open();
            await timeout$;
            await disconnected;
        }, 250);

        it(
            'reconnects',
            async () => {
                server = createServer((socket) => {
                    socket.write('hello');
                }).listen(port);
                client = new RxjsSocket(host, port, { timeout: 50, reconnectOnTimeout: true });

                const statuses: boolean[] = [];
                // Wait for take(4) COMPLETION, not the first value: firstValueFrom would
                // resolve after the initial false and silently skip the whole assertion.
                const connected = new Promise<void>((resolve, reject) => {
                    client.connected$
                        .pipe(
                            distinctUntilChanged(),
                            tap((status) => statuses.push(status)),
                            take(4),
                        )
                        .subscribe({ complete: resolve, error: reject });
                });
                client.open();
                await connected;
                expect(statuses).toEqual([false, true, false, true]);
            },
            10 * 1000,
        );
    });

    describe('data$', () => {
        beforeEach(() => {
            client = new RxjsSocket(host, port);
        });

        it('receives data', async () => {
            const first = [0x03, 0x03, 0x93, 0xfe];
            server = createServer((socket) => {
                socket.write(Uint8Array.from(first));
            }).listen(port);
            const received = firstValueFrom(
                client.data$.pipe(
                    tap((buffer: Buffer) => expect(buffer).toEqual(Buffer.from(first))),
                    take(1),
                ),
            );
            client.open();
            await received;
        }, 1000);
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

        it('sends and receives the echo', async () => {
            const payload = [0x23, 0x93, 0xfe, 0x54];
            const uint8Array = Uint8Array.from(payload);
            const echoed = firstValueFrom(
                client.connected$.pipe(
                    filter(isTrue),
                    switchMap(() => client.send(uint8Array)),
                    switchMap(() => client.data$),
                    tap((buffer: Buffer) => expect(buffer).toEqual(Buffer.from(payload))),
                    take(1),
                ),
            );
            client.open();
            await echoed;
        }, 1000);

        it('gives an observable that emits and completes immediately on a not connected socket', async () => {
            let emitted = 0;
            await firstValueFrom(
                client.send('data').pipe(
                    tap(() => emitted++),
                    take(1),
                ),
            );
            expect(emitted).toBe(1);
        });
    });

    describe('close', () => {
        it('actually closes the connection', async () => {
            let ended: () => void = () => undefined;
            const socketEnded = new Promise<void>((resolve) => {
                ended = resolve;
            });
            server = createServer((socket) => {
                socket.on('end', ended);
            }).listen(port);
            client = new RxjsSocket(host, port);

            const closed = firstValueFrom(
                client.connected$.pipe(
                    filter(isTrue),
                    take(1),
                    delay(50),
                    tap(() => client.close()),
                    take(1),
                ),
            );
            client.open();
            await closed;
            await socketEnded;
        }, 1000);

        it('simply does nothing when calling close without open', () => {
            client = new RxjsSocket(host, port);
            const f = () => client.close();
            expect(f).not.toThrow();
        });
    });

    describe('error handling', () => {
        it('connection refused', async () => {
            client = new RxjsSocket(host, port);
            const refused = firstValueFrom(
                client.error$.pipe(
                    take(1),
                    filter(isRecord),
                    tap((err: Record<string, unknown>) => expect(err.code).toBe('ECONNREFUSED')),
                ),
            );
            const connected = firstValueFrom(
                client.connected$.pipe(
                    skip(1),
                    take(1),
                    tap((val: boolean) => expect.unreachable(`connected$ emitted unexpectedly: ${String(val)}`)),
                ),
            );
            client.open();
            const [refusedResult, connectedResult] = await Promise.allSettled([refused, connected]);
            expect(refusedResult.status).toBe('fulfilled');
            expect(connectedResult.status).toBe('rejected');
        }, 5000);
    });
});
