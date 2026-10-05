import { EspSocket } from '../../src/api/espSocket';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { encodeFrame } from '../../src/api/framer';
import { type ReadData } from '../../src/api/espSocket';
import { type Connection } from '../../src/api/connection';
import { createInMemoryConnection, type InMemoryServerDriver } from '../testHelpers/inMemoryConnection';
import { firstValueFrom, take, TimeoutError } from 'rxjs';

const frame = (type: number, payload: number[]): Uint8Array => encodeFrame(type, Uint8Array.from(payload));

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('EspSocket framing', () => {
    let espSocket: EspSocket;
    let connection: Connection;
    let server: InMemoryServerDriver;
    let received: ReadData[];

    const openSocket = (): void => {
        espSocket.open();
        server.connect();
        received = [];
        espSocket.espData$.subscribe((data: ReadData) => {
            received.push(data);
        });
    };

    beforeEach(() => {
        ({ connection, server } = createInMemoryConnection());
        espSocket = new EspSocket('localhost', 6053, { connection });
        openSocket();
    });

    it('reassembles a frame split across two chunks end to end', () => {
        const full = frame(MessageTypes.HelloResponse, [0x01, 0x02, 0x03]);
        server.push(Buffer.from(full.subarray(0, 2)));
        server.push(Buffer.from(full.subarray(2)));

        return flush().then(() => {
            expect(received.length).toBe(1);
            expect(received[0]?.type).toBe(MessageTypes.HelloResponse);
            expect([...received[0].payload]).toEqual([0x01, 0x02, 0x03]);
        });
    });

    it('delivers a split frame to every subscriber', async () => {
        const first: ReadData[] = [];
        const second: ReadData[] = [];
        espSocket.espData$.subscribe((data: ReadData) => first.push(data));
        espSocket.espData$.subscribe((data: ReadData) => second.push(data));

        const full = frame(MessageTypes.HelloResponse, [0x01, 0x02, 0x03]);
        server.push(Buffer.from(full.subarray(0, 2)));
        server.push(Buffer.from(full.subarray(2)));
        await flush();

        for (const subscriberFrames of [received, first, second]) {
            expect(subscriberFrames.length).toBe(1);
            expect(subscriberFrames[0]?.type).toBe(MessageTypes.HelloResponse);
            expect([...subscriberFrames[0].payload]).toEqual([0x01, 0x02, 0x03]);
        }
        // share() multicasts the shared parse pipeline: every subscriber gets
        // the SAME parsed frame instance — no per-subscriber clone/re-emit.
        expect(first[0]).toBe(received[0]);
        expect(second[0]).toBe(received[0]);
    });

    it('never leaks a partial frame from a dead connection into the next one', async () => {
        server.push(Buffer.from([0x00, 0x03, MessageTypes.PingResponse, 0xaa]));
        server.disconnect();

        espSocket.open();
        server.connect();
        server.push(Buffer.from(frame(MessageTypes.HelloResponse, [0x01, 0x02])));
        await flush();

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(MessageTypes.HelloResponse);
        expect([...received[0].payload]).toEqual([0x01, 0x02]);
    });

    it('serves several chunks one after another', () => {
        server.push(Buffer.from(frame(MessageTypes.ConnectResponse, [0x0a])));
        server.push(Buffer.from(frame(MessageTypes.DisconnectResponse, [0x0b, 0x0c])));

        expect(received.map(({ type }) => type)).toEqual([
            MessageTypes.ConnectResponse,
            MessageTypes.DisconnectResponse,
        ]);
    });

    it('emits an empty payload for a zero length frame', () => {
        server.push(Buffer.from(frame(MessageTypes.PingResponse, [])));

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(MessageTypes.PingResponse);
        expect(received[0]?.payload.length).toBe(0);
    });

    it('passes unknown message types through unchanged', () => {
        server.push(Buffer.from(frame(99, [0x10])));

        expect(received.length).toBe(1);
        expect(received[0]?.type).toBe(99);
        expect([...received[0].payload]).toEqual([0x10]);
    });

    it('skips garbage bytes and still parses a valid frame in the same chunk', () => {
        const chunk = Buffer.concat([Buffer.from([0x99, 0x88]), Buffer.from(frame(MessageTypes.PingResponse, [0x07]))]);
        server.push(chunk);

        return flush().then(() => {
            expect(received.length).toBe(1);
            expect(received[0]?.type).toBe(MessageTypes.PingResponse);
            expect([...received[0].payload]).toEqual([0x07]);
        });
    });

    it('ignores empty data events without emitting', () => {
        server.push(Buffer.alloc(0));

        return flush().then(() => {
            expect(received.length).toBe(0);
        });
    });
});

describe('EspSocket sendEspMessage', () => {
    let espSocket: EspSocket;
    let connection: Connection;
    let server: InMemoryServerDriver;

    beforeEach(() => {
        ({ connection, server } = createInMemoryConnection());
        espSocket = new EspSocket('localhost', 6053, { connection });
        espSocket.open();
    });

    it('writes the esp frame layout once connected', async () => {
        server.connect();
        await flush();

        espSocket.sendEspMessage(MessageTypes.ConnectRequest, new Uint8Array([0xde, 0xad]));

        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual([
            ...encodeFrame(MessageTypes.ConnectRequest, new Uint8Array([0xde, 0xad])),
        ]);
    });

    it('withholds writes until the connection reports ready and flushes then', async () => {
        espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

        await flush();
        expect(server.written.length).toBe(0);

        server.connect();
        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual([...encodeFrame(MessageTypes.HelloRequest, new Uint8Array([0x11]))]);
    });

    it('abandons a pending send after five seconds without connect', async () => {
        vi.useFakeTimers();
        try {
            espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

            await vi.advanceTimersByTimeAsync(5000);
            expect(server.written.length).toBe(0);
        } finally {
            vi.useRealTimers();
        }
    });

    it('routes the timeout of an abandoned send to error$', async () => {
        vi.useFakeTimers();
        try {
            const error = firstValueFrom(espSocket.error$.pipe(take(1)));
            espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

            await vi.advanceTimersByTimeAsync(5000);
            await expect(error).resolves.toBeInstanceOf(TimeoutError);
        } finally {
            vi.useRealTimers();
        }
    });

    it('routes an oversized payload to error$ without writing', async () => {
        server.connect();
        await flush();

        const error = firstValueFrom(espSocket.error$.pipe(take(1)));
        espSocket.sendEspMessage(MessageTypes.LightCommandRequest, new Uint8Array(256));

        await expect(error).resolves.toBeInstanceOf(RangeError);
        expect(server.written.length).toBe(0);
    });

    it('stops a pending send when the socket terminates', async () => {
        vi.useFakeTimers();
        try {
            const errors: unknown[] = [];
            espSocket.error$.subscribe((error: unknown) => errors.push(error));
            espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));

            espSocket.terminate();
            // terminate() must win the race against the 5s send timeout: no
            // abandoned write and no TimeoutError either.
            await vi.advanceTimersByTimeAsync(5000);
            expect(server.written.length).toBe(0);
            expect(errors).toEqual([]);
        } finally {
            vi.useRealTimers();
        }
    });

    it('flushes a command that was pending across an open() when the connection returns', async () => {
        // open() deliberately does NOT kill a pending send: a command issued
        // during a blip rides the reconnect within its 5-second window and
        // flushes as soon as the connection reports ready again.
        espSocket.sendEspMessage(MessageTypes.HelloRequest, new Uint8Array([0x11]));
        espSocket.open(); // no-op on the fake — pins that open() does NOT kill the pending send

        server.connect();
        await flush();
        expect(server.written.length).toBe(1);
        expect([...server.written[0]]).toEqual([...encodeFrame(MessageTypes.HelloRequest, new Uint8Array([0x11]))]);
    });

    it('encodes a zero payload into a bare three byte frame', async () => {
        server.connect();
        await flush();

        espSocket.sendEspMessage(MessageTypes.PingResponse, new Uint8Array());

        await flush();
        expect([...server.written[0]]).toEqual([...encodeFrame(MessageTypes.PingResponse, new Uint8Array())]);
    });
});

describe('Connection contract (in-memory)', () => {
    const setUp = (): { connection: Connection; server: InMemoryServerDriver } => createInMemoryConnection();

    it('terminate() with nothing open is a no-op — first and repeat call alike', () => {
        const { connection } = setUp();
        const statuses: boolean[] = [];
        connection.connected$.subscribe((status: boolean) => statuses.push(status));

        connection.terminate();
        connection.terminate();

        // Only the synchronous BehaviorSubject seed: neither call may emit a
        // spurious `false` for a path that was never open.
        expect(statuses).toEqual([false]);
    });

    it('drops chunks pushed while disconnected', () => {
        const { connection, server } = setUp();
        const chunks: Buffer[] = [];
        connection.chunks$.subscribe((chunk: Buffer) => chunks.push(chunk));

        const dropped = Buffer.from([0xaa]);
        server.push(dropped); // disconnected: silently dropped
        server.connect();
        const delivered = Buffer.from([0xbb]);
        server.push(delivered);

        expect(chunks).toEqual([delivered]);
        expect(chunks[0]).toBe(delivered);
    });
});
