import { BaseComponent } from './base';
import { ComponentType, FanEntity } from './entities';
import { MessageTypes } from '../api';
import { FanCommandRequest, FanDirection, FanSpeed } from '../api/protobuf/api';
import { FanStateEvent } from './states';

export class FanComponent extends BaseComponent<FanEntity, FanStateEvent> {
    public turnOn(): void {
        this.queueCommand(MessageTypes.FanCommandRequest, () =>
            FanCommandRequest.encode(this.generateState(true)).finish(),
        );
    }

    public turnOff(): void {
        this.queueCommand(MessageTypes.FanCommandRequest, () =>
            FanCommandRequest.encode(this.generateState(false)).finish(),
        );
    }

    public setSpeed(speed: FanSpeed): void {
        if (!this.supportsSpeed) {
            return;
        }

        this.queueCommand(MessageTypes.FanCommandRequest, () =>
            FanCommandRequest.encode({
                ...this.generateState(true),
                speed,
            }).finish(),
        );
    }

    public setDirection(direction: FanDirection): void {
        if (!this.supportsDirection) {
            return;
        }

        this.queueCommand(MessageTypes.FanCommandRequest, () =>
            FanCommandRequest.encode({
                ...this.generateState(true),
                direction,
            }).finish(),
        );
    }

    public get supportsSpeed(): boolean {
        return this.listEntity.supportsSpeed;
    }

    public get supportsDirection(): boolean {
        return this.listEntity.supportsDirection;
    }

    public get type(): ComponentType {
        return 'fan';
    }

    private generateState(turnOn: boolean): FanCommandRequest {
        const state = this.state.getValue();
        return {
            hasState: true,
            direction: state?.direction ?? FanDirection.FAN_DIRECTION_FORWARD,
            state: turnOn,
            key: this.key,
            hasDirection: false,
            hasOscillating: false,
            oscillating: false,
            speed: state?.speed ?? FanSpeed.FAN_SPEED_MEDIUM,
            hasSpeed: true,
        };
    }
}
