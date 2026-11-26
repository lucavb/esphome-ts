import { BaseComponent } from './base';
import { type ClimateEntity, type ComponentType } from './entities';
import { type ClimateStateEvent } from './states';
import { type CommandInterface } from './commandInterface';
import { atLeast, LATEST_KNOWN_PROTOCOL_VERSION, type ApiVersion } from '../api/protocolVersion';
import { type Observable } from 'rxjs';
import { MessageTypes } from '../api/requestResponseMatching';
import {
    ClimateAction,
    ClimateCommandRequest,
    ClimateFanMode,
    ClimateMode,
    ClimatePreset,
    ClimateSwingMode,
    type TemperatureUnit,
} from '../api/protobuf/api';

// API 1.5 replaced the legacy away toggle with presets; older firmware only
// understands the away flag.
const SINCE_PRESETS: ApiVersion = { major: 1, minor: 5 };

// ts-proto keeps unknown wire enum values as their raw number instead of
// mapping them to a sentinel, so every state enum is range-checked before it
// leaves this class. The comparisons stay numeric at runtime, which is what
// catches an unknown future value on the wire. ClimateAction deliberately has
// no value 1 (its values mirror ClimateMode for readability), so its range
// starts at CLIMATE_ACTION_COOLING rather than at OFF.
const isKnownMode = (value: ClimateMode | undefined): value is ClimateMode =>
    value !== undefined && value >= ClimateMode.CLIMATE_MODE_OFF && value <= ClimateMode.CLIMATE_MODE_AUTO;
const isKnownAction = (value: ClimateAction | undefined): value is ClimateAction =>
    value === ClimateAction.CLIMATE_ACTION_OFF ||
    (value !== undefined &&
        value >= ClimateAction.CLIMATE_ACTION_COOLING &&
        value <= ClimateAction.CLIMATE_ACTION_DEFROSTING);
const isKnownFanMode = (value: ClimateFanMode | undefined): value is ClimateFanMode =>
    value !== undefined && value >= ClimateFanMode.CLIMATE_FAN_ON && value <= ClimateFanMode.CLIMATE_FAN_QUIET;
const isKnownSwingMode = (value: ClimateSwingMode | undefined): value is ClimateSwingMode =>
    value !== undefined &&
    value >= ClimateSwingMode.CLIMATE_SWING_OFF &&
    value <= ClimateSwingMode.CLIMATE_SWING_HORIZONTAL;
const isKnownPreset = (value: ClimatePreset | undefined): value is ClimatePreset =>
    value !== undefined && value >= ClimatePreset.CLIMATE_PRESET_NONE && value <= ClimatePreset.CLIMATE_PRESET_ACTIVITY;
const nonEmptyString = (value: string | undefined): string | undefined => (value ? value : undefined);
// Firmware initialises temperatures to NaN, and a state published before a
// sensor produced a value still carries it; the protocol has no "unset"
// encoding for a float, so non-finite values surface as undefined. Decode
// widens float32 to double, so a decoded value can never be a finite double
// outside the float32 range — this double-precision check is enough for the
// getter side.
const finiteNumber = (value: number | undefined): number | undefined =>
    value !== undefined && Number.isFinite(value) ? value : undefined;
// Setpoints are encoded as 32-bit floats: a finite double outside the
// float32 range would silently encode as Infinity, which firmware does not
// reject, so the setters refuse values that do not survive the encoding.
const isFiniteFloat32 = (value: number): boolean => Number.isFinite(Math.fround(value));

/**
 * One climate entity. Setters ignore values the device does not advertise and
 * non-finite numbers, returning without an error; gate UI on the capability
 * getters. State getters return undefined while the device reports no valid
 * state yet.
 */
export class ClimateComponent extends BaseComponent<ClimateEntity, ClimateStateEvent> {
    constructor(
        listEntity: ClimateEntity,
        state: Observable<ClimateStateEvent>,
        commandInterface: CommandInterface,
        private readonly apiVersion: ApiVersion = LATEST_KNOWN_PROTOCOL_VERSION,
    ) {
        super(listEntity, state, commandInterface);
    }

    public get type(): ComponentType {
        return 'climate';
    }

    public get supportsCurrentTemperature(): boolean {
        return this.listEntity.supportsCurrentTemperature;
    }

    public get supportsTwoPointTargetTemperature(): boolean {
        return this.listEntity.supportsTwoPointTargetTemperature;
    }

    public get supportsAction(): boolean {
        return this.listEntity.supportsAction;
    }

    public get supportsCurrentHumidity(): boolean {
        return this.listEntity.supportsCurrentHumidity;
    }

    public get supportsTargetHumidity(): boolean {
        return this.listEntity.supportsTargetHumidity;
    }

    public get supportedModes(): ClimateMode[] {
        return this.listEntity.supportedModes;
    }

    public get supportedFanModes(): ClimateFanMode[] {
        return this.listEntity.supportedFanModes;
    }

    public get supportedCustomFanModes(): string[] {
        return this.listEntity.supportedCustomFanModes;
    }

    public get supportedSwingModes(): ClimateSwingMode[] {
        return this.listEntity.supportedSwingModes;
    }

    public get supportedCustomPresets(): string[] {
        return this.listEntity.supportedCustomPresets;
    }

    /**
     * Presets the device accepts, normalised across the API 1.5 boundary:
     * older firmware only has the legacy away toggle, which surfaces as the
     * HOME and AWAY presets, while newer firmware reports the preset list.
     */
    public get supportedPresets(): ClimatePreset[] {
        if (this.usesLegacyPresets) {
            return this.listEntity.legacySupportsAway
                ? [ClimatePreset.CLIMATE_PRESET_HOME, ClimatePreset.CLIMATE_PRESET_AWAY]
                : [];
        }
        return this.listEntity.supportedPresets;
    }

    public get visualMinTemperature(): number {
        return this.listEntity.visualMinTemperature;
    }

    public get visualMaxTemperature(): number {
        return this.listEntity.visualMaxTemperature;
    }

    public get visualTemperatureStep(): number {
        return this.listEntity.visualTargetTemperatureStep;
    }

    public get visualCurrentTemperatureStep(): number {
        return this.listEntity.visualCurrentTemperatureStep;
    }

    public get visualMinHumidity(): number {
        return this.listEntity.visualMinHumidity;
    }

    public get visualMaxHumidity(): number {
        return this.listEntity.visualMaxHumidity;
    }

    public get temperatureUnit(): TemperatureUnit {
        return this.listEntity.temperatureUnit;
    }

    /**
     * Mode the device is in. Firmware that predates the heat/cool and auto
     * split reports its automatic heat/cool mode as HEAT_COOL, which is the
     * value it uses on the wire. Undefined until the first valid state or
     * when the firmware reports a mode this client does not know.
     */
    public get mode(): ClimateMode | undefined {
        const mode = this.reportedState?.mode;
        return isKnownMode(mode) ? mode : undefined;
    }

    /**
     * What the device is currently doing. Undefined until the first valid
     * state, when the firmware does not report an action, or for an unknown
     * value.
     */
    public get action(): ClimateAction | undefined {
        if (!this.supportsAction) {
            return undefined;
        }
        const action = this.reportedState?.action;
        return isKnownAction(action) ? action : undefined;
    }

    /**
     * Measured ambient temperature. Undefined until the first valid state
     * and on devices without a temperature sensor, which report a constant
     * zero.
     */
    public get currentTemperature(): number | undefined {
        if (!this.supportsCurrentTemperature) {
            return undefined;
        }
        return finiteNumber(this.reportedState?.currentTemperature);
    }

    /**
     * Single setpoint, as reported by the device. Undefined until the first
     * valid state and on two-point devices, which only report the low/high
     * range.
     */
    public get targetTemperature(): number | undefined {
        if (this.supportsTwoPointTargetTemperature) {
            return undefined;
        }
        return finiteNumber(this.reportedState?.targetTemperature);
    }

    /** Lower bound of the two-point target range. Undefined until the first valid state and on single-setpoint devices. */
    public get targetTemperatureLow(): number | undefined {
        if (!this.supportsTwoPointTargetTemperature) {
            return undefined;
        }
        return finiteNumber(this.reportedState?.targetTemperatureLow);
    }

    /** Upper bound of the two-point target range. Undefined until the first valid state and on single-setpoint devices. */
    public get targetTemperatureHigh(): number | undefined {
        if (!this.supportsTwoPointTargetTemperature) {
            return undefined;
        }
        return finiteNumber(this.reportedState?.targetTemperatureHigh);
    }

    /** Measured humidity. Undefined until the first valid state and on devices without a humidity sensor. */
    public get currentHumidity(): number | undefined {
        if (!this.supportsCurrentHumidity) {
            return undefined;
        }
        return finiteNumber(this.reportedState?.currentHumidity);
    }

    /** Humidity setpoint. Undefined until the first valid state and on devices without humidity control. */
    public get targetHumidity(): number | undefined {
        if (!this.supportsTargetHumidity) {
            return undefined;
        }
        return finiteNumber(this.reportedState?.targetHumidity);
    }

    /**
     * Active preset, normalised across the API 1.5 boundary: legacy firmware
     * only reports the away flag, which surfaces as HOME or AWAY when the
     * firmware advertises away support, while newer firmware reports the
     * preset directly. Undefined until the first valid state, on legacy
     * firmware without away support, or for an unknown value. On modern
     * firmware without preset support the proto default surfaces as
     * CLIMATE_PRESET_NONE (and away as false); gate preset UI on
     * supportedPresets. While a custom preset is active, preset also reads
     * CLIMATE_PRESET_NONE (and away false); customPreset carries the name.
     */
    public get preset(): ClimatePreset | undefined {
        const state = this.reportedState;
        if (!state) {
            return undefined;
        }
        if (this.usesLegacyPresets) {
            if (!this.listEntity.legacySupportsAway) {
                return undefined;
            }
            return state.unusedLegacyAway ? ClimatePreset.CLIMATE_PRESET_AWAY : ClimatePreset.CLIMATE_PRESET_HOME;
        }
        return isKnownPreset(state.preset) ? state.preset : undefined;
    }

    /** Name of the active custom preset, or undefined when none is active. */
    public get customPreset(): string | undefined {
        return nonEmptyString(this.reportedState?.customPreset);
    }

    /** Whether the AWAY preset is active, normalised across the API 1.5 boundary. */
    public get away(): boolean | undefined {
        if (this.preset === undefined) {
            return undefined;
        }
        return this.preset === ClimatePreset.CLIMATE_PRESET_AWAY;
    }

    /**
     * Active regular fan mode. Undefined until the first valid state, on
     * devices without regular fan modes (firmware leaves the field at its
     * proto default when it does not track one), while a custom fan mode is
     * active (firmware clears the regular mode), or for an unknown value. A
     * regular-fan device that has not picked a mode yet also leaves the
     * field at its default, which reads as CLIMATE_FAN_ON; the protocol
     * cannot express "unset" here.
     */
    public get fanMode(): ClimateFanMode | undefined {
        if (this.supportedFanModes.length === 0 || this.customFanMode !== undefined) {
            return undefined;
        }
        const fanMode = this.reportedState?.fanMode;
        return isKnownFanMode(fanMode) ? fanMode : undefined;
    }

    /** Name of the active custom fan mode, or undefined when none is active. */
    public get customFanMode(): string | undefined {
        return nonEmptyString(this.reportedState?.customFanMode);
    }

    /** Active swing mode. Undefined until the first valid state, on devices without swing control, or for an unknown value. */
    public get swingMode(): ClimateSwingMode | undefined {
        if (this.supportedSwingModes.length === 0) {
            return undefined;
        }
        const swingMode = this.reportedState?.swingMode;
        return isKnownSwingMode(swingMode) ? swingMode : undefined;
    }

    /**
     * Select the operating mode. OFF is accepted without requiring it in the
     * advertised list: firmware seeds its supported-mode set with OFF, so the
     * list normally includes it, and a platform that removes it will
     * warn-and-drop the OFF command like any other unsupported mode. Every
     * other mode must be advertised so older firmware never receives an enum
     * value it does not know (CLIMATE_MODE_AUTO was added after the heat/cool
     * and auto split).
     */
    public setMode(mode: ClimateMode): void {
        if (mode !== ClimateMode.CLIMATE_MODE_OFF && !this.supportedModes.includes(mode)) {
            return;
        }
        this.sendCommand({ hasMode: true, mode });
    }

    /**
     * Set the single setpoint. Firmware rejects the single setpoint on
     * two-point devices outright — its validation is not mode-dependent,
     * only the low/high pair is accepted there — so the setter gates the
     * same way setTargetTemperatureLow/High do. The visual temperature
     * range is a UI hint, not a limit: neither this setter nor the API command
     * layer clamps to it, though a platform control loop may. The API command
     * layer only rejects NaN here, plus the single setpoint on two-point
     * devices.
     */
    public setTargetTemperature(temperature: number): void {
        if (this.supportsTwoPointTargetTemperature || !isFiniteFloat32(temperature)) {
            return;
        }
        this.sendCommand({ hasTargetTemperature: true, targetTemperature: temperature });
    }

    /**
     * Set the lower bound of the two-point target range. This sends a
     * single-sided command; firmware only checks low ≤ high when both bounds
     * arrive together, so prefer {@link setTargetTemperatureRange} when
     * changing both.
     */
    public setTargetTemperatureLow(temperature: number): void {
        if (!this.supportsTwoPointTargetTemperature || !isFiniteFloat32(temperature)) {
            return;
        }
        this.sendCommand({ hasTargetTemperatureLow: true, targetTemperatureLow: temperature });
    }

    /**
     * Set the upper bound of the two-point target range. This sends a
     * single-sided command; firmware only checks low ≤ high when both bounds
     * arrive together, so prefer {@link setTargetTemperatureRange} when
     * changing both.
     */
    public setTargetTemperatureHigh(temperature: number): void {
        if (!this.supportsTwoPointTargetTemperature || !isFiniteFloat32(temperature)) {
            return;
        }
        this.sendCommand({ hasTargetTemperatureHigh: true, targetTemperatureHigh: temperature });
    }

    /**
     * Set both bounds of the two-point target range in one command. Firmware
     * only rejects low > high when both bounds arrive together, so this is the
     * atomic way to move a range; the single-bound setters send one side at a
     * time.
     */
    public setTargetTemperatureRange(low: number, high: number): void {
        if (!this.supportsTwoPointTargetTemperature || !isFiniteFloat32(low) || !isFiniteFloat32(high)) {
            return;
        }
        if (low > high) {
            return;
        }
        this.sendCommand({
            hasTargetTemperatureLow: true,
            targetTemperatureLow: low,
            hasTargetTemperatureHigh: true,
            targetTemperatureHigh: high,
        });
    }

    /** Set the humidity setpoint on devices with humidity control. */
    public setTargetHumidity(humidity: number): void {
        if (!this.supportsTargetHumidity || !isFiniteFloat32(humidity)) {
            return;
        }
        this.sendCommand({ hasTargetHumidity: true, targetHumidity: humidity });
    }

    /** Select one of {@link supportedFanModes}; other values are ignored. */
    public setFanMode(fanMode: ClimateFanMode): void {
        if (!this.supportedFanModes.includes(fanMode)) {
            return;
        }
        this.sendCommand({ hasFanMode: true, fanMode });
    }

    /**
     * Select one of {@link supportedCustomFanModes}. There is no command to
     * clear a custom fan mode: firmware drops it as soon as a regular fan
     * mode is set.
     */
    public setCustomFanMode(customFanMode: string): void {
        if (!customFanMode || !this.supportedCustomFanModes.includes(customFanMode)) {
            return;
        }
        this.sendCommand({ hasCustomFanMode: true, customFanMode });
    }

    /** Select one of {@link supportedSwingModes}; other values are ignored. */
    public setSwingMode(swingMode: ClimateSwingMode): void {
        if (!this.supportedSwingModes.includes(swingMode)) {
            return;
        }
        this.sendCommand({ hasSwingMode: true, swingMode });
    }

    /**
     * Select one of {@link supportedPresets}; CLIMATE_PRESET_NONE is the
     * protocol's way to clear the active (custom) preset, though firmware
     * that does not advertise NONE drops the command instead of applying
     * it. On firmware before API 1.5 the command collapses to the legacy
     * away toggle, like the reference clients: AWAY turns it on, everything
     * else turns it off, so NONE reads back as HOME on devices that advertise
     * away support. Firmware without away support drops the command.
     */
    public setPreset(preset: ClimatePreset): void {
        if (preset !== ClimatePreset.CLIMATE_PRESET_NONE && !this.supportedPresets.includes(preset)) {
            return;
        }
        if (this.usesLegacyPresets) {
            // Firmware without away support ignores the flag entirely; a
            // device that reports no presets has no preset state to change.
            if (!this.listEntity.legacySupportsAway) {
                return;
            }
            this.sendCommand({
                unusedHasLegacyAway: true,
                unusedLegacyAway: preset === ClimatePreset.CLIMATE_PRESET_AWAY,
            });
            return;
        }
        this.sendCommand({ hasPreset: true, preset });
    }

    /**
     * Select one of {@link supportedCustomPresets}. Clearing happens through
     * setPreset(CLIMATE_PRESET_NONE), provided the firmware advertises NONE;
     * firmware drops the custom preset as soon as a regular preset is set.
     */
    public setCustomPreset(customPreset: string): void {
        if (!customPreset || !this.supportedCustomPresets.includes(customPreset)) {
            return;
        }
        this.sendCommand({ hasCustomPreset: true, customPreset });
    }

    /**
     * The latest state event, unless the device reports it has no valid
     * state yet. A missing_state frame still carries the proto defaults
     * (mode and action OFF) and the firmware's NaN-initialised
     * temperatures, which would otherwise read as a real device state.
     * Firmware before ESPHome 2026.10 does not send the flag and reports
     * the same defaults, which this client cannot tell apart.
     */
    private get reportedState(): ClimateStateEvent | undefined {
        const state = this.state.getValue();
        return state?.missingState ? undefined : state;
    }

    private get usesLegacyPresets(): boolean {
        return !atLeast(this.apiVersion, SINCE_PRESETS);
    }

    private sendCommand(command: Omit<Partial<ClimateCommandRequest>, 'key'>): void {
        this.queueCommand(
            MessageTypes.ClimateCommandRequest,
            () =>
                ClimateCommandRequest.encode({
                    key: this.key,
                    hasMode: false,
                    mode: ClimateMode.CLIMATE_MODE_OFF,
                    hasTargetTemperature: false,
                    targetTemperature: 0,
                    hasTargetTemperatureLow: false,
                    targetTemperatureLow: 0,
                    hasTargetTemperatureHigh: false,
                    targetTemperatureHigh: 0,
                    unusedHasLegacyAway: false,
                    unusedLegacyAway: false,
                    hasFanMode: false,
                    fanMode: ClimateFanMode.CLIMATE_FAN_ON,
                    hasSwingMode: false,
                    swingMode: ClimateSwingMode.CLIMATE_SWING_OFF,
                    hasCustomFanMode: false,
                    customFanMode: '',
                    hasPreset: false,
                    preset: ClimatePreset.CLIMATE_PRESET_NONE,
                    hasCustomPreset: false,
                    customPreset: '',
                    hasTargetHumidity: false,
                    targetHumidity: 0,
                    ...command,
                }).finish(),
            // Climate commands are cheap, idempotent intents. Firmware applies
            // them on its own schedule — an IR air conditioner may not echo a
            // state response immediately — so serializing on feedback would
            // stall the next command for the 30 second pipeline fallback.
            // State responses still flow through BaseComponent and update
            // the public getters.
            true,
        );
    }
}
