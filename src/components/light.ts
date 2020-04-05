import {ComponentType, LightEntity} from './entities';
import {LightStateEvent} from './states';
import {convertNumbers} from './helpers';
import {MessageTypes} from '../native_api/requestResponseMatching';
import {LightCommandRequest} from '../api/protobuf/api';
import {BaseComponent} from './base';
import {rgb as rgbConvert, hsv as hsvConvert} from 'color-convert';
import {Hsv, Rgb} from './interfaces';

export class LightComponent extends BaseComponent<LightEntity, LightStateEvent> {

    public turnOn(): void {
        this.commandInterface.send(MessageTypes.LightCommandRequest, LightCommandRequest.encode(this.generateState(1)).finish());
    }

    public turnOff(): void {
        this.commandInterface.send(MessageTypes.LightCommandRequest, LightCommandRequest.encode(this.generateState(0, false)).finish());
    }

    public getBrightness(): number | undefined {
        if (this.state?.brightness === undefined || !this.listEntity.supportsBrightness) {
            return undefined;
        } else {
            return convertNumbers(this.state.brightness, true);
        }
    }

    public setBrightness(brightness: number): void {
        if (!this.listEntity.supportsBrightness) {
            return;
        }
        const bright = convertNumbers(brightness, false);
        const prepareState = this.generateState(1);
        prepareState.brightness = bright;
        this.commandInterface.send(MessageTypes.LightCommandRequest, LightCommandRequest.encode(prepareState).finish());
    }

    public get hsv(): Hsv {
        const rgbState = this.rgb;
        if (!rgbState) {
            return {
                hue: 0,
                saturation: 0,
                value: 0,
            };
        }
        const [hue, saturation, value] = rgbConvert.hsv([rgbState.red, rgbState.green, rgbState.blue]);
        const brightness = this.getBrightness();
        return {
            hue,
            saturation,
            value: brightness ?? value,
        };
    }

    public set hsv(hsv: Hsv) {
        if (!this.listEntity.supportsRgb) {
            return;
        }
        const [red, green, blue] = hsvConvert.rgb([hsv.hue, hsv.saturation, 100]);
        const newState = {
            red: convertNumbers(red, false),
            green: convertNumbers(green, false),
            blue: convertNumbers(blue, false),
            brightness: convertNumbers(hsv.value, false),
        };
        this.commandInterface.send(MessageTypes.LightCommandRequest, LightCommandRequest.encode(
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
        return {
            red: convertNumbers(this.state?.red ?? 0, true),
            green: convertNumbers(this.state?.green ?? 0, true),
            blue: convertNumbers(this.state?.blue ?? 0, true),
        };
    }

    public set rgb({red, green, blue}: Rgb) {
        if (!this.listEntity.supportsRgb) {
            return;
        }
        const rgb = {
            red: convertNumbers(red, false),
            green: convertNumbers(green, false),
            blue: convertNumbers(blue, false),
        };
        this.commandInterface.send(MessageTypes.LightCommandRequest, LightCommandRequest.encode(
            Object.assign(this.generateState(1), rgb)).finish());
    }

    public get getType(): ComponentType {
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
