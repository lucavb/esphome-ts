import { SensorComponent, type SensorStateEvent } from '../../src';
import { type CommandInterface } from '../../src/components/commandInterface';
import { Subject } from 'rxjs';
import { emptyCommandInterface } from '../../src/components/commandInterface';
import { type SensorEntity } from '../../src/components/entities';

describe('SensorComponent', () => {
    let component: SensorComponent;
    const commandInterface: CommandInterface = emptyCommandInterface;
    let stateObservable: Subject<SensorStateEvent>;
    let listEntity: SensorEntity;

    beforeEach(() => {
        stateObservable = new Subject<SensorStateEvent>();
        listEntity = {
            objectId: 'living_room_temperature',
            key: 1578816251,
            name: 'Living Room Temperature',
            uniqueId: 'test_esp2sensorliving_room_temperature',
            icon: 'mdi:thermometer',
            unitOfMeasurement: '°C',
            accuracyDecimals: 1,
        };
        component = new SensorComponent(listEntity, stateObservable, commandInterface);
        stateObservable.next({ key: listEntity.key, state: 21.5 });
    });

    it('should work with a state', () => {
        const value = 23;
        stateObservable.next({ key: listEntity.key, state: 23 });
        const status = component.value;
        expect(status).toBe(value);
    });

    it('expect unitOfMeasurement to match', () => {
        expect(component.unitOfMeasurement).toBe(listEntity.unitOfMeasurement);
    });

    it('expect icon to match', () => {
        expect(component.icon).toBe(listEntity.icon);
    });

    it('should says that it is a sensor', () => {
        expect(component.type).toBe('sensor');
    });

    it('exposes missingState while keeping the protobuf default value', () => {
        const events: SensorStateEvent[] = [];
        component.state$.subscribe((event) => events.push(event));

        stateObservable.next({ key: listEntity.key, state: 0, missingState: true });

        expect(component.value).toBe(0);
        expect(events[events.length - 1]?.missingState).toBe(true);
    });
});
