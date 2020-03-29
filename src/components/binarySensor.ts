import {BaseComponent} from './base';
import {BinarySensor} from './states';
import {ApiTypes} from '../api/apiTypes';

export class BinarySensorComponent extends BaseComponent<BinarySensor> {

    public get value(): boolean {
        return this.state.getValue()?.value ?? false;
    }

    protected getType(): ApiTypes {
        return ApiTypes.BINARY_SENSOR;
    }

}
