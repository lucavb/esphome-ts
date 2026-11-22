import { CoverComponent, type CoverStateEvent } from '../../src';
import { type CoverEntity } from '../../src/components/entities';
import {
    CoverCommandRequest,
    CoverOperation,
    CoverStateResponse,
    LegacyCoverCommand,
    LegacyCoverState,
} from '../../src/api/protobuf/api';
import { Subject } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { stateParser } from '../../src/api/helpers';

describe('CoverComponent', () => {
    let component: CoverComponent;
    let listEntity: CoverEntity;
    let state: Subject<CoverStateEvent>;
    const debugConnection: DebugConnection = new DebugConnection();

    const sentCommand = (): CoverCommandRequest => CoverCommandRequest.decode(debugConnection.calls[0][1]);

    beforeEach(() => {
        listEntity = {
            key: 133,
            name: 'my cover',
            objectId: 'objectId',
            uniqueId: 'uniqueId',
            assumedState: false,
            supportsPosition: true,
            supportsTilt: true,
            supportsStop: true,
            deviceClass: 'garage',
        };
        state = new Subject<CoverStateEvent>();
        component = new CoverComponent(listEntity, state, debugConnection);
    });

    afterEach(() => {
        debugConnection.calls = [];
        state.complete();
    });

    it('open/close/stop send modern position and stop commands', () => {
        // The open → close → stop sequence also pins the disableSerialise
        // choice: a serialized command would wait for a state response that
        // feedback-less covers never send, so the later calls would never go
        // out and calls.length would stay below one per call.
        component.open();
        expect(debugConnection.calls.length).toBe(1);
        expect(debugConnection.calls[0][0]).toBe(MessageTypes.CoverCommandRequest);
        let command = sentCommand();
        expect(command.key).toBe(listEntity.key);
        expect(command.hasLegacyCommand).toBe(false);
        expect(command.legacyCommand).toBe(LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN);
        expect(command.hasPosition).toBe(true);
        expect(command.position).toBeCloseTo(1);
        expect(command.hasTilt).toBe(false);
        expect(command.tilt).toBeCloseTo(0);
        expect(command.stop).toBe(false);

        debugConnection.calls = [];
        component.close();
        expect(debugConnection.calls.length).toBe(1);
        command = sentCommand();
        expect(command.key).toBe(listEntity.key);
        expect(command.hasLegacyCommand).toBe(false);
        expect(command.hasPosition).toBe(true);
        expect(command.position).toBeCloseTo(0);
        expect(command.hasTilt).toBe(false);
        expect(command.stop).toBe(false);

        debugConnection.calls = [];
        component.stop();
        expect(debugConnection.calls.length).toBe(1);
        command = sentCommand();
        expect(command.key).toBe(listEntity.key);
        expect(command.hasLegacyCommand).toBe(false);
        expect(command.hasPosition).toBe(false);
        expect(command.position).toBeCloseTo(0);
        expect(command.hasTilt).toBe(false);
        expect(command.stop).toBe(true);
    });

    it('sends open and close for covers without position support', () => {
        const endstopEntity: CoverEntity = {
            ...listEntity,
            supportsPosition: false,
            supportsTilt: false,
        };
        const endstopCover = new CoverComponent(endstopEntity, state, debugConnection);

        endstopCover.open();
        expect(debugConnection.calls.length).toBe(1);
        expect(sentCommand().hasPosition).toBe(true);
        expect(sentCommand().position).toBeCloseTo(1);

        debugConnection.calls = [];
        endstopCover.close();
        expect(debugConnection.calls.length).toBe(1);
        expect(sentCommand().hasPosition).toBe(true);
        expect(sentCommand().position).toBeCloseTo(0);

        debugConnection.calls = [];
        endstopCover.setPosition(0.5);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('setPosition/setTilt send flagged position and tilt', () => {
        component.setPosition(0.3);
        expect(debugConnection.calls.length).toBe(1);
        const positionCommand = sentCommand();
        expect(positionCommand.key).toBe(listEntity.key);
        expect(positionCommand.hasPosition).toBe(true);
        expect(positionCommand.position).toBeCloseTo(0.3);
        expect(positionCommand.hasTilt).toBe(false);
        expect(positionCommand.hasLegacyCommand).toBe(false);
        expect(positionCommand.stop).toBe(false);

        debugConnection.calls = [];
        component.setTilt(0.7);
        expect(debugConnection.calls.length).toBe(1);
        const tiltCommand = sentCommand();
        expect(tiltCommand.key).toBe(listEntity.key);
        expect(tiltCommand.hasTilt).toBe(true);
        expect(tiltCommand.tilt).toBeCloseTo(0.7);
        expect(tiltCommand.hasPosition).toBe(false);
        expect(tiltCommand.hasLegacyCommand).toBe(false);
        expect(tiltCommand.stop).toBe(false);
    });

    it('sends nothing for unsupported position or tilt', () => {
        const statelessEntity: CoverEntity = {
            ...listEntity,
            supportsPosition: false,
            supportsTilt: false,
        };
        const statelessCover = new CoverComponent(statelessEntity, state, debugConnection);

        statelessCover.setPosition(0.5);
        statelessCover.setTilt(0.5);
        expect(debugConnection.calls.length).toBe(0);
    });

    it('mixes position and tilt support', () => {
        const tiltOnlyEntity: CoverEntity = {
            ...listEntity,
            supportsPosition: false,
            supportsTilt: true,
        };
        const tiltOnlyCover = new CoverComponent(tiltOnlyEntity, state, debugConnection);

        tiltOnlyCover.setPosition(0.5);
        expect(debugConnection.calls.length).toBe(0);
        tiltOnlyCover.setTilt(0.25);
        expect(debugConnection.calls.length).toBe(1);
        expect(sentCommand().hasTilt).toBe(true);
        expect(sentCommand().tilt).toBeCloseTo(0.25);
        expect(sentCommand().hasPosition).toBe(false);

        state.next({ key: listEntity.key, position: 1, tilt: 0.25 });
        expect(tiltOnlyCover.position).toBeCloseTo(1);
        expect(tiltOnlyCover.tilt).toBeCloseTo(0.25);
        expect(tiltOnlyCover.isClosed).toBe(false);
        expect(tiltOnlyCover.isOpen).toBe(true);
    });

    it('exposes position, tilt, operation and derived state from state events', () => {
        expect(component.position).toBeUndefined();
        expect(component.tilt).toBeUndefined();
        expect(component.operation).toBeUndefined();
        expect(component.isClosed).toBeUndefined();
        expect(component.isOpen).toBeUndefined();

        state.next({ key: listEntity.key });
        state.next({
            key: listEntity.key,
            position: 0.8,
            tilt: 0.4,
            currentOperation: CoverOperation.COVER_OPERATION_IS_OPENING,
        });
        expect(component.position).toBeCloseTo(0.8);
        expect(component.tilt).toBeCloseTo(0.4);
        expect(component.operation).toBe(CoverOperation.COVER_OPERATION_IS_OPENING);
        expect(component.isClosed).toBe(false);
        expect(component.isOpen).toBe(false);
    });

    it('guards position and tilt for stateless covers', () => {
        const statelessEntity: CoverEntity = {
            ...listEntity,
            supportsPosition: false,
            supportsTilt: false,
        };
        const statelessCover = new CoverComponent(statelessEntity, state, debugConnection);

        state.next({
            key: listEntity.key,
            position: 0,
            tilt: 0,
            currentOperation: CoverOperation.COVER_OPERATION_IDLE,
        });
        expect(statelessCover.position).toBeCloseTo(0);
        expect(statelessCover.tilt).toBeUndefined();
        expect(statelessCover.isClosed).toBe(true);
        expect(statelessCover.isOpen).toBe(false);
    });

    it('reports its type and entity details', () => {
        expect(component.type).toBe('cover');
        expect(component.supportsPosition).toBe(true);
        expect(component.supportsStop).toBe(true);
        expect(component.supportsTilt).toBe(true);
        expect(component.assumedState).toBe(false);
    });

    it('uses legacy state and legacy commands for API versions before 1.1', () => {
        const legacyCover = new CoverComponent(listEntity, state, debugConnection, { major: 1, minor: 0 });
        const legacyState = stateParser({
            type: MessageTypes.CoverStateResponse,
            payload: CoverStateResponse.encode({
                key: listEntity.key,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_CLOSED,
                position: 0,
                tilt: 0,
                currentOperation: CoverOperation.COVER_OPERATION_IDLE,
            }).finish(),
        });
        state.next(legacyState as CoverStateEvent);
        expect(legacyCover.isClosed).toBe(true);
        expect(legacyCover.isOpen).toBe(false);
        expect(legacyCover.position).toBeUndefined();

        legacyCover.open();
        let command = sentCommand();
        expect(command.hasLegacyCommand).toBe(true);
        expect(command.legacyCommand).toBe(LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN);
        expect(command.hasPosition).toBe(false);

        debugConnection.calls = [];
        legacyCover.close();
        command = sentCommand();
        expect(command.hasLegacyCommand).toBe(true);
        expect(command.legacyCommand).toBe(LegacyCoverCommand.LEGACY_COVER_COMMAND_CLOSE);
        expect(command.hasPosition).toBe(false);

        debugConnection.calls = [];
        legacyCover.stop();
        command = sentCommand();
        expect(command.hasLegacyCommand).toBe(true);
        expect(command.legacyCommand).toBe(LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP);
        expect(command.stop).toBe(false);

        debugConnection.calls = [];
        legacyCover.setPosition(0.5);
        legacyCover.setTilt(0.5);
        expect(debugConnection.calls).toHaveLength(0);
    });

    it('uses position state from API 1.1 even when legacy state conflicts', () => {
        const modernCover = new CoverComponent(listEntity, state, debugConnection, { major: 1, minor: 1 });
        state.next({
            key: listEntity.key,
            legacyState: 1,
            position: 0.75,
        });
        expect(modernCover.isClosed).toBe(false);
        expect(modernCover.isOpen).toBe(false);
        expect(modernCover.position).toBeCloseTo(0.75);
    });

    it('exposes effective position and tilt support as the negotiated version changes', () => {
        const negotiatedVersion = { major: 1, minor: 0 };
        const versionedCover = new CoverComponent(listEntity, state, debugConnection, negotiatedVersion);

        state.next({
            key: listEntity.key,
            legacyState: LegacyCoverState.LEGACY_COVER_STATE_CLOSED,
            position: 0,
            tilt: 0,
        });
        expect(versionedCover.supportsPosition).toBe(false);
        expect(versionedCover.supportsTilt).toBe(false);
        expect(versionedCover.position).toBeUndefined();
        expect(versionedCover.isClosed).toBe(true);
        versionedCover.setPosition(0.5);
        versionedCover.setTilt(0.5);
        expect(debugConnection.calls).toHaveLength(0);

        // EspDevice updates this shared version object when a reconnect
        // negotiates a new API version. The same existing component should
        // immediately expose and allow protocol-supported controls.
        negotiatedVersion.minor = 1;
        state.next({
            key: listEntity.key,
            legacyState: LegacyCoverState.LEGACY_COVER_STATE_CLOSED,
            position: 0.4,
            tilt: 0.3,
        });
        expect(versionedCover.supportsPosition).toBe(true);
        expect(versionedCover.supportsTilt).toBe(true);
        expect(versionedCover.position).toBeCloseTo(0.4);
        expect(versionedCover.tilt).toBeCloseTo(0.3);
        expect(versionedCover.isClosed).toBe(false);
        versionedCover.setPosition(0.6);
        expect(sentCommand().hasPosition).toBe(true);

        debugConnection.calls = [];
        versionedCover.setTilt(0.7);
        expect(sentCommand().hasTilt).toBe(true);

        negotiatedVersion.minor = 0;
        expect(versionedCover.supportsPosition).toBe(false);
        expect(versionedCover.supportsTilt).toBe(false);
        expect(versionedCover.position).toBeUndefined();
        expect(versionedCover.isClosed).toBe(true);
    });

    it('normalizes stop support across the API 1.8 boundary', () => {
        const supportsStopEntity: CoverEntity = { ...listEntity, supportsStop: true };
        const noStopEntity: CoverEntity = { ...listEntity, supportsStop: false };
        expect(new CoverComponent(noStopEntity, state, debugConnection, { major: 1, minor: 7 }).supportsStop).toBe(
            true,
        );
        expect(new CoverComponent(noStopEntity, state, debugConnection, { major: 1, minor: 8 }).supportsStop).toBe(
            false,
        );
        expect(
            new CoverComponent(supportsStopEntity, state, debugConnection, { major: 1, minor: 8 }).supportsStop,
        ).toBe(true);
        expect(new CoverComponent(noStopEntity, state, debugConnection, { major: 2, minor: 0 }).supportsStop).toBe(
            false,
        );
    });

    it('only sends stop when the negotiated API supports it', () => {
        const noStopCover = new CoverComponent({ ...listEntity, supportsStop: false }, state, debugConnection, {
            major: 1,
            minor: 8,
        });
        noStopCover.stop();
        expect(debugConnection.calls).toHaveLength(0);

        const stopCover = new CoverComponent({ ...listEntity, supportsStop: true }, state, debugConnection, {
            major: 1,
            minor: 8,
        });
        stopCover.stop();
        expect(debugConnection.calls).toHaveLength(1);
        expect(sentCommand().stop).toBe(true);

        debugConnection.calls = [];
        const pre18Cover = new CoverComponent({ ...listEntity, supportsStop: false }, state, debugConnection, {
            major: 1,
            minor: 7,
        });
        expect(pre18Cover.supportsStop).toBe(true);
        pre18Cover.stop();
        expect(debugConnection.calls).toHaveLength(1);
        expect(sentCommand().stop).toBe(true);
    });

    it('does not suppress position feedback when position control is unsupported', () => {
        const endstopEntity: CoverEntity = {
            ...listEntity,
            supportsPosition: false,
            supportsTilt: false,
        };
        const endstopCover = new CoverComponent(endstopEntity, state, debugConnection);
        state.next({ key: listEntity.key, position: 0.35 });
        expect(endstopCover.position).toBeCloseTo(0.35);
        expect(endstopCover.supportsPosition).toBe(false);
        expect(endstopCover.setPosition(0.5)).toBeUndefined();
        expect(debugConnection.calls).toHaveLength(0);
    });
});
