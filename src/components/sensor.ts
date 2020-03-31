import {BaseComponent} from './base';
import {SensorEntity} from './entities';
import {SensorStateEvent} from './states';

export class SensorComponent extends BaseComponent<SensorEntity, SensorStateEvent> {

    public get value(): number | undefined {
        return this.state?.state;
    }

}
