import {ComponentType, LightEntity} from './entities';
import {LightStateEvent} from './states';
import {convertNumbers} from './helpers';
import {MessageTypes} from '../api/requestResponseMatching';
import {LightCommandRequest} from '../api/protobuf/api';
import {BaseComponent} from './base';
import {hsv as hsvConvert, rgb as rgbConvert} from 'color-convert';
import {Hsv, Rgb} from './interfaces';

export class LightComponent extends BaseComponent<LightEntity, LightStateEvent> {

    public turnOn(): void {
        this.queueCommand(MessageTypes.LightCommandRequest, () => LightCommandRequest
            .encode(this.generateState(1)).finish());
    }

    public turnOff(): void {
        this.queueCommand(MessageTypes.LightCommandRequest, () => LightCommandRequest
            .encode(this.generateState(0, false)).finish());
    }

    public getBrightness(): number | undefined {
        if (this.state?.brightness === undefined || !this.listEntity.supportsBrightness) {
            return undefined;
        } else if (this.listEntity.supportsRgb) {
            return this.hsv.value;
        } else if (this.listEntity.supportsBrightness) {
            return convertNumbers(this.state.brightness, 100, true);
        }
    }

    public setBrightness(brightness: number): void {

        if (this.listEntity.supportsRgb) {
            const {hue, saturation} = this.hsv;
            this.hsv = {
                hue, saturation,
                value: brightness,
            };
        } else if (this.listEntity.supportsBrightness) {
            const bright = convertNumbers(brightness, 100, false);
            const state = this.generateState(1);
            state.brightness = bright;
            this.queueCommand(MessageTypes.LightCommandRequest, () => LightCommandRequest.encode(state).finish());
        }
    }

    public get hsv(): Hsv {
        if (!this.state || !this.supportsRgb) {
            return {
                hue: 0,
                saturation: 0,
                value: 0,
            };
        }
        const [hue, saturation] = rgbConvert.hsv([this.state.red ?? 0, this.state.green ?? 0, this.state.blue ?? 0]);
        return {
            hue,
            saturation,
            value: (this.state?.brightness ?? 0) * 100,
        };
    }

    public set hsv(hsv: Hsv) {
        if (!this.listEntity.supportsRgb) {
            return;
        }
        const [red, green, blue] = hsvConvert.rgb([hsv.hue, hsv.saturation, 100]);
        const newState = {
            red: convertNumbers(red, 255, false),
            green: convertNumbers(green, 255, false),
            blue: convertNumbers(blue, 255, false),
            brightness: convertNumbers(hsv.value, 100, false),
        };
        this.queueCommand(MessageTypes.LightCommandRequest, () => LightCommandRequest.encode(
            Object.assign(this.generateState(1), newState)).finish());
    }

    public get rgb(): Rgb {
        if (!this.listEntity.supportsRgb) {
            return {
                red: 0,
                green: 0,
                blue: 0,
            };
        }
        const {hue, saturation, value} = this.hsv;
        const [red, green, blue] = hsvConvert.rgb([hue, saturation, value]);
        return {
            red,
            green,
            blue,
        };
    }

    public set rgb({red, green, blue}: Rgb) {
        if (!this.listEntity.supportsRgb) {
            return;
        }
        const [hue, saturation, value] = rgbConvert.hsv([red, green, blue]);
        this.hsv = {
            hue,
            saturation,
            value,
        };
    }

    public get type(): ComponentType {
        return 'light';
    }

    public get supportsRgb(): boolean {
        return this.listEntity.supportsRgb;
    }

    public get supportsBrightness(): boolean {
        return this.listEntity.supportsBrightness;
    }

    private generateState(num: number, turnOn: boolean = true): LightCommandRequest {
        return {
            blue: this.state?.blue ?? num,
            brightness: this.state?.brightness ?? num,
            colorTemperature: 0,
            effect: '',
            flashLength: 0,
            green: this.state?.blue ?? num,
            hasBrightness: this.listEntity.supportsBrightness,
            hasColorTemperature: false,
            hasEffect: false,
            hasFlashLength: false,
            hasRgb: this.listEntity.supportsRgb,
            hasState: true,
            hasTransitionLength: false,
            hasWhite: false,
            red: this.state?.red ?? num,
            transitionLength: 1,
            white: 0,
            key: this.key,
            state: turnOn,
        };
    }

}
