import {LightState} from './states';
import {ApiTypes} from '../api/apiTypes';
import {OnOffComponent} from './onOff';

export class Light extends OnOffComponent<LightState> {

    protected getType(): ApiTypes {
        return ApiTypes.LIGHT;
    }

    public getBrightness(hundredScale: boolean = true): number | undefined {
        if (this.state.getValue()?.brightness === undefined) {
            return undefined;
        } else {
            const brightness = hundredScale ?
                ((this.state.getValue()?.brightness ?? 0) / 255) * 100 :
                this.state.getValue()?.brightness ?? 0;
            return Math.floor(brightness);
        }
    }

    public setBrightness(brightness: number, hundredScale: boolean = true): void {
        let bright = hundredScale ?
            (Math.min(Math.max(0, brightness), 100) / 100) * 255 :
            Math.min(Math.max(0, brightness), 255);
        bright = Math.floor(bright);
        this.device.turnOn(this.apiType, this.id, {brightness: bright}).subscribe();
    }

}
