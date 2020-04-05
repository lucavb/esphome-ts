# esphome-ts

This is a client library for use with [esphome](https://esphome.io).

## Example use

```typescript
import {EspDevice} from './api/espDevice';
import {filter, tap} from 'rxjs/operators';
import {SwitchComponent} from './components/switch';

const device = new EspDevice('my_esp.local');
device.discovery$.pipe(
    filter((value) => value),
    tap(() => {
        const sw = device.components['test_switch'] as SwitchComponent;
        sw.state$.subscribe((value) => {
            console.log(sw.status);
        });
    }),
).subscribe();

```

## Contribution

Please, feel free to make a PR and contribute to this project. Esphome is a good project, and this expands their
ecosystem.

## Caveats

Esphome provides and eventsource endpoint, that should provide a way for receiving updates without
polling every so often. This feature is enabled, but the connection appears to abort every so often.

## License

While this project in general and my contributions (Luca Becker) are licensed under the GPLv3, the `.proto`
files are licensed under different licenses. Please see those files for their respective licenses. Copies
of their licenses have been saved in the `licenses` folder.
