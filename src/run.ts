import { filter, take, tap } from 'rxjs/operators';
import { LightComponent } from './components/light';
import { EspDevice, isSwitchComponent, isTrue } from './api';

const device = new EspDevice('172.16.0.112');
device.discovery$
    .pipe(
        filter(isTrue),
        take(1),
        tap(() => {
            const kitchenLights = device.components['kitchen_lights:'] as LightComponent;
            const livingRoomDehumidifier = device.components['living_room_dehumidifier'];
            console.log(livingRoomDehumidifier.name);

            if (isSwitchComponent(livingRoomDehumidifier)) {
                livingRoomDehumidifier.state$.pipe(tap(console.log)).subscribe();
                livingRoomDehumidifier.turnOff();
            }
        }),
    )
    .subscribe();

device.alive$.pipe(tap((val) => console.log('alive', val))).subscribe();
