import { BinarySensorComponent, type BinarySensorStateEvent } from '../../src';
import { type CommandInterface } from '../../src/components/commandInterface';
import { Subject } from 'rxjs';
import { ListEntitiesBinarySensorResponse } from '../../src/api/protobuf/api';
import { emptyCommandInterface } from '../../src/api/helpers';
import { BinarySensorTypes } from '../../src/components/binarySensorTypes';
import { type BinarySensorEntity } from '../../src/components/entities';

describe('BinarySensorComponent', () => {
    let component: BinarySensorComponent;
    const commandInterface: CommandInterface = emptyCommandInterface;
    let stateObservable: Subject<BinarySensorStateEvent>;
    let listEntity: ListEntitiesBinarySensorResponse;

    beforeEach(() => {
        stateObservable = new Subject<BinarySensorStateEvent>();
        listEntity = {
            deviceClass: 'motion',
            key: 902392,
            name: 'name',
            objectId: 'objectId',
            uniqueId: 'unique',
            isStatusBinarySensor: false,
        };
        component = new BinarySensorComponent(listEntity, stateObservable, commandInterface);
        stateObservable.next({ key: listEntity.key });
    });

    it('should work with a state that has no state key', () => {
        stateObservable.next({ key: listEntity.key });
        const status = component.status;
        expect(status).toBe(false);
    });

    it('should work with a state that has a state key', () => {
        stateObservable.next({ key: listEntity.key, state: true });
        const status = component.status;
        expect(status).toBe(true);
    });

    it('getType responds with binary sensor', () => {
        expect(component.type).toEqual('binarySensor');
    });

    it('returns the deviceClass from listEntity or NONE', () => {
        expect(component.deviceClass).toEqual(listEntity.deviceClass);
        const withoutDeviceClass = listEntity as Partial<BinarySensorEntity>;
        delete withoutDeviceClass.deviceClass;
        expect(component.deviceClass).toEqual(BinarySensorTypes.NONE);
    });
});
