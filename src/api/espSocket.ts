import { from, Observable } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, timeout } from 'rxjs/operators';
import { CommandInterface } from '../components/commandInterface';
import { RxjsSocket, RxjsSocketConfiguration } from './socket';
import { BytePositions, HEADER_FIRST_BYTE, HEADER_SIZE } from './bytePositions';
import { MessageTypes } from './requestResponseMatching';
import { isTrue } from './helpers';

export interface ReadData {
    type: number;
    payload: Uint8Array;
}

export class EspSocket extends RxjsSocket implements CommandInterface {
    public readonly espData$: Observable<ReadData>;

    constructor(host: string, port: number, config?: RxjsSocketConfiguration) {
        super(host, port, config);

        this.espData$ = this.data$.pipe(
            switchMap((buffer: Buffer) => {
                let bytesTaken = 0;
                const result: Buffer[] = [];
                while (bytesTaken < buffer.length) {
                    const subBuffer = buffer.slice(
                        bytesTaken,
                        bytesTaken + HEADER_SIZE + buffer[bytesTaken + BytePositions.LENGTH],
                    );
                    result.push(subBuffer);
                    bytesTaken += HEADER_SIZE + buffer[bytesTaken + BytePositions.LENGTH];
                }
                return from(result);
            }),
            filter((buffer: Buffer) => buffer.length >= HEADER_SIZE),
            filter((buffer: Buffer) => buffer.readUInt8(BytePositions.ZERO) === HEADER_FIRST_BYTE),
            map((buffer: Buffer) => ({
                type: buffer.readUInt8(BytePositions.TYPE),
                payload: buffer.slice(
                    BytePositions.PAYLOAD,
                    BytePositions.PAYLOAD + buffer.readUInt8(BytePositions.LENGTH),
                ),
            })),
        );
    }

    sendEspMessage(type: MessageTypes, payload: Uint8Array): void {
        this.connected$
            .pipe(
                timeout(5000),
                filter(isTrue),
                take(1),
                switchMap(() => {
                    const final = new Uint8Array([HEADER_FIRST_BYTE, payload.length, type, ...payload]);
                    return this.send(final);
                }),
                takeUntil(this.terminate),
            )
            .subscribe();
    }
}
