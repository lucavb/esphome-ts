# esphome-ts

This is a client library for use with [esphome](https://esphome.io).

## Example use

```typescript
const device = new EspDevice('192.168.0.20');
const espSwitch = new SwitchComponent('living_room_dehumidifier', device);
espSwitch.turnOn();
espSwitch.toggle();
espSwitch.state$.subscribe((state) => {
    console.log(`${state.id} is ${state.value ? 'on' : 'off'}`);
});

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
