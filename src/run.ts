import { filter, take, tap } from 'rxjs/operators';
import { EspDevice, isTrue } from './api';
import { BaseComponent } from './components/base';
import { CoverComponent } from './components/cover';

const device = new EspDevice('172.16.0.112');
device.discovery$
    .pipe(
        filter(isTrue),
        take(1),
        tap(() => {
            for (const [key, value] of Object.entries(device.components)) { 
                console.log(key, value.type);
                if (value instanceof CoverComponent) {
                    value.open();
                    value.close();
                    value.stop();
                }
            }
        }),
    )
    .subscribe();

device.alive$.pipe(tap((val) => console.log('alive', val))).subscribe();
