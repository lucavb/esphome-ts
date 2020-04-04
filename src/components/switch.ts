import {BaseComponent} from './base';
import {MessageTypes} from '../native_api/requestResponseMatching';
import {SwitchCommandRequest} from '../api/protobuf/api';
import {ComponentType} from "./entities";

export class SwitchComponent extends BaseComponent {

    public turnOn(): void {
        this.commandInterface.send(MessageTypes.SwitchCommandRequest, SwitchCommandRequest.encode({
            state: true,
            key: this.key,
        }).finish());
    }

    public turnOff(): void {
        this.commandInterface.send(MessageTypes.SwitchCommandRequest, SwitchCommandRequest.encode({
            state: false,
            key: this.key,
        }).finish());
    }

    public get getType(): ComponentType {
        return 'switch';
    }

}
