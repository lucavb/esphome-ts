import { filter, take, tap } from 'rxjs';
import { EspDevice, isSwitchComponent, isTrue, LightComponent } from '../src';

const host = process.argv[2];
if (!host) {
    console.log('Usage: npx tsx examples/kitchenLights.ts <device-host>');
    process.exit(1);
}

const device = new EspDevice(host);
device.discovery$
    .pipe(
        filter(isTrue),
        take(1),
        tap(() => {
            const kitchenLights = device.components['kitchen_lights:'] as LightComponent;
            const livingRoomDehumidifier = device.components['living_room_dehumidifier'];
            console.log(livingRoomDehumidifier.name);
            console.log(`kitchen lights available: ${kitchenLights.ready}`);

            if (isSwitchComponent(livingRoomDehumidifier)) {
                livingRoomDehumidifier.state$.pipe(tap(console.log)).subscribe();
                livingRoomDehumidifier.turnOff();
            }
        }),
    )
    .subscribe();

device.alive$.pipe(tap((val) => console.log('alive', val))).subscribe();
