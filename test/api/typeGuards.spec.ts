import { of } from 'rxjs';
import { isSwitchComponent } from '../../src/api/typeGuards';
import { emptyCommandInterface } from '../../src/api/helpers';
import { LightComponent, SwitchComponent } from '../../src/components';

const entity = { key: 1, name: 'name', uniqueId: 'uniqueId', objectId: 'objectId' };

describe('isSwitchComponent', () => {
    it('accepts a switch component', () => {
        const component = new SwitchComponent(entity, of(), emptyCommandInterface);

        expect(isSwitchComponent(component)).toBe(true);
    });

    it('rejects other component kinds', () => {
        const component = new LightComponent(
            { ...entity, effects: [], supportsBrightness: true, supportsRgb: true },
            of(),
            emptyCommandInterface,
        );

        expect(isSwitchComponent(component)).toBe(false);
    });
});
