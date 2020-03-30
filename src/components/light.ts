import {LightState} from './states';
import {ApiTypes} from '../api/apiTypes';
import {OnOffComponent} from './onOff';

export class Light extends OnOffComponent<LightState> {

    protected getType(): ApiTypes {
        return ApiTypes.LIGHT;
    }

    public getBrightness(): number | undefined {
        return this.state.getValue()?.brightness;
    }

    public setBrightness(brightness: number): void {
        this.device.turnOn(this.apiType, this.id, {brightness});
    }

}
