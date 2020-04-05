import {NativeApiEspDevice} from './native_api/espDevice';
import {filter, take, tap} from 'rxjs/operators';
import {LightComponent} from './components/light';


const device = new NativeApiEspDevice('10.0.0.118', '');
device.discovery$.pipe(
    filter((done) => done),
    take(1),
    tap(() => {
        const a = device.components['test_led'] as LightComponent;
        console.log(a.name);
        a.state$.subscribe((state) => {
            console.log(state);
        });
        a.state$.pipe(
            take(1),
            tap((state) => {
                const rgb = a.getRgb();
                rgb!.red = 5;
                a.setRgb(rgb!);
            }),
        ).subscribe();
    }),
).subscribe();
