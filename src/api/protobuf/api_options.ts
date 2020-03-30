/* eslint-disable */
import { Writer, Reader } from 'protobufjs/minimal';


export interface voidMessage {
}

const basevoidMessage: object = {
};

export const APISourceType = {
  SOURCE_BOTH: 0 as APISourceType,
  SOURCE_SERVER: 1 as APISourceType,
  SOURCE_CLIENT: 2 as APISourceType,
  UNRECOGNIZED: -1 as APISourceType,
  fromJSON(object: any): APISourceType {
    switch (object) {
      case 0:
      case "SOURCE_BOTH":
        return APISourceType.SOURCE_BOTH;
      case 1:
      case "SOURCE_SERVER":
        return APISourceType.SOURCE_SERVER;
      case 2:
      case "SOURCE_CLIENT":
        return APISourceType.SOURCE_CLIENT;
      case -1:
      case "UNRECOGNIZED":
      default:
        return APISourceType.UNRECOGNIZED;
    }
  },
  toJSON(object: APISourceType): string {
    switch (object) {
      case APISourceType.SOURCE_BOTH:
        return "SOURCE_BOTH";
      case APISourceType.SOURCE_SERVER:
        return "SOURCE_SERVER";
      case APISourceType.SOURCE_CLIENT:
        return "SOURCE_CLIENT";
      default:
        return "UNKNOWN";
    }
  },
}

export type APISourceType = 0 | 1 | 2 | -1;

export const voidMessage = {
  encode(message: voidMessage, writer: Writer = Writer.create()): Writer {
    return writer;
  },
  decode(reader: Reader, length?: number): voidMessage {
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = Object.create(basevoidMessage) as voidMessage;
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
  fromJSON(object: any): voidMessage {
    const message = Object.create(basevoidMessage) as voidMessage;
    return message;
  },
  fromPartial(object: DeepPartial<voidMessage>): voidMessage {
    const message = Object.create(basevoidMessage) as voidMessage;
    return message;
  },
  toJSON(message: voidMessage): unknown {
    const obj: any = {};
    return obj;
  },
};

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