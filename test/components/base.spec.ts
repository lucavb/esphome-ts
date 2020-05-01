import {BaseComponent, LightStateEvent} from '../../src';
import {ComponentType, LightEntity} from '../../src/components/entities';
import {Subject} from 'rxjs';
import {emptyCommandInterface} from '../../src/api/helpers';

class DemoComponent extends BaseComponent {

    get getType(): ComponentType {
        return 'light';
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

    let component: BaseComponent;

    const states = new Subject<LightStateEvent>();

    beforeEach(() => {
        component = new DemoComponent(listEntity, states, emptyCommandInterface);
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



});
