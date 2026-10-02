import { from, Observable } from 'rxjs';
import { filter, mergeMap, switchMap, take, takeUntil, timeout } from 'rxjs/operators';
import { type CommandInterface } from '../components/commandInterface';
import { RxjsSocket, type RxjsSocketConfiguration } from './socket';
import { createFrameParser, encodeFrame, type ReadData } from './framer';
import { MessageTypes } from './requestResponseMatching';
import { isTrue } from './booleans';

export type { ReadData } from './framer';

export class EspSocket extends RxjsSocket implements CommandInterface {
    public readonly espData$: Observable<ReadData>;

    constructor(host: string, port: number, config?: RxjsSocketConfiguration) {
        super(host, port, config);

        // Each subscription owns its parser, and each connection owns its
        // carry-over buffer: a frame is pushed into a parser exactly once per
        // subscriber, and a parser that still holds a partial frame is dropped
        // when the connection drops. Scoping the parser inside the switchMap is
        // what guarantees both — a shared parser field would be fed once per
        // subscriber and would survive reconnects.
        this.espData$ = this.connected$.pipe(
            filter(isTrue),
            switchMap(() => {
                const frameParser = createFrameParser();
                return this.data$.pipe(mergeMap((chunk: Buffer) => from(frameParser.push(chunk))));
            }),
        );
    }

    sendEspMessage(type: MessageTypes, payload: Uint8Array): void {
        this.connected$
            .pipe(
                timeout(5000),
                filter(isTrue),
                take(1),
                switchMap(() => {
                    const final = encodeFrame(type, payload);
                    return this.send(final);
                }),
                takeUntil(this.terminate),
            )
            // Fire-and-forget by design (CommandInterface): the command is
            // silently dropped when the connection is not established within
            // the timeout, and a payload over the wire limit is rejected by
            // encodeFrame. Both surface on error$ instead of crashing the host.
            .subscribe({
                error: (error: unknown) => {
                    this.error.next(error instanceof Error ? error : new Error(String(error)));
                },
            });
    }
}
