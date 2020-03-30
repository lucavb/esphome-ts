import {Rgb} from './states';
import {ApiTypes} from '../api/apiTypes';
import {jsonCopy} from '../util';
import {Light} from './light';

export class RgbLight extends Light {

    protected getType(): ApiTypes {
        return ApiTypes.LIGHT;
    }

    public getRgb(): Rgb | undefined {
        return this.state.getValue()?.color;
    }

    public setRgb(rgb: Partial<Rgb>) {
        const rgbCopy: Rgb = Object.assign(jsonCopy(this.state.getValue()?.color ?? {}), rgb);
        this.device.turnOn(this.apiType, this.id, rgbCopy).subscribe();
    }

}
