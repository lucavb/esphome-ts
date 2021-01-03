import { filter, tap } from 'rxjs/operators';
import { pipe } from 'rxjs';
import { EspDevice } from './api/espDevice';
import { isTrue } from './api/helpers';
import { LightComponent } from './components/light';

const device = new EspDevice('10.0.0.128');
const abc = pipe(tap(console.log), filter(isTrue));
device.discovery$
    .pipe(
        abc,
        filter(isTrue),
        tap(() => {
            const kitchenLights = device.components['fastled_ws2811_light'] as LightComponent;

            kitchenLights.state$.subscribe(console.log);
            console.log(kitchenLights.availableEffects());
            const flicker = 'Flicker';
            setInterval(() => {
                kitchenLights.effect = flicker;
            }, 1 * 1000);
        }),
    )
    .subscribe();
