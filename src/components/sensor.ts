import {BaseComponent} from './base';
import {ComponentType, SensorEntity} from './entities';
import {SensorStateEvent} from './states';

export class SensorComponent extends BaseComponent<SensorEntity, SensorStateEvent> {

    public get value(): number | undefined {
        return this.state?.state;
    }

    public get getType(): ComponentType {
        return 'sensor';
    }

}
