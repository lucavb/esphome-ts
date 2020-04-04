import {BaseComponent} from './base';
import {BinarySensorEntity, ComponentType} from './entities';
import {BinarySensorStateEvent} from './states';

export class BinarySensorComponent extends BaseComponent<BinarySensorEntity, BinarySensorStateEvent> {

    get status(): boolean {
        return !!this.state?.state;
    }

    public get getType(): ComponentType {
        return 'binarySensor';
    }

}
