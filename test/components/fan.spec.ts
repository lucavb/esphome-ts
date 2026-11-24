import { FanComponent, type FanStateEvent } from '../../src';
import { type FanEntity } from '../../src/components/entities';
import { FanCommandRequest, FanDirection, FanSpeed } from '../../src/api/protobuf/api';
import { Subject } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';
import { MessageTypes } from '../../src/api/requestResponseMatching';

describe('FanComponent', () => {
    let component: FanComponent;
    let listEntity: FanEntity;
    let state: Subject<FanStateEvent>;
    const debugConnection: DebugConnection = new DebugConnection();

    const sentCommand = (): FanCommandRequest => FanCommandRequest.decode(debugConnection.calls[0][1]);

    beforeEach(() => {
        listEntity = {
            key: 134,
            name: 'my fan',
            objectId: 'objectId',
            uniqueId: 'uniqueId',
            supportsOscillation: true,
            supportsSpeed: true,
            supportsDirection: true,
            supportedSpeedCount: 3,
            supportedPresetModes: ['auto', 'sleep'],
        };
        state = new Subject<FanStateEvent>();
        component = new FanComponent(listEntity, state, debugConnection);
    });

    afterEach(() => {
        debugConnection.calls = [];
        state.complete();
    });

    it('sends turn on/off commands immediately and without serialising', () => {
        component.turnOn();
        component.turnOff();
        component.turnOn();

        expect(debugConnection.calls.length).toBe(3);
        expect(debugConnection.calls[0][0]).toBe(MessageTypes.FanCommandRequest);

        const commands = debugConnection.calls.map((call) => FanCommandRequest.decode(call[1]));
        expect(commands.map((command) => command.state)).toEqual([true, false, true]);
        for (const command of commands) {
            expect(command.key).toBe(listEntity.key);
            expect(command.hasState).toBe(true);
            // On/off is its own intent and must not reset speed, oscillation,
            // direction or preset.
            expect(command.hasSpeed).toBe(false);
            expect(command.hasSpeedLevel).toBe(false);
            expect(command.hasOscillating).toBe(false);
            expect(command.hasDirection).toBe(false);
            expect(command.hasPresetMode).toBe(false);
        }
    });

    it('sets a modern speed level with speed_level, not the deprecated enum', () => {
        component.setSpeedLevel(2);

        expect(debugConnection.calls.length).toBe(1);
        const command = sentCommand();
        expect(command.key).toBe(listEntity.key);
        expect(command.hasState).toBe(true);
        expect(command.state).toBe(true);
        expect(command.hasSpeedLevel).toBe(true);
        expect(command.speedLevel).toBe(2);
        expect(command.hasSpeed).toBe(false);
        expect(command.hasOscillating).toBe(false);
        expect(command.hasDirection).toBe(false);
        expect(command.hasPresetMode).toBe(false);
    });

    it('clamps speed levels to the negotiated range and treats 0 as off', () => {
        component.setSpeedLevel(99);
        expect(sentCommand().speedLevel).toBe(3);

        debugConnection.calls = [];
        component.setSpeedLevel(2.4);
        expect(sentCommand().speedLevel).toBe(2);

        debugConnection.calls = [];
        component.setSpeedLevel(2.6);
        expect(sentCommand().speedLevel).toBe(3);

        debugConnection.calls = [];
        component.setSpeedLevel(0.4);
        expect(sentCommand().speedLevel).toBe(1);
        expect(sentCommand().state).toBe(true);

        debugConnection.calls = [];
        component.setSpeedLevel(0);
        let command = sentCommand();
        expect(command.hasState).toBe(true);
        expect(command.state).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);

        debugConnection.calls = [];
        component.setSpeedLevel(-1);
        command = sentCommand();
        expect(command.hasState).toBe(true);
        expect(command.state).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);
    });

    it('rejects non-finite speed input instead of encoding an invalid command', () => {
        component.setSpeedLevel(Number.NaN);
        component.setSpeedLevel(Number.POSITIVE_INFINITY);
        component.setSpeedLevel(undefined as unknown as number);
        component.setSpeedPercentage(Number.NaN);
        component.setSpeedPercentage(Number.POSITIVE_INFINITY);
        component.setSpeedPercentage(undefined as unknown as number);

        expect(debugConnection.calls.length).toBe(0);
    });

    it('maps percentages onto discrete levels and 0 percent onto off', () => {
        component.setSpeedPercentage(1);
        expect(sentCommand().speedLevel).toBe(1);

        debugConnection.calls = [];
        component.setSpeedPercentage(50);
        expect(sentCommand().speedLevel).toBe(2);

        debugConnection.calls = [];
        component.setSpeedPercentage(34);
        expect(sentCommand().speedLevel).toBe(2);

        debugConnection.calls = [];
        component.setSpeedPercentage(67);
        expect(sentCommand().speedLevel).toBe(3);

        debugConnection.calls = [];
        component.setSpeedPercentage(99);
        expect(sentCommand().speedLevel).toBe(3);

        debugConnection.calls = [];
        component.setSpeedPercentage(100);
        expect(sentCommand().speedLevel).toBe(3);

        debugConnection.calls = [];
        component.setSpeedPercentage(120);
        expect(sentCommand().speedLevel).toBe(3);

        debugConnection.calls = [];
        component.setSpeedPercentage(0);
        let command = sentCommand();
        expect(command.hasState).toBe(true);
        expect(command.state).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);

        debugConnection.calls = [];
        component.setSpeedPercentage(-20);
        command = sentCommand();
        expect(command.hasState).toBe(true);
        expect(command.state).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);
    });

    it('prefers speed_level when API 1.5 reports both speed forms', () => {
        const api15Fan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 5 });
        state.next({ key: listEntity.key, state: true, speed: FanSpeed.FAN_SPEED_LOW, speedLevel: 3 });

        expect(api15Fan.speedLevel).toBe(3);
        expect(api15Fan.speedPercentage).toBe(100);
    });

    it('uses the modern speed path for a future major API version', () => {
        const majorTwoFan = new FanComponent(listEntity, state, debugConnection, { major: 2, minor: 0 });
        majorTwoFan.setSpeedLevel(2);

        expect(sentCommand().hasSpeedLevel).toBe(true);
        expect(sentCommand().speedLevel).toBe(2);
        expect(sentCommand().hasSpeed).toBe(false);
    });

    it('switches to the modern speed field exactly at API 1.4', () => {
        const api14Fan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 4 });
        api14Fan.setSpeedLevel(2);
        expect(sentCommand().hasSpeedLevel).toBe(true);
        expect(sentCommand().speedLevel).toBe(2);
        expect(sentCommand().hasSpeed).toBe(false);

        debugConnection.calls = [];
        const api13Fan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 3 });
        api13Fan.setSpeedLevel(2);
        expect(sentCommand().hasSpeed).toBe(true);
        expect(sentCommand().speed).toBe(FanSpeed.FAN_SPEED_MEDIUM);
        expect(sentCommand().hasSpeedLevel).toBe(false);
    });

    it('uses the legacy speed enum for API versions before 1.4', () => {
        const legacyFan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 3 });

        legacyFan.setSpeedLevel(1);
        expect(sentCommand().hasSpeed).toBe(true);
        expect(sentCommand().speed).toBe(FanSpeed.FAN_SPEED_LOW);
        expect(sentCommand().hasSpeedLevel).toBe(false);

        debugConnection.calls = [];
        legacyFan.setSpeedLevel(2);
        expect(sentCommand().speed).toBe(FanSpeed.FAN_SPEED_MEDIUM);

        debugConnection.calls = [];
        legacyFan.setSpeedLevel(3);
        expect(sentCommand().speed).toBe(FanSpeed.FAN_SPEED_HIGH);
        expect(sentCommand().hasSpeedLevel).toBe(false);
    });

    it('maps percentages for fans with more than three speed levels', () => {
        const fourSpeedFan = new FanComponent({ ...listEntity, supportedSpeedCount: 4 }, state, debugConnection);

        fourSpeedFan.setSpeedPercentage(25);
        expect(sentCommand().speedLevel).toBe(1);

        debugConnection.calls = [];
        fourSpeedFan.setSpeedPercentage(26);
        expect(sentCommand().speedLevel).toBe(2);

        debugConnection.calls = [];
        fourSpeedFan.setSpeedPercentage(100);
        expect(sentCommand().speedLevel).toBe(4);

        state.next({ key: listEntity.key, state: true, speedLevel: 3 });
        expect(fourSpeedFan.speedPercentage).toBe(75);
    });

    it('does not serialise speed commands behind each other', () => {
        component.setSpeedLevel(1);
        component.setSpeedLevel(3);

        expect(debugConnection.calls.length).toBe(2);
        expect(debugConnection.calls.map((call) => FanCommandRequest.decode(call[1]).speedLevel)).toEqual([1, 3]);
    });

    it('encodes the modern speed command with the expected wire tags', () => {
        component.setSpeedLevel(2);

        // Golden bytes pin the proto field numbers independently of the
        // generated encoder: key=134 fixed32, has_state=1, state=1,
        // has_speed_level=1 (field 10), speed_level=2 (field 11).
        expect([...debugConnection.calls[0][1]]).toEqual([
            0x0d, 0x86, 0x00, 0x00, 0x00, 0x10, 0x01, 0x18, 0x01, 0x50, 0x01, 0x58, 0x02,
        ]);
    });

    it('encodes the legacy speed command with the expected wire tags', () => {
        const legacyFan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 3 });
        legacyFan.setSpeedLevel(2);

        // Golden bytes pin the deprecated enum fields: key=134 fixed32,
        // has_state=1, state=1, has_speed=1 (field 4), speed=MEDIUM (field 5).
        expect([...debugConnection.calls[0][1]]).toEqual([
            0x0d, 0x86, 0x00, 0x00, 0x00, 0x10, 0x01, 0x18, 0x01, 0x20, 0x01, 0x28, 0x01,
        ]);
    });

    it('encodes oscillation, direction and preset with the expected wire tags', () => {
        const key = [0x0d, 0x86, 0x00, 0x00, 0x00];

        component.setOscillating(true);
        expect([...debugConnection.calls[0][1]]).toEqual([...key, 0x30, 0x01, 0x38, 0x01]);

        debugConnection.calls = [];
        component.setDirection(FanDirection.FAN_DIRECTION_REVERSE);
        expect([...debugConnection.calls[0][1]]).toEqual([...key, 0x40, 0x01, 0x48, 0x01]);

        debugConnection.calls = [];
        component.setPresetMode('auto');
        expect([...debugConnection.calls[0][1]]).toEqual([...key, 0x60, 0x01, 0x6a, 0x04, 0x61, 0x75, 0x74, 0x6f]);
    });

    it('sends oscillation and direction as partial commands', () => {
        component.setOscillating(true);
        let command = sentCommand();
        expect(command.hasOscillating).toBe(true);
        expect(command.oscillating).toBe(true);
        expect(command.hasState).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);
        expect(command.hasDirection).toBe(false);

        debugConnection.calls = [];
        component.setOscillating(false);
        command = sentCommand();
        expect(command.hasOscillating).toBe(true);
        expect(command.oscillating).toBe(false);
        expect(command.hasState).toBe(false);

        debugConnection.calls = [];
        component.setDirection(FanDirection.FAN_DIRECTION_REVERSE);
        command = sentCommand();
        expect(command.hasDirection).toBe(true);
        expect(command.direction).toBe(FanDirection.FAN_DIRECTION_REVERSE);
        expect(command.hasState).toBe(false);
        expect(command.hasOscillating).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);

        debugConnection.calls = [];
        component.setDirection(FanDirection.FAN_DIRECTION_FORWARD);
        command = sentCommand();
        expect(command.hasDirection).toBe(true);
        expect(command.direction).toBe(FanDirection.FAN_DIRECTION_FORWARD);

        debugConnection.calls = [];
        component.setDirection(FanDirection.UNRECOGNIZED);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('only sends preset modes the fan advertises and can clear them', () => {
        component.setPresetMode('sleep');
        let command = sentCommand();
        expect(command.hasPresetMode).toBe(true);
        expect(command.presetMode).toBe('sleep');
        expect(command.hasState).toBe(false);
        expect(command.hasSpeedLevel).toBe(false);

        debugConnection.calls = [];
        component.setPresetMode('');
        command = sentCommand();
        expect(command.hasPresetMode).toBe(true);
        expect(command.presetMode).toBe('');
        expect(command.hasState).toBe(false);

        debugConnection.calls = [];
        component.setPresetMode('turbo');
        expect(debugConnection.calls.length).toBe(0);
    });

    it('sends nothing for unsupported capabilities', () => {
        const limitedEntity: FanEntity = {
            ...listEntity,
            supportsOscillation: false,
            supportsSpeed: false,
            supportsDirection: false,
            supportedSpeedCount: 0,
            supportedPresetModes: [],
        };
        const limitedFan = new FanComponent(limitedEntity, state, debugConnection);

        limitedFan.setSpeedLevel(2);
        limitedFan.setSpeedPercentage(50);
        limitedFan.setOscillating(true);
        limitedFan.setDirection(FanDirection.FAN_DIRECTION_REVERSE);
        limitedFan.setPresetMode('auto');
        limitedFan.setPresetMode('');

        expect(debugConnection.calls.length).toBe(0);
        expect(limitedFan.supportsSpeed).toBe(false);
        expect(limitedFan.supportsOscillation).toBe(false);
        expect(limitedFan.supportsDirection).toBe(false);
        expect(limitedFan.speedCount).toBe(0);
        expect(limitedFan.speedLevel).toBeUndefined();
        expect(limitedFan.speedPercentage).toBeUndefined();
        expect(limitedFan.oscillating).toBeUndefined();
        expect(limitedFan.direction).toBeUndefined();
        expect(limitedFan.supportedPresetModes).toEqual([]);

        // Real state frames always decode oscillating=false and
        // direction=FORWARD; the getters must still hide unsupported fields.
        state.next({
            key: listEntity.key,
            state: true,
            oscillating: true,
            direction: FanDirection.FAN_DIRECTION_REVERSE,
            speedLevel: 2,
        });
        expect(limitedFan.oscillating).toBeUndefined();
        expect(limitedFan.direction).toBeUndefined();
        expect(limitedFan.speedLevel).toBeUndefined();

        const missingPresets = new FanComponent(
            { ...listEntity, supportedPresetModes: undefined as unknown as string[] },
            state,
            debugConnection,
        );
        expect(missingPresets.supportedPresetModes).toEqual([]);
    });

    it('exposes the current state and speed as a percentage', () => {
        expect(component.status).toBe(false);
        expect(component.speedLevel).toBeUndefined();
        expect(component.speedPercentage).toBeUndefined();
        expect(component.oscillating).toBeUndefined();
        expect(component.direction).toBeUndefined();
        expect(component.presetMode).toBe('');

        state.next({
            key: listEntity.key,
            state: true,
            oscillating: true,
            direction: FanDirection.FAN_DIRECTION_REVERSE,
            speedLevel: 1,
            presetMode: 'auto',
        });

        expect(component.status).toBe(true);
        expect(component.speedLevel).toBe(1);
        expect(component.speedPercentage).toBe(33);
        expect(component.oscillating).toBe(true);
        expect(component.direction).toBe(FanDirection.FAN_DIRECTION_REVERSE);
        expect(component.presetMode).toBe('auto');

        state.next({ key: listEntity.key, state: true, speedLevel: 2 });
        expect(component.speedPercentage).toBe(66);
        state.next({ key: listEntity.key, state: true, speedLevel: 3 });
        expect(component.speedPercentage).toBe(100);
    });

    it('translates the legacy speed enum into levels for old firmware', () => {
        const legacyFan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 3 });

        state.next({ key: listEntity.key, state: true, speed: FanSpeed.FAN_SPEED_LOW });
        expect(legacyFan.speedLevel).toBe(1);
        expect(legacyFan.speedPercentage).toBe(33);

        state.next({ key: listEntity.key, state: true, speed: FanSpeed.FAN_SPEED_MEDIUM });
        expect(legacyFan.speedLevel).toBe(2);
        expect(legacyFan.speedPercentage).toBe(66);

        state.next({ key: listEntity.key, state: true, speed: FanSpeed.FAN_SPEED_HIGH });
        expect(legacyFan.speedLevel).toBe(3);
        expect(legacyFan.speedPercentage).toBe(100);

        state.next({ key: listEntity.key, state: true, speed: FanSpeed.UNRECOGNIZED });
        expect(legacyFan.speedLevel).toBeUndefined();
        expect(legacyFan.speedPercentage).toBeUndefined();

        state.next({ key: listEntity.key, state: true, speed: undefined });
        expect(legacyFan.speedLevel).toBeUndefined();
    });

    it('retains the last speed while the fan is off and reports level 0 as unset', () => {
        state.next({ key: listEntity.key, state: false, speedLevel: 2 });
        expect(component.status).toBe(false);
        expect(component.speedLevel).toBe(2);
        expect(component.speedPercentage).toBe(66);

        state.next({ key: listEntity.key, state: true, speedLevel: 0 });
        expect(component.status).toBe(true);
        expect(component.speedLevel).toBe(0);
        expect(component.speedPercentage).toBe(0);
    });

    it('rejects invalid wire directions in the getter', () => {
        state.next({
            key: listEntity.key,
            state: true,
            direction: 5 as unknown as FanDirection,
        });
        expect(component.direction).toBeUndefined();

        state.next({
            key: listEntity.key,
            state: true,
            direction: FanDirection.UNRECOGNIZED,
        });
        expect(component.direction).toBeUndefined();
    });

    it('falls back to three levels only for legacy firmware', () => {
        const oldEntity: FanEntity = { ...listEntity, supportedSpeedCount: 0 };
        const modernFan = new FanComponent(oldEntity, state, debugConnection);
        expect(modernFan.speedCount).toBe(0);
        expect(modernFan.supportsSpeed).toBe(false);

        const legacyFan = new FanComponent(oldEntity, state, debugConnection, { major: 1, minor: 3 });
        expect(legacyFan.speedCount).toBe(3);
        expect(legacyFan.supportsSpeed).toBe(true);

        const unsupportedWithCount = new FanComponent(
            { ...listEntity, supportsSpeed: false, supportedSpeedCount: 4 },
            state,
            debugConnection,
        );
        expect(unsupportedWithCount.speedCount).toBe(0);
        expect(unsupportedWithCount.supportsSpeed).toBe(false);
    });

    it('clamps out-of-range wire speed values before exposing them', () => {
        state.next({ key: listEntity.key, state: true, speedLevel: 99 });
        expect(component.speedLevel).toBe(3);
        expect(component.speedPercentage).toBe(100);

        state.next({ key: listEntity.key, state: true, speedLevel: -4 });
        expect(component.speedLevel).toBeUndefined();
        expect(component.speedPercentage).toBeUndefined();

        state.next({ key: listEntity.key, state: true, speedLevel: Number.NaN });
        expect(component.speedLevel).toBeUndefined();

        const legacyFan = new FanComponent(listEntity, state, debugConnection, { major: 1, minor: 3 });
        state.next({ key: listEntity.key, state: true, speed: 99 as unknown as FanSpeed });
        expect(legacyFan.speedLevel).toBeUndefined();
        expect(legacyFan.speedPercentage).toBeUndefined();
    });

    it('reports its type and entity details', () => {
        expect(component.type).toBe('fan');
        expect(component.name).toBe('my fan');
        expect(component.key).toBe(listEntity.key);
        expect(component.supportsSpeed).toBe(true);
        expect(component.supportsOscillation).toBe(true);
        expect(component.supportsDirection).toBe(true);
        expect(component.speedCount).toBe(3);
        expect(component.supportedPresetModes).toEqual(['auto', 'sleep']);
    });
});
