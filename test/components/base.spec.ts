import { BaseComponent, LightStateEvent } from '../../src';
import { ComponentType, LightEntity } from '../../src/components/entities';
import { Subject } from 'rxjs';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { DebugConnection } from '../testHelpers/debugConnection';

class DemoComponent extends BaseComponent {
    get type(): ComponentType {
        return 'light';
    }

    sendSomething(): void {
        this.queueCommand(
            MessageTypes.ConnectRequest,
            () => new Uint8Array([]),
        );
    }
}

describe('BaseComponent', () => {
    const listEntity: LightEntity = {
        key: 28934,
        name: 'my name',
        uniqueId: 'uniqueId',
        objectId: 'objectId',
        effects: [],
        supportsBrightness: false,
        supportsRgb: false,
    };

    let component: DemoComponent;
    const states = new Subject<LightStateEvent>();
    const debugConnection = new DebugConnection();

    beforeEach(() => {
        component = new DemoComponent(listEntity, states, debugConnection);
    });

    it('responds with the name', () => {
        expect(component.name).toEqual(listEntity.name);
    });

    it('implements ready correctly', () => {
        expect(component.ready).toBe(false);
        states.next({
            key: listEntity.key,
        });
        expect(component.ready).toBe(true);
    });

    it('returns the name with toString', () => {
        expect(component.toString()).toEqual(listEntity.name);
    });

    it('terminates the subscription', () => {
        component.terminate();
        states.next({
            key: listEntity.key,
        });
        expect(component.ready).toBe(false);
    });

    it('supports legacy getType call', () => {
        expect(component.getType).toBe(component.type);
    });

    it(
        'unblock after timeout',
        (done) => {
            component.sendSomething();
            component.sendSomething();
            expect(debugConnection.calls.length).toBe(1);
            setTimeout(() => {
                expect(debugConnection.calls.length).toBe(2);
                done();
            }, 33 * 1000);
        },
        40 * 1000,
    );
});
