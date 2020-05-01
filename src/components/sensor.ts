import {BaseComponent} from './base';
import {ComponentType, SensorEntity} from './entities';
import {SensorStateEvent} from './states';

export class SensorComponent extends BaseComponent<SensorEntity, SensorStateEvent> {

    public get value(): number | undefined {
        return this.state?.state;
    }

    public get type(): ComponentType {
        return 'sensor';
    }

    public get unitOfMeasurement(): string {
        return this.listEntity.unitOfMeasurement;
    }

    public get icon(): string {
        return this.listEntity.icon;
    }

}
