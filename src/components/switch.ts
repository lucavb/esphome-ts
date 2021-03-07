import { BaseComponent } from './base';
import { ComponentType, ListEntity } from './entities';
import { SwitchStateEvent } from './states';
import { MessageTypes } from '../api';
import { SwitchCommandRequest } from '../api/protobuf/api';

export class SwitchComponent extends BaseComponent<ListEntity, SwitchStateEvent> {
    get status(): boolean {
        const state = this.state.getValue();
        return !!state?.state;
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
