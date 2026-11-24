import { BaseComponent } from './base';
import { type ComponentType, type FanEntity } from './entities';
import { type FanStateEvent } from './states';
import { type CommandInterface } from './commandInterface';
import { type ApiVersion } from './cover';
import { type Observable } from 'rxjs';
import { MessageTypes } from '../api/requestResponseMatching';
import { FanCommandRequest, FanDirection, FanSpeed } from '../api/protobuf/api';

const DEFAULT_API_VERSION: ApiVersion = { major: 1, minor: 8 };
// Firmware before API 1.4 only understands the three-valued FanSpeed enum and
// has no supported_speed_count field, so the legacy path always has three
// levels. Firmware 1.4/1.5 reports both speed forms; 1.6+ reports speed_level.
const LEGACY_SPEED_COUNT = 3;

export class FanComponent extends BaseComponent<FanEntity, FanStateEvent> {
    constructor(
        listEntity: FanEntity,
        state: Observable<FanStateEvent>,
        commandInterface: CommandInterface,
        private readonly apiVersion: ApiVersion = DEFAULT_API_VERSION,
    ) {
        super(listEntity, state, commandInterface);
    }

    public get status(): boolean {
        return !!this.state.getValue()?.state;
    }

    public get type(): ComponentType {
        return 'fan';
    }

    public get supportsSpeed(): boolean {
        return this.listEntity.supportsSpeed && this.speedCount > 0;
    }

    public get supportsOscillation(): boolean {
        return this.listEntity.supportsOscillation;
    }

    public get supportsDirection(): boolean {
        return this.listEntity.supportsDirection;
    }

    /**
     * Number of discrete speed levels, or 0 when the fan has no speed
     * control. Older firmware omits the count; the legacy FanSpeed enum
     * always described three levels.
     */
    public get speedCount(): number {
        if (!this.listEntity.supportsSpeed) {
            return 0;
        }
        return this.usesLegacySpeed ? LEGACY_SPEED_COUNT : Math.max(0, this.listEntity.supportedSpeedCount);
    }

    /**
     * Current speed level in the 1..speedCount range. 0 means no level has
     * been reported yet; ESPHome retains the last level while the fan is off,
     * so pair this with {@link status}. Undefined means no speed information
     * is available (unsupported fan, no state yet, or an invalid wire value).
     */
    public get speedLevel(): number | undefined {
        if (!this.supportsSpeed) {
            return undefined;
        }
        const state = this.state.getValue();
        if (!state) {
            return undefined;
        }
        if (this.usesLegacySpeed) {
            if (
                state.speed === undefined ||
                state.speed < FanSpeed.FAN_SPEED_LOW ||
                state.speed > FanSpeed.FAN_SPEED_HIGH
            ) {
                return undefined;
            }
            return state.speed + 1;
        }
        const level = state.speedLevel;
        if (level === undefined || !Number.isFinite(level) || level < 0) {
            return undefined;
        }
        return Math.min(level, this.speedCount);
    }

    /** Current speed as an integer percentage in the 0..100 range. */
    public get speedPercentage(): number | undefined {
        const level = this.speedLevel;
        if (level === undefined || this.speedCount === 0) {
            return undefined;
        }
        return Math.floor((level * 100) / this.speedCount);
    }

    public get oscillating(): boolean | undefined {
        return this.supportsOscillation ? this.state.getValue()?.oscillating : undefined;
    }

    public get direction(): FanDirection | undefined {
        if (!this.supportsDirection) {
            return undefined;
        }
        const direction = this.state.getValue()?.direction;
        return direction === FanDirection.FAN_DIRECTION_FORWARD || direction === FanDirection.FAN_DIRECTION_REVERSE
            ? direction
            : undefined;
    }

    /** Active preset mode, or the empty string when none is active. */
    public get presetMode(): string {
        return this.state.getValue()?.presetMode ?? '';
    }

    public get supportedPresetModes(): string[] {
        return this.listEntity.supportedPresetModes ?? [];
    }

    public turnOn(): void {
        this.sendCommand({ hasState: true, state: true });
    }

    public turnOff(): void {
        // Speed and preset stay untouched: switching a fan off must not throw
        // away the setting it should resume with.
        this.sendCommand({ hasState: true, state: false });
    }

    /** Set a discrete speed level in the 1..speedCount range; 0 turns the fan off. */
    public setSpeedLevel(level: number): void {
        if (!this.supportsSpeed || this.speedCount === 0 || !Number.isFinite(level)) {
            return;
        }
        if (level <= 0) {
            this.turnOff();
            return;
        }

        // Levels are discrete: rounding is intentional here. setSpeedPercentage
        // uses ceil instead to match Home Assistant's percentage mapping.
        const clamped = Math.min(Math.max(Math.round(level), 1), this.speedCount);
        if (this.usesLegacySpeed) {
            this.sendCommand({
                hasState: true,
                state: true,
                hasSpeed: true,
                speed: this.legacySpeedForLevel(clamped),
            });
            return;
        }
        this.sendCommand({ hasState: true, state: true, hasSpeedLevel: true, speedLevel: clamped });
    }

    /** Set speed as a percentage in the 0..100 range; 0 turns the fan off. */
    public setSpeedPercentage(percentage: number): void {
        if (!this.supportsSpeed || this.speedCount === 0 || !Number.isFinite(percentage)) {
            return;
        }
        const clamped = Math.min(Math.max(percentage, 0), 100);
        if (clamped === 0) {
            this.turnOff();
            return;
        }
        // Mirrors Home Assistant's percentage -> speed level rounding: the
        // lowest reachable level is 1, the highest is speedCount.
        const level = Math.ceil((clamped * this.speedCount) / 100);
        this.setSpeedLevel(level);
    }

    public setOscillating(oscillating: boolean): void {
        if (!this.supportsOscillation) {
            return;
        }
        this.sendCommand({ hasOscillating: true, oscillating });
    }

    public setDirection(direction: FanDirection): void {
        if (
            !this.supportsDirection ||
            (direction !== FanDirection.FAN_DIRECTION_FORWARD && direction !== FanDirection.FAN_DIRECTION_REVERSE)
        ) {
            return;
        }
        this.sendCommand({ hasDirection: true, direction });
    }

    /**
     * Select one of {@link supportedPresetModes}; pass the empty string to
     * clear the active preset. Other unsupported values are ignored.
     */
    public setPresetMode(presetMode: string): void {
        if (this.supportedPresetModes.length === 0) {
            return;
        }
        if (presetMode !== '' && !this.supportedPresetModes.includes(presetMode)) {
            return;
        }
        this.sendCommand({ hasPresetMode: true, presetMode });
    }

    private get usesLegacySpeed(): boolean {
        return !(this.apiVersion.major > 1 || (this.apiVersion.major === 1 && this.apiVersion.minor >= 4));
    }

    private legacySpeedForLevel(level: number): FanSpeed {
        // Legacy firmware only knows the three-valued enum, and its
        // speedCount is always LEGACY_SPEED_COUNT.
        switch (level) {
            case 1:
                return FanSpeed.FAN_SPEED_LOW;
            case 2:
                return FanSpeed.FAN_SPEED_MEDIUM;
            default:
                return FanSpeed.FAN_SPEED_HIGH;
        }
    }

    private sendCommand(command: Omit<Partial<FanCommandRequest>, 'key'>): void {
        this.queueCommand(
            MessageTypes.FanCommandRequest,
            () =>
                FanCommandRequest.encode({
                    key: this.key,
                    hasState: false,
                    state: false,
                    hasSpeed: false,
                    speed: FanSpeed.FAN_SPEED_LOW,
                    hasOscillating: false,
                    oscillating: false,
                    hasDirection: false,
                    direction: FanDirection.FAN_DIRECTION_FORWARD,
                    hasSpeedLevel: false,
                    speedLevel: 0,
                    hasPresetMode: false,
                    presetMode: '',
                    ...command,
                }).finish(),
            // Fan commands are cheap, idempotent intents. Firmware is not
            // required to echo a state response for each command, so
            // serializing on feedback would stall the next command for the
            // 30 second pipeline fallback. State responses still flow through
            // BaseComponent and update the public getters.
            true,
        );
    }
}
