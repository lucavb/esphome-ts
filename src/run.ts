import { EspDevice } from './api/espDevice';
import { filter, tap } from 'rxjs/operators';
import { isTrue } from './api/helpers';
import { SensorComponent } from './components/sensor';
import { pipe } from 'rxjs';

const device = new EspDevice('10.0.0.128');
const abc = pipe(tap(console.log), filter(isTrue));
device.discovery$
    .pipe(
        abc,
        filter(isTrue),
        tap(() => {
            // console.log(device);
            const rainSensor = device.components['rain_sensor'] as SensorComponent;
            console.log(rainSensor);
            rainSensor.state$.pipe(tap(console.log)).subscribe();
        }),
    )
    .subscribe();
