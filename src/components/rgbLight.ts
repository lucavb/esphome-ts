import {LightState, Rgb} from './states';
import {ApiTypes} from '../api/apiTypes';
import {OnOffComponent} from './onOff';
import {jsonCopy} from '../util';

export class RgbLight extends OnOffComponent<LightState> {

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
