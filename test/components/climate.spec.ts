import { ClimateComponent, type ClimateStateEvent } from '../../src';
import { type ClimateEntity } from '../../src/components/entities';
import {
    ClimateAction,
    ClimateCommandRequest,
    ClimateFanMode,
    ClimateMode,
    ClimatePreset,
    ClimateStateResponse,
    ClimateSwingMode,
    TemperatureUnit,
} from '../../src/api/protobuf/api';
import { Subject } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';
import { MessageTypes } from '../../src/api/requestResponseMatching';

describe('ClimateComponent', () => {
    let component: ClimateComponent;
    let listEntity: ClimateEntity;
    let state: Subject<ClimateStateEvent>;
    const debugConnection: DebugConnection = new DebugConnection();

    const sentCommand = (): ClimateCommandRequest => ClimateCommandRequest.decode(debugConnection.calls[0][1]);
    const sentCommands = (): ClimateCommandRequest[] =>
        debugConnection.calls.map((call) => ClimateCommandRequest.decode(call[1]));

    beforeEach(() => {
        listEntity = {
            key: 134,
            name: 'my climate',
            objectId: 'objectId',
            uniqueId: 'uniqueId',
            supportsCurrentTemperature: true,
            supportsTwoPointTargetTemperature: false,
            supportedModes: [
                ClimateMode.CLIMATE_MODE_OFF,
                ClimateMode.CLIMATE_MODE_COOL,
                ClimateMode.CLIMATE_MODE_HEAT,
                ClimateMode.CLIMATE_MODE_DRY,
            ],
            visualMinTemperature: 16,
            visualMaxTemperature: 32,
            visualTargetTemperatureStep: 0.5,
            legacySupportsAway: false,
            supportsAction: true,
            supportedFanModes: [
                ClimateFanMode.CLIMATE_FAN_AUTO,
                ClimateFanMode.CLIMATE_FAN_LOW,
                ClimateFanMode.CLIMATE_FAN_HIGH,
            ],
            supportedSwingModes: [ClimateSwingMode.CLIMATE_SWING_OFF, ClimateSwingMode.CLIMATE_SWING_BOTH],
            supportedCustomFanModes: ['Silent'],
            supportedPresets: [ClimatePreset.CLIMATE_PRESET_HOME, ClimatePreset.CLIMATE_PRESET_ECO],
            supportedCustomPresets: ['Party'],
            supportsCurrentHumidity: true,
            supportsTargetHumidity: true,
            visualMinHumidity: 30,
            visualMaxHumidity: 60,
            temperatureUnit: TemperatureUnit.TEMPERATURE_UNIT_CELSIUS,
            visualCurrentTemperatureStep: 0.1,
        };
        state = new Subject<ClimateStateEvent>();
        component = new ClimateComponent(listEntity, state, debugConnection);
    });

    afterEach(() => {
        debugConnection.calls = [];
        state.complete();
    });

    it('reports its type and entity details', () => {
        expect(component.type).toBe('climate');
        expect(component.name).toBe('my climate');
        expect(component.key).toBe(listEntity.key);
        expect(component.visualMinTemperature).toBeCloseTo(16);
        expect(component.visualMaxTemperature).toBeCloseTo(32);
        expect(component.visualTemperatureStep).toBeCloseTo(0.5);
        expect(component.visualCurrentTemperatureStep).toBeCloseTo(0.1);
        expect(component.visualMinHumidity).toBeCloseTo(30);
        expect(component.visualMaxHumidity).toBeCloseTo(60);
        expect(component.supportsCurrentHumidity).toBe(true);
        expect(component.supportsTargetHumidity).toBe(true);
        expect(component.temperatureUnit).toBe(TemperatureUnit.TEMPERATURE_UNIT_CELSIUS);
    });

    it('sends commands immediately and without serialising', () => {
        // Climate commands are idempotent intents; firmware applies them on
        // its own schedule. A serialized command would wait for a state
        // response an IR air conditioner never sends right away, so the later
        // commands would never go out.
        component.setMode(ClimateMode.CLIMATE_MODE_COOL);
        component.setTargetTemperature(24);
        component.setFanMode(ClimateFanMode.CLIMATE_FAN_HIGH);

        expect(debugConnection.calls.length).toBe(3);
        for (const call of debugConnection.calls) {
            expect(call[0]).toBe(MessageTypes.ClimateCommandRequest);
        }
        const commands = sentCommands();
        expect(commands.map((command) => command.mode)).toEqual([
            ClimateMode.CLIMATE_MODE_COOL,
            ClimateMode.CLIMATE_MODE_OFF,
            ClimateMode.CLIMATE_MODE_OFF,
        ]);
        expect(commands[1].hasTargetTemperature).toBe(true);
        expect(commands[1].targetTemperature).toBeCloseTo(24);
        expect(commands[2].hasFanMode).toBe(true);
        expect(commands[2].fanMode).toBe(ClimateFanMode.CLIMATE_FAN_HIGH);
    });

    it('sends an advertised mode and only the mode flag', () => {
        component.setMode(ClimateMode.CLIMATE_MODE_HEAT);

        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.key).toBe(listEntity.key);
        expect(command.hasMode).toBe(true);
        expect(command.mode).toBe(ClimateMode.CLIMATE_MODE_HEAT);
        // A mode change is its own intent and must not reset any other field.
        expect(command.hasTargetTemperature).toBe(false);
        expect(command.hasTargetTemperatureLow).toBe(false);
        expect(command.hasTargetTemperatureHigh).toBe(false);
        expect(command.unusedHasLegacyAway).toBe(false);
        expect(command.hasFanMode).toBe(false);
        expect(command.hasSwingMode).toBe(false);
        expect(command.hasCustomFanMode).toBe(false);
        expect(command.hasPreset).toBe(false);
        expect(command.hasCustomPreset).toBe(false);
        expect(command.hasTargetHumidity).toBe(false);
    });

    it('always accepts OFF, even when the firmware does not advertise it', () => {
        const offless: ClimateEntity = {
            ...listEntity,
            supportedModes: [ClimateMode.CLIMATE_MODE_HEAT],
        };
        const offlessClimate = new ClimateComponent(offless, state, debugConnection);

        offlessClimate.setMode(ClimateMode.CLIMATE_MODE_OFF);
        expect(debugConnection.calls.length).toBe(1);
        expect(sentCommand().hasMode).toBe(true);
        expect(sentCommand().mode).toBe(ClimateMode.CLIMATE_MODE_OFF);
    });

    it('ignores modes the device does not advertise', () => {
        // Auto was added after the heat/cool split: a firmware older than
        // that does not know the value and must not receive it.
        component.setMode(ClimateMode.CLIMATE_MODE_AUTO);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('rejects the single setpoint on a two-point device', () => {
        // Firmware validation is not mode-dependent: it drops the single
        // setpoint outright on two-point devices ("Cannot set target
        // temperature for climate device with two-point target
        // temperature"), so the setter gates like the low/high pair.
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        twoPoint.setTargetTemperature(21.5);
        expect(debugConnection.calls.length).toBe(0);

        debugConnection.calls = [];
        component.setTargetTemperature(21.5);
        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.hasTargetTemperature).toBe(true);
        expect(command.targetTemperature).toBeCloseTo(21.5);
        expect(command.hasTargetTemperatureLow).toBe(false);
        expect(command.hasTargetTemperatureHigh).toBe(false);
        expect(command.hasMode).toBe(false);
    });

    it('sends low and high setpoints on a two-point device and rejects them otherwise', () => {
        component.setTargetTemperatureLow(19);
        component.setTargetTemperatureHigh(23);
        expect(debugConnection.calls.length).toBe(0);

        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        twoPoint.setTargetTemperatureLow(19);
        twoPoint.setTargetTemperatureHigh(23);
        expect(debugConnection.calls.length).toBe(2);
        const [low, high] = sentCommands();
        expect(low.hasTargetTemperatureLow).toBe(true);
        expect(low.targetTemperatureLow).toBeCloseTo(19);
        expect(low.hasTargetTemperatureHigh).toBe(false);
        expect(high.hasTargetTemperatureHigh).toBe(true);
        expect(high.targetTemperatureHigh).toBeCloseTo(23);
        expect(high.hasTargetTemperatureLow).toBe(false);
    });

    it('sends both two-point bounds atomically and rejects an inverted range', () => {
        component.setTargetTemperatureRange(19, 23);
        expect(debugConnection.calls.length).toBe(0);

        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        twoPoint.setTargetTemperatureRange(19, 23);
        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.hasTargetTemperatureLow).toBe(true);
        expect(command.targetTemperatureLow).toBeCloseTo(19);
        expect(command.hasTargetTemperatureHigh).toBe(true);
        expect(command.targetTemperatureHigh).toBeCloseTo(23);
        expect(command.hasTargetTemperature).toBe(false);

        debugConnection.calls = [];
        twoPoint.setTargetTemperatureRange(25, 20);
        twoPoint.setTargetTemperatureRange(19, Number.NaN);
        twoPoint.setTargetTemperatureRange(Number.POSITIVE_INFINITY, 23);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('sends equal two-point bounds', () => {
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        twoPoint.setTargetTemperatureRange(20, 20);
        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.hasTargetTemperatureLow).toBe(true);
        expect(command.targetTemperatureLow).toBeCloseTo(20);
        expect(command.hasTargetTemperatureHigh).toBe(true);
        expect(command.targetTemperatureHigh).toBeCloseTo(20);
    });

    it('sends zero-valued setpoints with their has flags', () => {
        component.setTargetTemperature(0);
        expect(sentCommand().hasTargetTemperature).toBe(true);
        expect(sentCommand().targetTemperature).toBe(0);

        debugConnection.calls = [];
        component.setTargetHumidity(0);
        expect(sentCommand().hasTargetHumidity).toBe(true);
        expect(sentCommand().targetHumidity).toBe(0);

        debugConnection.calls = [];
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        twoPoint.setTargetTemperatureLow(0);
        twoPoint.setTargetTemperatureHigh(0);
        const [low, high] = sentCommands();
        expect(low.hasTargetTemperatureLow).toBe(true);
        expect(low.targetTemperatureLow).toBe(0);
        expect(high.hasTargetTemperatureHigh).toBe(true);
        expect(high.targetTemperatureHigh).toBe(0);
    });

    it('rejects non-finite temperatures and humidities', () => {
        component.setTargetTemperature(Number.NaN);
        component.setTargetTemperature(Number.POSITIVE_INFINITY);
        // A finite double outside the float32 range would encode as
        // Infinity, which firmware does not reject.
        component.setTargetTemperature(1e39);
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        twoPoint.setTargetTemperatureLow(Number.NaN);
        twoPoint.setTargetTemperatureHigh(Number.POSITIVE_INFINITY);
        twoPoint.setTargetTemperatureLow(1e39);
        twoPoint.setTargetTemperatureHigh(1e39);
        component.setTargetHumidity(Number.NaN);
        component.setTargetHumidity(1e39);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('sends the humidity setpoint and rejects it without humidity control', () => {
        component.setTargetHumidity(45);
        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.hasTargetHumidity).toBe(true);
        expect(command.targetHumidity).toBeCloseTo(45);

        debugConnection.calls = [];
        const dry = new ClimateComponent({ ...listEntity, supportsTargetHumidity: false }, state, debugConnection);
        dry.setTargetHumidity(45);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('sends advertised fan, custom fan and swing modes and ignores the rest', () => {
        component.setFanMode(ClimateFanMode.CLIMATE_FAN_LOW);
        expect(debugConnection.calls.length).toBe(1);
        let command = sentCommand();
        expect(command.hasFanMode).toBe(true);
        expect(command.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_LOW);
        expect(command.hasCustomFanMode).toBe(false);

        debugConnection.calls = [];
        component.setFanMode(ClimateFanMode.CLIMATE_FAN_QUIET);
        expect(debugConnection.calls.length).toBe(0);

        debugConnection.calls = [];
        component.setCustomFanMode('Silent');
        expect(debugConnection.calls.length).toBe(1);
        command = sentCommand();
        expect(command.hasCustomFanMode).toBe(true);
        expect(command.customFanMode).toBe('Silent');
        expect(command.hasFanMode).toBe(false);

        // No clear command exists: an empty custom mode is never sent.
        debugConnection.calls = [];
        component.setCustomFanMode('');
        component.setCustomFanMode('Turbo');
        expect(debugConnection.calls.length).toBe(0);

        debugConnection.calls = [];
        component.setSwingMode(ClimateSwingMode.CLIMATE_SWING_BOTH);
        expect(debugConnection.calls.length).toBe(1);
        command = sentCommand();
        expect(command.hasSwingMode).toBe(true);
        expect(command.swingMode).toBe(ClimateSwingMode.CLIMATE_SWING_BOTH);

        debugConnection.calls = [];
        component.setSwingMode(ClimateSwingMode.CLIMATE_SWING_VERTICAL);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('sends an advertised preset and clears with NONE', () => {
        component.setPreset(ClimatePreset.CLIMATE_PRESET_ECO);
        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.hasPreset).toBe(true);
        expect(command.preset).toBe(ClimatePreset.CLIMATE_PRESET_ECO);
        expect(command.unusedHasLegacyAway).toBe(false);

        debugConnection.calls = [];
        // NONE is always accepted: it is the protocol's way to clear a preset.
        component.setPreset(ClimatePreset.CLIMATE_PRESET_NONE);
        expect(debugConnection.calls.length).toBe(1);
        const clear = sentCommand();
        // The value alone is the decode default; firmware only applies the
        // clear when the has flag is present.
        expect(clear.hasPreset).toBe(true);
        expect(clear.preset).toBe(ClimatePreset.CLIMATE_PRESET_NONE);

        debugConnection.calls = [];
        component.setPreset(ClimatePreset.CLIMATE_PRESET_AWAY);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('sends an advertised custom preset and never an empty one', () => {
        component.setCustomPreset('Party');
        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.hasCustomPreset).toBe(true);
        expect(command.customPreset).toBe('Party');
        expect(command.hasPreset).toBe(false);

        debugConnection.calls = [];
        component.setCustomPreset('');
        component.setCustomPreset('Disco');
        expect(debugConnection.calls.length).toBe(0);
    });

    it('collapses presets to the legacy away flag before API 1.5', () => {
        const legacy = new ClimateComponent({ ...listEntity, legacySupportsAway: true }, state, debugConnection, {
            major: 1,
            minor: 4,
        });

        legacy.setPreset(ClimatePreset.CLIMATE_PRESET_AWAY);
        expect(debugConnection.calls.length).toBe(1);
        let command = sentCommand();
        expect(command.unusedHasLegacyAway).toBe(true);
        expect(command.unusedLegacyAway).toBe(true);
        expect(command.hasPreset).toBe(false);

        debugConnection.calls = [];
        legacy.setPreset(ClimatePreset.CLIMATE_PRESET_HOME);
        command = sentCommand();
        expect(command.unusedHasLegacyAway).toBe(true);
        expect(command.unusedLegacyAway).toBe(false);

        debugConnection.calls = [];
        legacy.setPreset(ClimatePreset.CLIMATE_PRESET_NONE);
        command = sentCommand();
        expect(command.unusedHasLegacyAway).toBe(true);
        expect(command.unusedLegacyAway).toBe(false);
    });

    it('does not send or report a preset before API 1.5 without away support', () => {
        const legacy = new ClimateComponent(listEntity, state, debugConnection, { major: 1, minor: 4 });

        legacy.setPreset(ClimatePreset.CLIMATE_PRESET_AWAY);
        legacy.setPreset(ClimatePreset.CLIMATE_PRESET_HOME);
        legacy.setPreset(ClimatePreset.CLIMATE_PRESET_NONE);
        expect(debugConnection.calls.length).toBe(0);

        state.next({ key: listEntity.key, unusedLegacyAway: true });
        expect(legacy.preset).toBeUndefined();
        expect(legacy.away).toBeUndefined();
    });

    it('normalises supported presets across the API 1.5 boundary', () => {
        expect(component.supportedPresets).toEqual([
            ClimatePreset.CLIMATE_PRESET_HOME,
            ClimatePreset.CLIMATE_PRESET_ECO,
        ]);

        const legacy = new ClimateComponent({ ...listEntity, legacySupportsAway: true }, state, debugConnection, {
            major: 1,
            minor: 4,
        });
        expect(legacy.supportedPresets).toEqual([ClimatePreset.CLIMATE_PRESET_HOME, ClimatePreset.CLIMATE_PRESET_AWAY]);

        const legacyWithoutAway = new ClimateComponent(listEntity, state, debugConnection, { major: 1, minor: 4 });
        expect(legacyWithoutAway.supportedPresets).toEqual([]);
    });

    it('exposes effective presets as the negotiated version changes', () => {
        const negotiatedVersion = { major: 1, minor: 4 };
        const versioned = new ClimateComponent(
            { ...listEntity, legacySupportsAway: true, supportedPresets: [] },
            state,
            debugConnection,
            negotiatedVersion,
        );

        expect(versioned.supportedPresets).toEqual([
            ClimatePreset.CLIMATE_PRESET_HOME,
            ClimatePreset.CLIMATE_PRESET_AWAY,
        ]);
        versioned.setPreset(ClimatePreset.CLIMATE_PRESET_BOOST);
        expect(debugConnection.calls.length).toBe(0);

        // EspDevice updates the shared version object and refreshes the list
        // entity when a re-discovery follows a reconnect. The same existing
        // component must pick up both changes.
        negotiatedVersion.minor = 5;
        versioned.provideListEntity({
            ...listEntity,
            legacySupportsAway: false,
            supportedPresets: [ClimatePreset.CLIMATE_PRESET_BOOST],
        });
        expect(versioned.supportedPresets).toEqual([ClimatePreset.CLIMATE_PRESET_BOOST]);
        versioned.setPreset(ClimatePreset.CLIMATE_PRESET_BOOST);
        expect(debugConnection.calls.length).toBe(1);
        expect(sentCommand().hasPreset).toBe(true);
        expect(sentCommand().preset).toBe(ClimatePreset.CLIMATE_PRESET_BOOST);

        debugConnection.calls = [];
        negotiatedVersion.minor = 4;
        versioned.provideListEntity({ ...listEntity, legacySupportsAway: true, supportedPresets: [] });
        expect(versioned.supportedPresets).toEqual([
            ClimatePreset.CLIMATE_PRESET_HOME,
            ClimatePreset.CLIMATE_PRESET_AWAY,
        ]);
    });

    it('does not clamp setpoints to the visual range', () => {
        // The visual range is a UI hint; the API command layer does not
        // range-check it, though a platform control loop may clamp.
        component.setTargetTemperature(50);
        expect(sentCommand().hasTargetTemperature).toBe(true);
        expect(sentCommand().targetTemperature).toBeCloseTo(50);

        debugConnection.calls = [];
        component.setTargetHumidity(95);
        expect(sentCommand().hasTargetHumidity).toBe(true);
        expect(sentCommand().targetHumidity).toBeCloseTo(95);
    });

    it('treats a major version above 1 as modern presets', () => {
        const versioned = new ClimateComponent(
            { ...listEntity, legacySupportsAway: true, supportedPresets: [ClimatePreset.CLIMATE_PRESET_BOOST] },
            state,
            debugConnection,
            { major: 2, minor: 0 },
        );

        expect(versioned.supportedPresets).toEqual([ClimatePreset.CLIMATE_PRESET_BOOST]);
        versioned.setPreset(ClimatePreset.CLIMATE_PRESET_BOOST);
        expect(sentCommand().hasPreset).toBe(true);
        expect(sentCommand().preset).toBe(ClimatePreset.CLIMATE_PRESET_BOOST);
    });

    it('suppresses every state getter while the device reports missingState', () => {
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        const events: ClimateStateEvent[] = [];
        component.state$.subscribe((event) => events.push(event));

        state.next({
            key: listEntity.key,
            missingState: true,
            mode: ClimateMode.CLIMATE_MODE_COOL,
            currentTemperature: 25.5,
            targetTemperature: 23,
            targetTemperatureLow: 19,
            targetTemperatureHigh: 23,
            action: ClimateAction.CLIMATE_ACTION_COOLING,
            fanMode: ClimateFanMode.CLIMATE_FAN_HIGH,
            swingMode: ClimateSwingMode.CLIMATE_SWING_BOTH,
            customFanMode: 'Silent',
            preset: ClimatePreset.CLIMATE_PRESET_ECO,
            customPreset: 'Party',
        });
        // The frame still carries every field, but the device has not
        // produced a valid state, so none of it is real feedback.
        expect(component.ready).toBe(true); // an event arrived; the stream is live
        expect(events.length).toBe(1); // state$ still fires for such frames
        expect(component.mode).toBeUndefined();
        expect(component.action).toBeUndefined();
        expect(component.currentTemperature).toBeUndefined();
        expect(component.targetTemperature).toBeUndefined();
        expect(component.currentHumidity).toBeUndefined();
        expect(component.targetHumidity).toBeUndefined();
        expect(component.fanMode).toBeUndefined();
        expect(component.customFanMode).toBeUndefined();
        expect(component.swingMode).toBeUndefined();
        expect(component.preset).toBeUndefined();
        expect(component.customPreset).toBeUndefined();
        expect(component.away).toBeUndefined();
        expect(twoPoint.targetTemperatureLow).toBeUndefined();
        expect(twoPoint.targetTemperatureHigh).toBeUndefined();

        state.next({
            key: listEntity.key,
            missingState: false,
            mode: ClimateMode.CLIMATE_MODE_COOL,
            currentTemperature: 25.5,
            targetTemperature: 23,
            preset: ClimatePreset.CLIMATE_PRESET_ECO,
        });
        expect(component.mode).toBe(ClimateMode.CLIMATE_MODE_COOL);
        expect(component.currentTemperature).toBeCloseTo(25.5);
        expect(component.targetTemperature).toBeCloseTo(23);
        expect(component.preset).toBe(ClimatePreset.CLIMATE_PRESET_ECO);
        expect(component.away).toBe(false);
    });

    it('suppresses non-finite temperatures and humidities', () => {
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        // Firmware initialises its temperatures to NaN, and a state
        // published before a sensor produced a value still carries it.
        state.next({
            key: listEntity.key,
            currentTemperature: Number.NaN,
            targetTemperature: Number.NaN,
            targetTemperatureLow: Number.NaN,
            targetTemperatureHigh: Number.POSITIVE_INFINITY,
            currentHumidity: Number.NaN,
            targetHumidity: Number.NaN,
        });
        expect(component.currentTemperature).toBeUndefined();
        expect(component.targetTemperature).toBeUndefined();
        expect(component.currentHumidity).toBeUndefined();
        expect(component.targetHumidity).toBeUndefined();
        expect(twoPoint.targetTemperatureLow).toBeUndefined();
        expect(twoPoint.targetTemperatureHigh).toBeUndefined();

        // Zero is a real value and must survive.
        state.next({
            key: listEntity.key,
            currentTemperature: 0,
            targetTemperature: 0,
            targetTemperatureLow: 0,
            targetTemperatureHigh: 0,
            currentHumidity: 0,
            targetHumidity: 0,
        });
        expect(component.currentTemperature).toBe(0);
        expect(component.targetTemperature).toBe(0);
        expect(component.currentHumidity).toBe(0);
        expect(component.targetHumidity).toBe(0);
        expect(twoPoint.targetTemperatureLow).toBe(0);
        expect(twoPoint.targetTemperatureHigh).toBe(0);
    });

    it('exposes mode, action and temperatures from state events', () => {
        expect(component.mode).toBeUndefined();
        expect(component.action).toBeUndefined();
        expect(component.currentTemperature).toBeUndefined();
        expect(component.targetTemperature).toBeUndefined();
        expect(component.targetTemperatureLow).toBeUndefined();
        expect(component.targetTemperatureHigh).toBeUndefined();
        expect(component.currentHumidity).toBeUndefined();
        expect(component.targetHumidity).toBeUndefined();

        state.next({
            key: listEntity.key,
            mode: ClimateMode.CLIMATE_MODE_COOL,
            currentTemperature: 25.5,
            targetTemperature: 23,
            currentHumidity: 40,
            targetHumidity: 45,
        });
        expect(component.ready).toBe(true);
        expect(component.mode).toBe(ClimateMode.CLIMATE_MODE_COOL);
        expect(component.currentTemperature).toBeCloseTo(25.5);
        expect(component.targetTemperature).toBeCloseTo(23);
        // A single-setpoint device only reports its one setpoint.
        expect(component.targetTemperatureLow).toBeUndefined();
        expect(component.targetTemperatureHigh).toBeUndefined();
        expect(component.currentHumidity).toBeCloseTo(40);
        expect(component.targetHumidity).toBeCloseTo(45);
    });

    it('exposes the two-point range instead of the single setpoint', () => {
        const twoPoint = new ClimateComponent(
            { ...listEntity, supportsTwoPointTargetTemperature: true },
            state,
            debugConnection,
        );
        state.next({ key: listEntity.key, targetTemperature: 21, targetTemperatureLow: 19, targetTemperatureHigh: 23 });

        expect(twoPoint.targetTemperature).toBeUndefined();
        expect(twoPoint.targetTemperatureLow).toBeCloseTo(19);
        expect(twoPoint.targetTemperatureHigh).toBeCloseTo(23);

        expect(component.targetTemperatureLow).toBeUndefined();
        expect(component.targetTemperatureHigh).toBeUndefined();
    });

    it('suppresses feedback the device cannot report', () => {
        const bare = new ClimateComponent(
            {
                ...listEntity,
                supportsCurrentTemperature: false,
                supportsAction: false,
                supportsCurrentHumidity: false,
                supportsTargetHumidity: false,
            },
            state,
            debugConnection,
        );
        state.next({
            key: listEntity.key,
            currentTemperature: 99,
            action: 2,
            currentHumidity: 70,
            targetHumidity: 65,
        });

        expect(bare.currentTemperature).toBeUndefined();
        expect(bare.action).toBeUndefined();
        expect(bare.currentHumidity).toBeUndefined();
        expect(bare.targetHumidity).toBeUndefined();
        expect(component.currentTemperature).toBeCloseTo(99);
        expect(component.action).toBe(ClimateAction.CLIMATE_ACTION_COOLING);
    });

    it('reports unknown wire enum values as undefined', () => {
        state.next({
            key: listEntity.key,
            mode: 99 as ClimateMode,
            action: 1 as ClimateAction,
            fanMode: 99 as ClimateFanMode,
            swingMode: 99 as ClimateSwingMode,
            preset: 99 as ClimatePreset,
        });
        expect(component.mode).toBeUndefined();
        // ClimateAction has no value 1: its values mirror ClimateMode.
        expect(component.action).toBeUndefined();
        expect(component.fanMode).toBeUndefined();
        expect(component.swingMode).toBeUndefined();
        expect(component.preset).toBeUndefined();
        expect(component.away).toBeUndefined();

        // Negative values are decodable too (a ten-byte two's-complement
        // varint), and every range check has a lower bound to reject them.
        // Unlike 99, -1 needs no cast: ts-proto's UNRECOGNIZED member makes
        // it a valid enum value.
        state.next({
            key: listEntity.key,
            mode: -1,
            action: -1,
            fanMode: -1,
            swingMode: -1,
            preset: -1,
        });
        expect(component.mode).toBeUndefined();
        expect(component.action).toBeUndefined();
        expect(component.fanMode).toBeUndefined();
        expect(component.swingMode).toBeUndefined();
        expect(component.preset).toBeUndefined();
        expect(component.away).toBeUndefined();
    });

    it('accepts the highest valid value of every state enum', () => {
        // The range checks exist for future enum values, so pin the accept side
        // at the current maximum: a bound that lags the enum by one member
        // would otherwise pass every other test.
        const boundary = new ClimateComponent(
            {
                ...listEntity,
                supportedModes: [ClimateMode.CLIMATE_MODE_AUTO],
                supportedFanModes: [ClimateFanMode.CLIMATE_FAN_QUIET],
                supportedSwingModes: [ClimateSwingMode.CLIMATE_SWING_HORIZONTAL],
                supportedPresets: [ClimatePreset.CLIMATE_PRESET_ACTIVITY],
            },
            state,
            debugConnection,
        );
        state.next({
            key: listEntity.key,
            mode: ClimateMode.CLIMATE_MODE_AUTO,
            action: ClimateAction.CLIMATE_ACTION_DEFROSTING,
            fanMode: ClimateFanMode.CLIMATE_FAN_QUIET,
            swingMode: ClimateSwingMode.CLIMATE_SWING_HORIZONTAL,
            preset: ClimatePreset.CLIMATE_PRESET_ACTIVITY,
        });

        expect(boundary.mode).toBe(ClimateMode.CLIMATE_MODE_AUTO);
        expect(boundary.action).toBe(ClimateAction.CLIMATE_ACTION_DEFROSTING);
        expect(boundary.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_QUIET);
        expect(boundary.swingMode).toBe(ClimateSwingMode.CLIMATE_SWING_HORIZONTAL);
        expect(boundary.preset).toBe(ClimatePreset.CLIMATE_PRESET_ACTIVITY);
        expect(boundary.away).toBe(false);
    });

    it('exposes fan, swing, preset and custom modes from state events', () => {
        expect(component.fanMode).toBeUndefined();
        expect(component.customFanMode).toBeUndefined();
        expect(component.swingMode).toBeUndefined();
        expect(component.preset).toBeUndefined();
        expect(component.customPreset).toBeUndefined();
        expect(component.away).toBeUndefined();

        state.next({
            key: listEntity.key,
            fanMode: ClimateFanMode.CLIMATE_FAN_HIGH,
            swingMode: ClimateSwingMode.CLIMATE_SWING_BOTH,
            preset: ClimatePreset.CLIMATE_PRESET_ECO,
        });
        expect(component.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_HIGH);
        expect(component.customFanMode).toBeUndefined();
        expect(component.swingMode).toBe(ClimateSwingMode.CLIMATE_SWING_BOTH);
        expect(component.preset).toBe(ClimatePreset.CLIMATE_PRESET_ECO);
        expect(component.away).toBe(false);

        state.next({
            key: listEntity.key,
            customFanMode: 'Silent',
            customPreset: 'Party',
        });
        expect(component.customFanMode).toBe('Silent');
        expect(component.customPreset).toBe('Party');

        // An empty string on the wire means no custom mode is active.
        state.next({ key: listEntity.key, customFanMode: '', customPreset: '' });
        expect(component.customFanMode).toBeUndefined();
        expect(component.customPreset).toBeUndefined();
    });

    it('keeps fan mode undefined for devices without fan control', () => {
        const noFan = new ClimateComponent(
            { ...listEntity, supportedFanModes: [], supportedCustomFanModes: [] },
            state,
            debugConnection,
        );
        state.next({ key: listEntity.key, fanMode: ClimateFanMode.CLIMATE_FAN_ON });
        // Without fan control the firmware reports the zero default, which
        // would otherwise read as "fan always on".
        expect(noFan.fanMode).toBeUndefined();
        expect(component.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_ON);
    });

    it('keeps fan mode undefined on a custom-fan-only device', () => {
        const customOnly = new ClimateComponent(
            { ...listEntity, supportedFanModes: [], supportedCustomFanModes: ['Silent'] },
            state,
            debugConnection,
        );
        state.next({ key: listEntity.key, fanMode: ClimateFanMode.CLIMATE_FAN_ON, customFanMode: 'Silent' });
        // Firmware leaves the regular fan mode at its proto default when it
        // only tracks a custom mode; the zero would otherwise read as
        // "fan always on".
        expect(customOnly.fanMode).toBeUndefined();
        expect(customOnly.customFanMode).toBe('Silent');
    });

    it('does not report a regular fan mode while a custom fan mode is active', () => {
        state.next({ key: listEntity.key, fanMode: ClimateFanMode.CLIMATE_FAN_ON, customFanMode: 'Silent' });
        // Firmware clears fan_mode while a custom mode is active; the zero
        // default must not read as the regular FAN_ON mode.
        expect(component.fanMode).toBeUndefined();
        expect(component.customFanMode).toBe('Silent');

        // Clearing the custom mode restores the reported regular mode.
        state.next({ key: listEntity.key, fanMode: ClimateFanMode.CLIMATE_FAN_HIGH, customFanMode: '' });
        expect(component.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_HIGH);
        expect(component.customFanMode).toBeUndefined();
    });

    it('keeps swing mode undefined for devices without swing control', () => {
        const noSwing = new ClimateComponent({ ...listEntity, supportedSwingModes: [] }, state, debugConnection);
        state.next({ key: listEntity.key, swingMode: ClimateSwingMode.CLIMATE_SWING_OFF });
        expect(noSwing.swingMode).toBeUndefined();
        expect(component.swingMode).toBe(ClimateSwingMode.CLIMATE_SWING_OFF);
    });

    it('normalises the preset from the legacy away flag before API 1.5', () => {
        const legacy = new ClimateComponent({ ...listEntity, legacySupportsAway: true }, state, debugConnection, {
            major: 1,
            minor: 4,
        });

        expect(legacy.preset).toBeUndefined();
        state.next({ key: listEntity.key, unusedLegacyAway: true, preset: ClimatePreset.CLIMATE_PRESET_BOOST });
        // Before API 1.5 only the away flag exists, so HOME/AWAY is all the
        // state can say; the preset field is ignored.
        expect(legacy.preset).toBe(ClimatePreset.CLIMATE_PRESET_AWAY);
        expect(legacy.away).toBe(true);

        state.next({ key: listEntity.key, unusedLegacyAway: false });
        expect(legacy.preset).toBe(ClimatePreset.CLIMATE_PRESET_HOME);
        expect(legacy.away).toBe(false);

        state.next({ key: listEntity.key, unusedLegacyAway: true });
        // The modern component ignores the legacy flag; with the preset field
        // absent from the state event, no preset is reported.
        expect(component.preset).toBeUndefined();
        expect(component.away).toBeUndefined();
    });

    it('reports the decoded preset default on a modern device without presets', () => {
        const noPresets = new ClimateComponent(
            { ...listEntity, supportedPresets: [], supportedCustomPresets: [], legacySupportsAway: false },
            state,
            debugConnection,
        );
        state.next({ ...ClimateStateResponse.decode(new Uint8Array()), key: listEntity.key });

        expect(noPresets.supportedPresets).toEqual([]);
        expect(noPresets.preset).toBe(ClimatePreset.CLIMATE_PRESET_NONE);
        expect(noPresets.away).toBe(false);
    });

    it('reports away for the AWAY preset on modern firmware', () => {
        state.next({ key: listEntity.key, preset: ClimatePreset.CLIMATE_PRESET_AWAY });
        // AWAY is not advertised by this device, but the state reports it
        // anyway: feedback is not suppressed by command support.
        expect(component.preset).toBe(ClimatePreset.CLIMATE_PRESET_AWAY);
        expect(component.away).toBe(true);
    });
});
