import {MessageTypes} from '../api/requestResponseMatching';

export interface CommandInterface {
    send(type: MessageTypes, data: Uint8Array): void;
}
