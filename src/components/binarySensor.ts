import {BaseComponent} from './base';
import {BinarySensorEntity} from './entities';
import {BinarySensorStateEvent} from './states';

export class BinarySensorComponent extends BaseComponent<BinarySensorEntity, BinarySensorStateEvent> {

    get status(): boolean {
        return !!this.state?.state;
    }

}
