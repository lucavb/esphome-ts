import { type ComponentType, type LightEntity } from './entities';
import { type LightStateEvent } from './states';
import { convertNumbers } from './helpers';
import { BaseComponent } from './base';
import convert from 'color-convert';

const hsvConvert = convert.hsv;
const rgbConvert = convert.rgb;
import { type Hsv, type Rgb } from './interfaces';
import { type CommandInterface } from './commandInterface';
import { ColorMode, LightCommandRequest } from '../api/protobuf/api';
import { MessageTypes } from '../api/requestResponseMatching';
import { type Observable, takeUntil } from 'rxjs';
import {
    ColorCapability,
    colorTemperatureToColdWarmWhite,
    isKnownColorMode,
    leastComplexMode,
    legacyColorModes,
    modeSupportsCapability,
    modesWithCapability,
} from './lightColorModes';

export const DEFAULT_NO_EFFECT = 'None';

const clampPercent = (value: number): number => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0);
const toProtocolLevel = (value: number): number => convertNumbers(clampPercent(value), 100, false);

export class LightComponent extends BaseComponent<LightEntity, LightStateEvent> {
    /**
     * Mode switch requested through `setColorMode` and not yet confirmed by a
     * state report. It is published when the command is actually sent, so a
     * command queued ahead of the switch does not see it. The command queue can
     * flush a mode switch and a later command in the same release, so a
     * color-brightness write must consult this instead of the stale reported
     * mode.
     */
    private pendingColorMode: ColorMode | undefined;

    constructor(listEntity: LightEntity, state: Observable<LightStateEvent>, commandInterface: CommandInterface) {
        super(listEntity, state, commandInterface);
        this.state$.pipe(takeUntil(this.teardown)).subscribe((state) => {
            if (this.pendingColorMode === undefined) {
                return;
            }
            // A frame arriving after the command went out can still predate the
            // device applying it (transitions, another controller), so only a
            // frame reporting the requested mode confirms the switch. A genuine
            // refusal leaves the request pending, which suppresses
            // color-brightness writes until the next setColorMode.
            if (state.colorMode === this.pendingColorMode) {
                this.pendingColorMode = undefined;
            }
        });
    }

    public turnOn(): void {
        this.sendCommand(() => {
            const command = this.emptyCommand();
            command.hasState = true;
            command.state = true;
            if (!this.supportsColorMode) {
                // Firmware without color modes expects the channel values again;
                // keep the legacy payload byte-identical. Color-mode firmware
                // keeps its active mode across on/off, so re-sending one here
                // would only risk overriding a newer mode reported by another
                // controller.
                this.applyStoredChannels(command, 1);
            }
            return command;
        });
    }

    public turnOff(): void {
        this.sendCommand(() => {
            const command = this.emptyCommand();
            command.hasState = true;
            command.state = false;
            if (!this.supportsColorMode) {
                // Firmware without color modes expects the channel values again;
                // keep the legacy payload byte-identical.
                this.applyStoredChannels(command, 0);
            }
            return command;
        });
    }

    public getBrightness(): number | undefined {
        const state = this.state.getValue();
        if (state?.brightness === undefined || !this.supportsBrightness) {
            return undefined;
        } else if (this.supportsRgb) {
            return this.hsv.value;
        } else if (this.supportsBrightness) {
            return convertNumbers(state.brightness, 100, true);
        }
    }

    public setBrightness(brightness: number): void {
        if (this.supportsColorMode) {
            if (!this.supportsBrightness) {
                // ON_OFF-only lights have no brightness to set; a command would
                // only toggle them.
                return;
            }
            const command = this.emptyCommand();
            command.hasState = true;
            const level = toProtocolLevel(brightness);
            if (level === 0) {
                // Zero (or non-finite) brightness means off; do not store it as
                // an on-but-dark value the next turn-on would inherit.
                command.state = false;
            } else {
                command.state = true;
                command.hasBrightness = true;
                command.brightness = level;
            }
            this.send(command);
            return;
        }
        if (this.listEntity.supportsRgb) {
            const { hue, saturation } = this.hsv;
            this.hsv = {
                hue,
                saturation,
                value: brightness,
            };
        } else if (this.listEntity.supportsBrightness) {
            const command = this.emptyCommand();
            command.hasState = true;
            command.state = true;
            command.hasBrightness = true;
            command.brightness = toProtocolLevel(brightness);
            this.send(command);
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
        if (!this.supportsRgb) {
            return;
        }
        const [red, green, blue] = hsvConvert.rgb([hsv.hue, hsv.saturation, 100]);
        const command = this.emptyCommand();
        const brightness = toProtocolLevel(hsv.value);
        if (this.supportsColorMode && brightness === 0) {
            // A black color is an off light on firmware with color modes; keep
            // it out of the on-but-dark state setBrightness(0) also avoids.
            command.hasState = true;
            command.state = false;
            this.send(command);
            return;
        }
        command.hasState = true;
        command.state = true;
        command.hasBrightness = this.supportsBrightness;
        command.brightness = brightness;
        if (this.supportsColorMode) {
            const colorMode = leastComplexMode(modesWithCapability(this.supportedColorModes, ColorCapability.RGB));
            if (colorMode === undefined) {
                return;
            }
            command.hasColorMode = true;
            command.colorMode = colorMode;
            // The RGB channels carry the full color; the master brightness is
            // the only level control this setter uses.
            command.hasColorBrightness = true;
            command.colorBrightness = 1;
        }
        command.hasRgb = true;
        command.red = convertNumbers(red, 255, false);
        command.green = convertNumbers(green, 255, false);
        command.blue = convertNumbers(blue, 255, false);
        this.send(command);
    }

    public get rgb(): Rgb {
        if (!this.supportsRgb) {
            return {
                red: 0,
                green: 0,
                blue: 0,
            };
        }
        const { hue, saturation } = this.hsv;
        const state = this.state.getValue();
        // The wire carries the normalized color; the visual color includes both
        // the master brightness and the color brightness. Firmware without
        // color modes does not report color brightness, and its decoded state
        // carries the protobuf default of 0, so only fold it in when the device
        // actually advertises color modes.
        const colorBrightness = this.supportsColorMode ? (state?.colorBrightness ?? 1) : 1;
        const value = (state?.brightness ?? 0) * colorBrightness * 100;
        const [red, green, blue] = hsvConvert.rgb([hue, saturation, value]);
        return {
            red,
            green,
            blue,
        };
    }

    public set rgb({ red, green, blue }: Rgb) {
        if (!this.supportsRgb) {
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
        return this.modesKnown()
            ? modesWithCapability(this.supportedColorModes, ColorCapability.RGB).length > 0
            : this.listEntity.supportsRgb;
    }

    public get supportsBrightness(): boolean {
        return this.modesKnown()
            ? modesWithCapability(this.supportedColorModes, ColorCapability.BRIGHTNESS).length > 0
            : this.listEntity.supportsBrightness;
    }

    /**
     * True when the device advertises color modes, which also means it accepts
     * has_color_mode on commands and reports the active mode in its state.
     *
     * This is deliberately payload-driven rather than an ApiVersion check like
     * the cover/fan components: the advertised modes are per-entity truth, and
     * firmware 2025.8+ stopped sending the legacy capability booleans, so the
     * entity payload is the only reliable signal.
     */
    public get supportsColorMode(): boolean {
        return this.modesKnown();
    }

    /**
     * Supported modes, derived from the legacy capability flags when the
     * firmware predates color modes.
     */
    public get supportedColorModes(): ColorMode[] {
        const modes = this.listEntity.supportedColorModes ?? [];
        if (modes.length > 0) {
            return modes.filter(isKnownColorMode);
        }
        return legacyColorModes({
            supportsBrightness: this.listEntity.supportsBrightness,
            supportsRgb: this.listEntity.supportsRgb,
            supportsWhiteValue: this.listEntity.supportsWhiteValue ?? false,
            supportsColorTemperature: this.listEntity.supportsColorTemperature ?? false,
        });
    }

    /**
     * True when a supported mode has the single white-channel capability
     * (`COLOR_MODE_WHITE` or `COLOR_MODE_RGB_WHITE`). Cold/warm-white lights
     * report `false`: their white output is driven through `colorTemperature`
     * or `setColdWarmWhite`, and `supportsColorTemperature` is the getter that
     * stays true.
     */
    public get supportsWhiteValue(): boolean {
        return this.modesKnown()
            ? modesWithCapability(this.supportedColorModes, ColorCapability.WHITE).length > 0
            : (this.listEntity.supportsWhiteValue ?? false);
    }

    public get supportsColorTemperature(): boolean {
        if (!this.modesKnown()) {
            return this.listEntity.supportsColorTemperature ?? false;
        }
        return (
            modesWithCapability(this.supportedColorModes, ColorCapability.COLOR_TEMPERATURE).length > 0 ||
            modesWithCapability(this.supportedColorModes, ColorCapability.COLD_WARM_WHITE).length > 0
        );
    }

    public get minMireds(): number {
        return this.listEntity.minMireds ?? 0;
    }

    public get maxMireds(): number {
        return this.listEntity.maxMireds ?? 0;
    }

    /** The mode the firmware reports, or undefined when it predates modes. */
    public get colorMode(): ColorMode | undefined {
        if (!this.supportsColorMode) {
            return undefined;
        }
        const colorMode = this.state.getValue()?.colorMode;
        if (colorMode === undefined || colorMode === ColorMode.COLOR_MODE_UNKNOWN || !isKnownColorMode(colorMode)) {
            return undefined;
        }
        return colorMode;
    }

    /** White channel level, 0..100. Only meaningful for WHITE-capable modes. */
    public get white(): number | undefined {
        const state = this.state.getValue();
        if (state?.white === undefined || !this.supportsWhiteValue) {
            return undefined;
        }
        return convertNumbers(state.white, 100, true);
    }

    public set white(white: number) {
        if (!Number.isFinite(white)) {
            return;
        }
        const colorMode = leastComplexMode(modesWithCapability(this.supportedColorModes, ColorCapability.WHITE));
        if (!this.supportsColorMode || colorMode === undefined) {
            return;
        }
        const command = this.emptyCommand();
        command.hasState = true;
        const level = toProtocolLevel(white);
        if (level === 0 && !modeSupportsCapability(colorMode, ColorCapability.RGB)) {
            command.state = false;
            this.send(command);
            return;
        }
        command.state = true;
        command.hasColorMode = true;
        command.colorMode = colorMode;
        command.hasWhite = true;
        command.white = level;
        this.send(command);
    }

    /**
     * Color temperature in mireds. Firmware that reports a mired range receives
     * the temperature directly; cold/warm-white-only lights receive the
     * converted channel levels, using neutral white when the firmware exposes
     * no range (the ESPHome default unless the YAML configures it).
     */
    public get colorTemperature(): number | undefined {
        if (!this.supportsColorTemperature) {
            return undefined;
        }
        const colorTemperature = this.state.getValue()?.colorTemperature;
        // 0 mireds is not a real temperature: firmware leaves the field unset
        // for CWW modes without a configured range.
        return colorTemperature === undefined || colorTemperature <= 0 ? undefined : colorTemperature;
    }

    public set colorTemperature(colorTemperature: number) {
        if (!this.supportsColorMode || !Number.isFinite(colorTemperature)) {
            return;
        }
        const command = this.emptyCommand();
        command.hasState = true;
        command.state = true;
        const colorTemperatureMode = leastComplexMode(
            modesWithCapability(this.supportedColorModes, ColorCapability.COLOR_TEMPERATURE),
        );
        if (colorTemperatureMode !== undefined) {
            command.hasColorMode = true;
            command.colorMode = colorTemperatureMode;
            command.hasColorTemperature = true;
            command.colorTemperature =
                this.maxMireds > this.minMireds
                    ? Math.min(Math.max(colorTemperature, this.minMireds), this.maxMireds)
                    : colorTemperature;
            this.send(command);
            return;
        }
        const coldWarmWhiteMode = leastComplexMode(
            modesWithCapability(this.supportedColorModes, ColorCapability.COLD_WARM_WHITE),
        );
        if (coldWarmWhiteMode === undefined) {
            return;
        }
        const { coldWhite, warmWhite } = colorTemperatureToColdWarmWhite(
            colorTemperature,
            this.minMireds,
            this.maxMireds,
        );
        command.hasColorMode = true;
        command.colorMode = coldWarmWhiteMode;
        command.hasColdWhite = true;
        command.coldWhite = coldWhite;
        command.hasWarmWhite = true;
        command.warmWhite = warmWhite;
        if (this.maxMireds > this.minMireds) {
            // Also store the requested temperature so the getter can report it
            // back; firmware uses the explicit channels when both are present.
            command.hasColorTemperature = true;
            command.colorTemperature = Math.min(Math.max(colorTemperature, this.minMireds), this.maxMireds);
        }
        this.send(command);
    }

    /** Cold white channel level, 0..100. */
    public get coldWhite(): number | undefined {
        const state = this.state.getValue();
        if (state?.coldWhite === undefined || !this.supportsColdWarmWhite) {
            return undefined;
        }
        return convertNumbers(state.coldWhite, 100, true);
    }

    /** Warm white channel level, 0..100. */
    public get warmWhite(): number | undefined {
        const state = this.state.getValue();
        if (state?.warmWhite === undefined || !this.supportsColdWarmWhite) {
            return undefined;
        }
        return convertNumbers(state.warmWhite, 100, true);
    }

    public setColdWarmWhite({ coldWhite, warmWhite }: { coldWhite?: number; warmWhite?: number }): void {
        const colorMode = leastComplexMode(
            modesWithCapability(this.supportedColorModes, ColorCapability.COLD_WARM_WHITE),
        );
        if (!this.supportsColorMode || colorMode === undefined) {
            return;
        }
        const coldLevel =
            coldWhite !== undefined && Number.isFinite(coldWhite) ? toProtocolLevel(coldWhite) : undefined;
        const warmLevel =
            warmWhite !== undefined && Number.isFinite(warmWhite) ? toProtocolLevel(warmWhite) : undefined;
        if (coldLevel === undefined && warmLevel === undefined) {
            return;
        }
        const command = this.emptyCommand();
        command.hasState = true;
        if (coldLevel === 0 && warmLevel === 0 && !modeSupportsCapability(colorMode, ColorCapability.RGB)) {
            // No color channel to fall back on: all-zero white is off.
            command.state = false;
            this.send(command);
            return;
        }
        command.state = true;
        command.hasColorMode = true;
        command.colorMode = colorMode;
        if (coldLevel !== undefined) {
            command.hasColdWhite = true;
            command.coldWhite = coldLevel;
        }
        if (warmLevel !== undefined) {
            command.hasWarmWhite = true;
            command.warmWhite = warmLevel;
        }
        this.send(command);
    }

    /**
     * Color brightness, 0..100. Scales the RGB channels against the master
     * brightness. A modifier for the active RGB mode: it does not change the
     * light's state or mode.
     */
    public get colorBrightness(): number | undefined {
        const state = this.state.getValue();
        if (state?.colorBrightness === undefined || !this.supportsColorMode || !this.supportsRgb) {
            return undefined;
        }
        return convertNumbers(state.colorBrightness, 100, true);
    }

    public set colorBrightness(colorBrightness: number) {
        if (!this.supportsColorMode || !this.supportsRgb || !Number.isFinite(colorBrightness)) {
            return;
        }
        this.sendCommand(() => {
            // A mode switch may be queued ahead of this command and the state
            // still reports the old mode; prefer the requested mode until the
            // device confirms or refutes it.
            const colorMode = this.pendingColorMode ?? this.colorMode;
            if (colorMode === undefined || !modeSupportsCapability(colorMode, ColorCapability.RGB)) {
                // A positive color brightness counts as an RGB request in
                // firmware, which would switch an interlocked light out of its
                // white mode. Re-check at send time: a queued command may run
                // after the device reported a different mode.
                return undefined;
            }
            const command = this.emptyCommand();
            command.hasColorBrightness = true;
            command.colorBrightness = toProtocolLevel(colorBrightness);
            return command;
        });
    }

    /**
     * Switch to a mode without changing its channel values. This is what moves
     * an rgbww light between color and white; firmware keeps the stored
     * channels for the target mode.
     */
    public setColorMode(colorMode: ColorMode): void {
        if (!this.supportsColorMode || colorMode === ColorMode.COLOR_MODE_UNKNOWN) {
            return;
        }
        if (!this.supportedColorModes.includes(colorMode)) {
            return;
        }
        // This is the only mode-changing command whose payload does not pin a
        // target mode; remember it when it actually goes out so a later
        // color-brightness write is not built against the mode the device
        // reported before the switch. Publishing it only at send time also
        // keeps an earlier queued write on the still-active mode.
        const command = this.emptyCommand();
        command.hasColorMode = true;
        command.colorMode = colorMode;
        this.sendCommand(() => {
            this.pendingColorMode = colorMode;
            return command;
        });
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
            this.sendCommand(() => {
                const command = this.emptyCommand();
                command.hasState = true;
                command.state = true;
                if (!this.supportsColorMode && this.supportsBrightness) {
                    // Legacy firmware expects the stored level again; color-mode
                    // firmware keeps its own level, and re-sending a stored 0
                    // would start the effect on but dark.
                    command.hasBrightness = true;
                    command.brightness = this.state.getValue()?.brightness ?? 1;
                }
                command.hasEffect = true;
                command.effect = effect;
                return command;
            });
        }
    }

    private get supportsColdWarmWhite(): boolean {
        return modesWithCapability(this.supportedColorModes, ColorCapability.COLD_WARM_WHITE).length > 0;
    }

    private modesKnown(): boolean {
        return (this.listEntity.supportedColorModes?.length ?? 0) > 0;
    }

    /**
     * Legacy payload: resend the stored channels on turn on/off. Firmware
     * without color modes expects them, and this keeps the historical wire
     * format for those devices.
     */
    private applyStoredChannels(command: LightCommandRequest, fallback: number): void {
        const state = this.state.getValue();
        command.hasBrightness = this.listEntity.supportsBrightness;
        command.brightness = state?.brightness ?? fallback;
        command.hasRgb = this.listEntity.supportsRgb;
        command.red = state?.red ?? fallback;
        command.green = state?.green ?? fallback;
        command.blue = state?.blue ?? fallback;
    }

    private emptyCommand(): LightCommandRequest {
        return {
            key: this.key,
            hasState: false,
            state: false,
            hasBrightness: false,
            brightness: 0,
            hasColorMode: false,
            colorMode: ColorMode.COLOR_MODE_UNKNOWN,
            hasColorBrightness: false,
            colorBrightness: 0,
            hasRgb: false,
            red: 0,
            green: 0,
            blue: 0,
            hasWhite: false,
            white: 0,
            hasColorTemperature: false,
            colorTemperature: 0,
            hasColdWhite: false,
            coldWhite: 0,
            hasWarmWhite: false,
            warmWhite: 0,
            hasTransitionLength: false,
            transitionLength: 1,
            hasFlashLength: false,
            flashLength: 0,
            hasEffect: false,
            effect: '',
        };
    }

    private sendCommand(build: () => LightCommandRequest | undefined): void {
        this.queueCommand(MessageTypes.LightCommandRequest, () => {
            const command = build();
            return command === undefined ? undefined : LightCommandRequest.encode(command).finish();
        });
    }

    private send(command: LightCommandRequest): void {
        this.sendCommand(() => command);
    }
}
