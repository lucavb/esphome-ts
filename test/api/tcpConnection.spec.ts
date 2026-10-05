import { createServer, Server, Socket } from 'net';
import { firstValueFrom } from 'rxjs';
import { delay, filter, skip, switchMap, take, tap } from 'rxjs/operators';
import { TcpConnection } from '../../src/api/tcpConnection';
import { isFalse, isTrue } from '../../src/api/booleans';

const isRecord = (arg: unknown): arg is Record<string, unknown> =>
    !!arg && typeof arg === 'object' && !Array.isArray(arg);

const closeServer = (srv: Server): Promise<void> =>
    new Promise((resolve) => {
        srv.close(() => resolve());
    });

const createTestServer = (onConnection: (socket: Socket) => void): Server =>
    createServer((socket) => {
        // The adapter tears its socket down with end() followed by destroy();
        // when a chunk is still unread at that moment the TCP stack sends RST,
        // which surfaces as ECONNRESET on the server side of the connection.
        // That is expected during teardown, not a failure: a bare listener
        // keeps it from escaping as an uncaught exception.
        socket.on('error', () => undefined);
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
            const connected = firstValueFrom(
                connection.connected$.pipe(
                    skip(1),
                    take(1),
                    tap((val: boolean) => expect.unreachable(`connected$ emitted unexpectedly: ${String(val)}`)),
                ),
            );
            connection.open();
            const [refusedResult, connectedResult] = await Promise.allSettled([refused, connected]);
            expect(refusedResult.status).toBe('fulfilled');
            expect(connectedResult.status).toBe('rejected');
        }, 5000);
    });
});
