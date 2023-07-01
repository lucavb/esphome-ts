import { from, Observable } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, timeout, tap } from 'rxjs/operators';
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

    
    extractFrameBytes(buffer: Buffer) {
        if (buffer.length < 3) return null;
        const indicator = buffer[0];
        if (indicator != 1)
            throw new Error("Bad format. Expected 1 at the begin");

        const frameEnd = 3 + ((buffer[1] << 8) | buffer[2]);
        if (buffer.length < frameEnd) return [] as unknown as Buffer;
        const frame = buffer.subarray(3, frameEnd);
        buffer = buffer.subarray(frameEnd);
        return frame;
    }

    constructor(host: string, port: number, config?: RxjsSocketConfiguration, encryption?: boolean) {
        super(host, port, config);
        
        if(encryption){

            this.espData$ = this.data$.pipe(
                // // filter((buffer: Buffer) => buffer == null),
                // tap((buffer:Buffer) => console.log(`espNoiseData$: ${buffer}`)),
                // tap((buffer:Buffer) => console.log(`espNoiseData$ readUInt8(0): ${buffer.readUInt8(0)}`)),
                // tap((buffer:Buffer) => console.log(`espNoiseData$ readUInt8(1): ${buffer.readUInt8(1)}`)),
                // tap((buffer:Buffer) => console.log(`espNoiseData$ readUInt8(2): ${buffer.readUInt8(BytePositions.TYPE)}`)),
                // tap((buffer:Buffer) => console.log(`espNoiseData$ readUInt8(3): ${buffer.readUInt8(3)}`)),
                filter((buffer: Buffer) => buffer.length >= HEADER_SIZE),
                filter((buffer: Buffer) => buffer.readUInt8(BytePositions.ZERO) === 1),
                tap((buffer: Buffer) =>{
                    console.log(`espData$ ${buffer.readUInt8(BytePositions.TYPE)}, ${buffer.slice(
                        BytePositions.PAYLOAD,
                        BytePositions.PAYLOAD + buffer.readUInt8(BytePositions.LENGTH)).toString()}`)
                }),
                map((buffer: Buffer) => {
                    var frame = this.extractFrameBytes(buffer);

                    if (frame == null || frame.length == 0){
                        return ({
                            type: 0,
                            payload: new Uint8Array()
                        } as ReadData);
                    }

                    return ({
                        type: frame[0],
                        payload: frame.subarray(1)
                    } as ReadData)
            }));
        }else{

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
                // tap((buffer: Buffer) =>{
                //     console.log(`espData$ ${buffer}`)}),
                // // tap((buffer:Buffer) => console.log(`${buffer[0]}: ${buffer.subarray(1).toString()}`)),
                // // tap((buffer: Buffer) => console.log(`${buffer.length}, ${HEADER_SIZE}`)),
                // // tap((buffer: Buffer) => console.log(`${buffer.readUInt8(BytePositions.ZERO)}, ${HEADER_FIRST_BYTE}`)),
                // tap((buffer: Buffer) =>{
                //     console.log(`espData$ ${buffer.readUInt8(BytePositions.TYPE)}, ${buffer.slice(
                //         BytePositions.PAYLOAD,
                //         BytePositions.PAYLOAD + buffer.readUInt8(BytePositions.LENGTH)).toString()}`)
                // }),
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
    }

    sendEspMessage(type: MessageTypes, payload: Uint8Array): void {
        this.connected$
            .pipe(
                timeout(5000),
                filter(isTrue),
                take(1),
                switchMap(() => {
                    console.log('sendespmessage: ',MessageTypes[type]);
                    const final = new Uint8Array([HEADER_FIRST_BYTE, payload.length, type, ...payload]);
                    return this.send(final);
                }),
                takeUntil(this.terminate),
            )
            .subscribe();
    }

    sendEspMessageEncrypted(type: MessageTypes, frame: Uint8Array): void{
        this.connected$
            .pipe(
                timeout(5000),
                filter(isTrue),
                take(1),
                switchMap(() => {
                    return this.send(frame);
                }),
                takeUntil(this.terminate),
            )
            .subscribe();
    }
}
