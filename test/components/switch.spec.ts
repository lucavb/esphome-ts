import { SwitchComponent, SwitchStateEvent } from '../../src';
import { ListEntity } from '../../src/components/entities';
import { Subject } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';
import { MessageTypes } from '../../src/api/requestResponseMatching';

describe('SwitchComponent', () => {
    let component: SwitchComponent;
    let listEntity: ListEntity;
    const state: Subject<SwitchStateEvent> = new Subject<SwitchStateEvent>();
    const debugConnection: DebugConnection = new DebugConnection();

    beforeEach(() => {
        listEntity = {
            key: 133,
            name: 'my switch',
            objectId: 'objectId',
            uniqueId: 'uniqueId',
        };
        component = new SwitchComponent(listEntity, state, debugConnection);
    });

    afterEach(() => {
        debugConnection.calls = [];
    });

    it('turnon/turnoff', () => {
        component.turnOn();
        expect(debugConnection.calls.length).toBe(1);
        expect(debugConnection.calls[0][0]).toBe(MessageTypes.SwitchCommandRequest);
        debugConnection.calls = [];
        component.turnOff();
        expect(debugConnection.calls.length).toBe(1);
        expect(debugConnection.calls[0][0]).toBe(MessageTypes.SwitchCommandRequest);
    });

    it('returns the state', () => {
        state.next({ key: listEntity.key });
        expect(component.status).toBe(false);
        state.next({ key: listEntity.key, state: true });
        expect(component.status).toBe(true);
    });

    it('says that it is a switch', () => {
        expect(component.type).toBe('switch');
    });
});
