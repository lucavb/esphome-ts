import { BaseComponent } from './base';
import { type BinarySensorEntity, type ComponentType } from './entities';
import { type BinarySensorStateEvent } from './states';
import { BinarySensorTypes } from './binarySensorTypes';

export class BinarySensorComponent extends BaseComponent<BinarySensorEntity, BinarySensorStateEvent> {
    public get deviceClass(): BinarySensorTypes {
        return (this.listEntity.deviceClass as BinarySensorTypes) ?? BinarySensorTypes.NONE;
    }

    get status(): boolean {
        const state = this.state.getValue();
        return !!state?.state;
    }

    public get type(): ComponentType {
        return 'binarySensor';
    }
}
