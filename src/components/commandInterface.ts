import {MessageTypes} from '../native_api/requestResponseMatching';

export interface CommandInterface {
    send(type: MessageTypes, data: Uint8Array): void;
}
