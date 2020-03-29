import {BaseComponent} from './base';
import {SensorState} from './states';
import {ApiTypes} from '../api/apiTypes';

export class SensorComponent extends BaseComponent<SensorState> {

    public get value(): number {
        return this.state.getValue()?.value ?? -1;
    }

    protected getType(): ApiTypes {
        return ApiTypes.SENSOR;
    }

}
