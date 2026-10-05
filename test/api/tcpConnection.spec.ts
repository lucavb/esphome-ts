import { createServer, Server, Socket } from 'net';
import { delay, filter, firstValueFrom, skip, switchMap, take, tap } from 'rxjs';
import { TcpConnection } from '../../src/api/tcpConnection';
import { isFalse, isTrue } from '../../src/api/booleans';

const isRecord = (arg: unknown): arg is Record<string, unknown> =>
    !!arg && typeof arg === 'object' && !Array.isArray(arg);

const isFulfilled = <T>(result: PromiseSettledResult<T>): result is PromiseFulfilledResult<T> =>
    result.status === 'fulfilled';

const closeServer = (srv: Server): Promise<void> =>
    new Promise((resolve) => {
        srv.close(() => resolve());
    });

// Server-side sockets created by createTestServer, for teardown: a peer that
// destroys its socket with data the server never read can leave this side of
// the connection half-closed, and server.close() would then wait on it
// forever. afterEach force-destroys any straggler so the close settles.
const openSockets = new Set<Socket>();

const createTestServer = (onConnection: (socket: Socket) => void): Server =>
    createServer((socket) => {
        // The adapter tears its socket down with end() followed by destroy();
        // when a chunk is still unread at that moment the TCP stack sends RST,
        // which surfaces as ECONNRESET on the server side of the connection.
        // That is expected during teardown, not a failure: a bare listener
        // keeps it from escaping as an uncaught exception.
        socket.on('error', () => undefined);
        openSockets.add(socket);
        socket.once('close', () => openSockets.delete(socket));
        onConnection(socket);
    });

describe('TcpConnection', () => {
    let connection: TcpConnection = new TcpConnection('localhost', 43788);
    let server: Server = createServer();
    const host = 'localhost';
    const port = 43788;

    afterEach(async () => {
        // Tear the connection down first: server.close() waits for open connections to end.
        connection.terminate();
        // The peer can leave a server-side socket half-closed with unread data
        // (see openSockets above); close() would hang on it. Force any
        // straggler so the close below always settles.
        openSockets.forEach((socket) => socket.destroy());
        openSockets.clear();
        await closeServer(server);
        // Reset to harmless, un-bound no-op stubs so a misordered teardown cannot leak.
        connection = new TcpConnection(host, port);
        server = createServer();
    });

    describe('connected$', () => {
        beforeEach(() => {
            connection = new TcpConnection(host, port);

            server = createTestServer((socket) => {
                setTimeout(() => socket.end(), 10);
            }).listen(port);
        });

        it('emits true when connected', async () => {
            const connected = firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));
            connection.open();
            await connected;
        }, 2000);

        it('emits false when the connection is closed', async () => {
            const closed = firstValueFrom(connection.connected$.pipe(skip(2), filter(isFalse), take(1)));
            connection.open();
            await closed;
        }, 2000);
    });

    describe('idle timeout', () => {
        it('tears the connection down when the socket stays idle', async () => {
            server = createTestServer(() => undefined).listen(port);
            connection = new TcpConnection(host, port, { timeout: 50 });
            const disconnected = firstValueFrom(connection.connected$.pipe(skip(1), filter(isFalse), take(1)));
            connection.open();
            await disconnected;
        }, 2500);

        it('does not auto-reconnect after the idle teardown', async () => {
            server = createTestServer(() => undefined).listen(port);
            connection = new TcpConnection(host, port, { timeout: 50 });
            const emissions: boolean[] = [];
            connection.connected$.subscribe((status: boolean) => emissions.push(status));
            connection.open();
            await firstValueFrom(connection.connected$.pipe(skip(1), filter(isFalse), take(1)));
            const settledAt = emissions.length;

            // Reconnection stays driven by EspDevice: until it calls open(),
            // connected$ must stay settled on `false`.
            await new Promise((resolve) => setTimeout(resolve, 200));
            expect(emissions.slice(settledAt)).not.toContain(true);
        }, 2000);

        it('keeps the connection while writes reset the idle window', async () => {
            server = createTestServer(() => undefined).listen(port);
            connection = new TcpConnection(host, port, { timeout: 250 });
            connection.open();
            await firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));

            // Each write is socket activity and re-arms the idle timer: writes
            // 125ms apart (half the 250ms window) must keep the path alive,
            // and only the final silent stretch may tear it down. The wide
            // margins keep kernel scheduling slack under parallel test load
            // from firing the idle timer before a write lands.
            for (let i = 0; i < 3; i++) {
                connection.write(Uint8Array.from([i]));
                await new Promise((resolve) => setTimeout(resolve, 125));
                expect(connection.isConnected()).toBe(true);
            }

            await firstValueFrom(connection.connected$.pipe(skip(1), filter(isFalse), take(1)));
            expect(connection.isConnected()).toBe(false);
        }, 2000);
    });

    describe('chunks$', () => {
        it('receives written bytes back from an echoing server', async () => {
            const payload = [0x23, 0x93, 0xfe, 0x54];
            server = createTestServer((socket) => {
                socket.on('data', (buffer) => {
                    socket.write(buffer);
                });
            }).listen(port);
            connection = new TcpConnection(host, port);

            const echoed = firstValueFrom(
                connection.connected$.pipe(
                    filter(isTrue),
                    switchMap(() => {
                        connection.write(Uint8Array.from(payload));
                        return connection.chunks$;
                    }),
                    tap((buffer: Buffer) => expect(buffer).toEqual(Buffer.from(payload))),
                    take(1),
                ),
            );
            connection.open();
            await echoed;
        }, 1000);

        it('silently drops a write issued while disconnected', async () => {
            const received: Buffer[] = [];
            server = createTestServer((socket) => {
                socket.on('data', (buffer: Buffer) => received.push(buffer));
            }).listen(port);
            connection = new TcpConnection(host, port);

            expect(() => connection.write(Uint8Array.from([0x01, 0x02, 0x03]))).not.toThrow();

            connection.open();
            await firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));
            // A live write afterwards proves the observation point is wired up:
            // only bytes written on the wire while connected may arrive.
            connection.write(Uint8Array.from([0x99]));
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(received.map((buffer) => [...buffer])).toEqual([[0x99]]);
        }, 2000);
    });

    describe('terminate', () => {
        it('makes the server observe the close', async () => {
            let ended: () => void = () => undefined;
            const socketEnded = new Promise<void>((resolve) => {
                ended = resolve;
            });
            server = createTestServer((socket) => {
                socket.on('end', ended);
            }).listen(port);
            connection = new TcpConnection(host, port);

            const closed = firstValueFrom(
                connection.connected$.pipe(
                    filter(isTrue),
                    take(1),
                    delay(50),
                    tap(() => connection.terminate()),
                    take(1),
                ),
            );
            connection.open();
            await closed;
            await socketEnded;
        }, 1000);

        it('does nothing harmful when terminating without open', () => {
            connection = new TcpConnection(host, port);
            const f = () => connection.terminate();
            expect(f).not.toThrow();
        });

        it('flips connected$ to false', async () => {
            server = createTestServer(() => undefined).listen(port);
            connection = new TcpConnection(host, port);
            const statuses: boolean[] = [];
            connection.connected$.subscribe((status: boolean) => statuses.push(status));

            connection.open();
            await firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));
            connection.terminate();
            // Subject emissions are synchronous: by the time terminate() returns,
            // connected$ has reported exactly the disconnected→connected→disconnected flip.
            expect(statuses).toEqual([false, true, false]);
        }, 2000);

        it('is a no-op on a second terminate', async () => {
            let endCount = 0;
            let peerClosed!: () => void;
            const peerClosedPromise = new Promise<void>((resolve) => {
                peerClosed = resolve;
            });
            server = createTestServer((socket) => {
                socket.on('end', () => {
                    endCount += 1;
                    socket.end();
                });
                socket.once('close', () => peerClosed());
            }).listen(port);
            connection = new TcpConnection(host, port);

            connection.open();
            await firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));
            connection.terminate();
            connection.terminate();
            await peerClosedPromise;
            // the peer saw exactly one FIN half-close; the second terminate
            // must not re-enter the teardown on an already-settling socket
            expect(endCount).toBe(1);
        }, 2000);

        it('terminate during connect settles the socket', async () => {
            let peerClosed!: () => void;
            const peerClosedPromise = new Promise<void>((resolve) => {
                peerClosed = resolve;
            });
            // The peer ends its side as soon as it sees the FIN so 'close' is
            // observable even when the teardown beats any further client traffic.
            server = createTestServer((socket) => {
                socket.on('end', () => socket.end());
                socket.once('close', () => peerClosed());
            }).listen(port);
            connection = new TcpConnection(host, port);

            const startedAt = Date.now();
            connection.open();
            connection.terminate();
            await peerClosedPromise;
            // the 250ms safety timer bounds the teardown even for a socket
            // that never finished connecting
            expect(Date.now() - startedAt).toBeLessThan(500);
        }, 2000);

        it('open() during the grace window cancels the graceful close and reconnects', async () => {
            let connectionCount = 0;
            server = createTestServer(() => {
                connectionCount += 1;
            }).listen(port);
            connection = new TcpConnection(host, port);

            connection.open();
            await firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));
            connection.terminate();
            // synchronous call straight after terminate(): well inside the 250ms window
            connection.open();

            // subscribing after the flip back to `false` seeds one `false`
            // emission; the next `true` is the fresh socket connecting
            await firstValueFrom(connection.connected$.pipe(skip(1), filter(isTrue), take(1)));

            // the reconnected socket must survive past the abandoned grace timer
            await new Promise((resolve) => setTimeout(resolve, 300));
            expect(connectionCount).toBe(2);
            expect(connection.isConnected()).toBe(true);
        }, 2000);

        it('force-destroys a peer that never completes the close within the grace window', async () => {
            let peerClosed!: () => void;
            const peerClosedPromise = new Promise<void>((resolve) => {
                peerClosed = resolve;
            });
            // The peer never ends its side and ignores the client's FIN
            // half-close, but it keeps writing: once terminate() stops the
            // client from reading, the kernel receive queue holds unread
            // bytes, so the 250ms force destroy surfaces as a hard reset
            // detectable on the server side instead of a silent close.
            server = createTestServer((socket) => {
                const writer: ReturnType<typeof setInterval> = setInterval(() => {
                    socket.write(Buffer.from([0x00]));
                }, 20);
                socket.once('close', () => {
                    clearInterval(writer);
                    peerClosed();
                });
            }).listen(port);
            connection = new TcpConnection(host, port);

            connection.open();
            await firstValueFrom(connection.connected$.pipe(filter(isTrue), take(1)));
            const startedAt = Date.now();
            connection.terminate();
            // Pin "no chunks while disconnected" through teardown: a chunks$
            // subscriber attached after terminate() must see nothing across the
            // grace window, even though the peer keeps writing bytes.
            const chunksAfterTeardown: Buffer[] = [];
            connection.chunks$.subscribe((chunk: Buffer) => chunksAfterTeardown.push(chunk));
            await peerClosedPromise;
            // grace window is 250ms; a generous bound keeps kernel scheduling
            // slack from flaking the assertion
            expect(Date.now() - startedAt).toBeLessThan(1000);
            expect(chunksAfterTeardown).toEqual([]);
        }, 2000);
    });

    describe('error handling', () => {
        it('connection refused', async () => {
            connection = new TcpConnection(host, port);
            const refused = firstValueFrom(
                connection.error$.pipe(
                    take(1),
                    filter(isRecord),
                    tap((err: Record<string, unknown>) => expect(err.code).toBe('ECONNREFUSED')),
                ),
            );
            // After ECONNREFUSED the socket's 'close' handler emits `false`:
            // the pinned contract is that a refused connect reports
            // disconnected, never connected.
            const connected = firstValueFrom(connection.connected$.pipe(skip(1), take(1)));
            connection.open();
            const [refusedResult, connectedResult] = await Promise.allSettled([refused, connected]);
            expect(refusedResult.status).toBe('fulfilled');
            expect(connectedResult.status).toBe('fulfilled');
            if (!isFulfilled(connectedResult)) {
                throw connectedResult.reason;
            }
            expect(connectedResult.value).toBe(false);
        }, 5000);
    });
});
