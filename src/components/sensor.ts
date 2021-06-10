import { BaseComponent } from './base';
import { ComponentType, SensorEntity } from './entities';
import { SensorStateEvent } from './states';

export class SensorComponent extends BaseComponent<SensorEntity, SensorStateEvent> {
    public get value(): number | undefined {
        const state = this.state.getValue();
        return state?.state;
    }

    public get type(): ComponentType {
        return 'sensor';
    }

    public get deviceClass(): string | undefined {
        return this.listEntity.deviceClass;
    }

    public get unitOfMeasurement(): string {
        return this.listEntity.unitOfMeasurement;
    }

    public get icon(): string {
        return this.listEntity.icon;
    }
}
