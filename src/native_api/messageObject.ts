import {Reader, Writer} from 'protobufjs/minimal';

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U>
        ? Array<DeepPartial<U>>
        : T[P] extends ReadonlyArray<infer U>
            ? ReadonlyArray<DeepPartial<U>>
            : T[P] extends Date | Function | Uint8Array | undefined
                ? T[P]
                : T[P] extends infer U | undefined
                    ? DeepPartial<U>
                    : T[P] extends object
                        ? DeepPartial<T[P]>
                        : T[P]
};

export interface MessageObject<R> {
    encode: (message: R, writer?: Writer) => Writer;
    decode: (reader: Reader, length?: number) => R;
    fromJSON: (object: any) => R;
    fromPartial: (object: DeepPartial<R>) => R;
    toJSON: (message: R) => unknown;
}

export interface RequestMessageObject extends MessageObject<ResponseMessageObject> {

}

export interface ResponseMessageObject extends MessageObject<RequestMessageObject> {

}
