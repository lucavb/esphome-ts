import { type MessageTypes } from '../api/requestResponseMatching';

export interface CommandInterface {
    sendEspMessage(type: MessageTypes, data: Uint8Array): void;
}

/** Command sink for read-only components (sensor, binary sensor). */
export const emptyCommandInterface: CommandInterface = {
    sendEspMessage: () => undefined,
};
