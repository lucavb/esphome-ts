import {SwitchComponent} from '../../src';
import {ListEntity} from '../../src/components/entities';
import {Subject} from 'rxjs';
import {SwitchStateResponse} from '../../src/api/protobuf/api';
import {emptyCommandInterface} from '../../src/api/helpers';


describe('SwitchComponent', () => {

    let component: SwitchComponent;
    let listEntity: ListEntity;
    let state: Subject<SwitchStateResponse>;

    beforeEach(() => {
        component = new SwitchComponent(listEntity, state, emptyCommandInterface);
    });

});
