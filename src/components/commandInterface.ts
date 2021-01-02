import { MessageTypes } from '../api';

export interface CommandInterface {
    sendEspMessage(type: MessageTypes, data: Uint8Array): void;
}
