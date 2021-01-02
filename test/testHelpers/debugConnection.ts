import { CommandInterface } from '../../src/components/commandInterface';
import { MessageTypes } from '../../src/api/requestResponseMatching';

export class DebugConnection implements CommandInterface {
    public calls: [MessageTypes, Uint8Array][] = [];

    sendEspMessage(type: MessageTypes, data: Uint8Array): void {
        this.calls.push([type, data]);
    }
}
