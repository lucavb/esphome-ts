import { BaseComponent } from './base';
import { MessageTypes } from '../api/requestResponseMatching';
import { SwitchCommandRequest } from '../api/protobuf/api';
import { ComponentType, ListEntity } from './entities';
import { SwitchStateEvent } from './states';

export class SwitchComponent extends BaseComponent<
    ListEntity,
    SwitchStateEvent
> {
    get status(): boolean {
        return !!this.state?.state;
    }

    public turnOn(): void {
        this.queueCommand(
            MessageTypes.SwitchCommandRequest,
            () =>
                SwitchCommandRequest.encode({
                    state: true,
                    key: this.key,
                }).finish(),
            true,
        );
    }

    public turnOff(): void {
        this.queueCommand(
            MessageTypes.SwitchCommandRequest,
            () =>
                SwitchCommandRequest.encode({
                    state: false,
                    key: this.key,
                }).finish(),
            true,
        );
    }

    public get type(): ComponentType {
        return 'switch';
    }
}
