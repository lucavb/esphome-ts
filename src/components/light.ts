import { ComponentType, LightEntity } from './entities';
import { LightStateEvent } from './states';
import { convertNumbers } from './helpers';
import { BaseComponent } from './base';
import { hsv as hsvConvert, rgb as rgbConvert } from 'color-convert';
import { Hsv, Rgb } from './interfaces';
import { LightCommandRequest } from '../api/protobuf/api';
import { MessageTypes } from '../api';

export const DEFAULT_NO_EFFECT = 'None';

export class LightComponent extends BaseComponent<LightEntity, LightStateEvent> {
    public turnOn(): void {
        this.queueCommand(MessageTypes.LightCommandRequest, () =>
            LightCommandRequest.encode(this.generateState(1)).finish(),
        );
    }

    public turnOff(): void {
        this.queueCommand(MessageTypes.LightCommandRequest, () =>
            LightCommandRequest.encode(this.generateState(0, false)).finish(),
        );
    }

    public getBrightness(): number | undefined {
        const state = this.state.getValue();
        if (state?.brightness === undefined || !this.listEntity.supportsBrightness) {
            return undefined;
        } else if (this.listEntity.supportsRgb) {
            return this.hsv.value;
        } else if (this.listEntity.supportsBrightness) {
            return convertNumbers(state.brightness, 100, true);
        }
    }

    public setBrightness(brightness: number): void {
        if (this.listEntity.supportsRgb) {
            const { hue, saturation } = this.hsv;
            this.hsv = {
                hue,
                saturation,
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
        const state = this.state.getValue();
        if (!state || !this.supportsRgb) {
            return {
                hue: 0,
                saturation: 0,
                value: 0,
            };
        }
        const [hue, saturation] = rgbConvert.hsv([state.red ?? 0, state.green ?? 0, state.blue ?? 0]);
        return {
            hue,
            saturation,
            value: (state.brightness ?? 0) * 100,
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
        this.queueCommand(MessageTypes.LightCommandRequest, () =>
            LightCommandRequest.encode(Object.assign(this.generateState(1), newState)).finish(),
        );
    }

    public get rgb(): Rgb {
        if (!this.listEntity.supportsRgb) {
            return {
                red: 0,
                green: 0,
                blue: 0,
            };
        }
        const { hue, saturation, value } = this.hsv;
        const [red, green, blue] = hsvConvert.rgb([hue, saturation, value]);
        return {
            red,
            green,
            blue,
        };
    }

    public set rgb({ red, green, blue }: Rgb) {
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

    public availableEffects(): string[] {
        return this.listEntity.effects ?? [];
    }

    public get effect(): string {
        const state = this.state.getValue();
        return state?.effect ?? DEFAULT_NO_EFFECT;
    }

    public set effect(effect: string) {
        const effects = this.listEntity.effects ?? [];
        if (effects.includes(effect)) {
            this.queueCommand(MessageTypes.LightCommandRequest, () => {
                const command = this.generateState(1, true);
                command.effect = effect;
                command.hasRgb = false;
                command.hasEffect = true;
                return LightCommandRequest.encode(command).finish();
            });
        }
    }

    private generateState(num: number, turnOn = true): LightCommandRequest {
        const state = this.state.getValue();
        return {
            blue: state?.blue ?? num,
            brightness: state?.brightness ?? num,
            colorTemperature: 0,
            effect: '',
            flashLength: 0,
            green: state?.green ?? num,
            hasBrightness: this.listEntity.supportsBrightness,
            hasColorTemperature: false,
            hasEffect: false,
            hasFlashLength: false,
            hasRgb: this.listEntity.supportsRgb,
            hasState: true,
            hasTransitionLength: false,
            hasWhite: false,
            red: state?.red ?? num,
            transitionLength: 1,
            white: 0,
            key: this.key,
            state: turnOn,
        };
    }
}
