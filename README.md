# esphome-ts

This is a client library for use with [esphome](https://esphome.io).

## Example use

```typescript
import {EspDevice, SwitchComponent} from 'esphome-ts/dist';
import {filter, tap} from 'rxjs/operators';

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

Please see more [here](docs/index.md)

## Contribution

Please, feel free to make a PR and contribute to this project. Esphome is a good project, and this expands their
ecosystem.

## License

While this project in general and my contributions (Luca Becker) are licensed under the GPLv3, the `.proto`
files are licensed under different licenses. Please see those files for their respective licenses. Copies
of their licenses have been saved in the `licenses` folder.
