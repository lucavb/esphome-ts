/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';

export const protobufPackage = '';

export enum APISourceType {
    SOURCE_BOTH = 0,
    SOURCE_SERVER = 1,
    SOURCE_CLIENT = 2,
    UNRECOGNIZED = -1,
}

export function aPISourceTypeFromJSON(object: any): APISourceType {
    switch (object) {
        case 0:
        case 'SOURCE_BOTH':
            return APISourceType.SOURCE_BOTH;
        case 1:
        case 'SOURCE_SERVER':
            return APISourceType.SOURCE_SERVER;
        case 2:
        case 'SOURCE_CLIENT':
            return APISourceType.SOURCE_CLIENT;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return APISourceType.UNRECOGNIZED;
    }
}

export function aPISourceTypeToJSON(object: APISourceType): string {
    switch (object) {
        case APISourceType.SOURCE_BOTH:
            return 'SOURCE_BOTH';
        case APISourceType.SOURCE_SERVER:
            return 'SOURCE_SERVER';
        case APISourceType.SOURCE_CLIENT:
            return 'SOURCE_CLIENT';
        default:
            return 'UNKNOWN';
    }
}

export interface voidMessage {}

const basevoidMessage: object = {};

export const voidMessage = {
    encode(_: voidMessage, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): voidMessage {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...basevoidMessage } as voidMessage;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): voidMessage {
        const message = { ...basevoidMessage } as voidMessage;
        return message;
    },

    toJSON(_: voidMessage): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<voidMessage>): voidMessage {
        const message = { ...basevoidMessage } as voidMessage;
        return message;
    },
};

type Builtin = Date | Function | Uint8Array | string | number | undefined;
export type DeepPartial<T> = T extends Builtin
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T extends {}
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : Partial<T>;
