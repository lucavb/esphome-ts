import { type MessageTypes } from '../api/requestResponseMatching';

export interface CommandInterface {
    sendEspMessage(type: MessageTypes, data: Uint8Array): void;
}
