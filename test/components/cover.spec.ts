import { CoverComponent, type CoverStateEvent } from '../../src';
import { type CoverEntity } from '../../src/components/entities';
import { CoverCommandRequest, CoverOperation, LegacyCoverCommand } from '../../src/api/protobuf/api';
import { Subject } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';
import { MessageTypes } from '../../src/api/requestResponseMatching';

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
            deviceClass: 'garage',
        };
        state = new Subject<CoverStateEvent>();
        component = new CoverComponent(listEntity, state, debugConnection);
    });

    afterEach(() => {
        debugConnection.calls = [];
        state.complete();
    });

    it('open/close/stop send position and stop commands', () => {
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
        expect(tiltOnlyCover.position).toBeUndefined();
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
        expect(statelessCover.position).toBeUndefined();
        expect(statelessCover.tilt).toBeUndefined();
        expect(statelessCover.isClosed).toBe(true);
        expect(statelessCover.isOpen).toBe(false);
    });

    it('reports its type and entity details', () => {
        expect(component.type).toBe('cover');
        expect(component.supportsPosition).toBe(true);
        expect(component.supportsTilt).toBe(true);
        expect(component.assumedState).toBe(false);
    });
});
