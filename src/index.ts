import {filter, take, tap} from 'rxjs/operators';
import {BinarySensorComponent} from './components/binarySensor';
import {EspDevice} from './api/espDevice';


const device = new EspDevice('10.0.0.118', '');
device.discovery$.pipe(
    filter((done) => done),
    take(1),
    tap(() => {
        const a = device.components['test_pir'] as BinarySensorComponent;
        // @ts-ignore
        console.log(a.name, a.listEntity);
        a.state$.subscribe((state) => {
            console.log(a);
        });
    }),
).subscribe();
