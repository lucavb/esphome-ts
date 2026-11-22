# esphome-ts Documentation

This project implements the esphome native API in Typescript and provides
a RxJS based interface to it.

## Getting started

```typescript
import { EspDevice, SwitchComponent } from 'esphome-ts';
import { filter, tap } from 'rxjs';

const device = new EspDevice('my_esp.local');
const subscription = device.discovery$
    .pipe(
        filter((value) => value),
        tap(() => {
            const sw = device.components['test_switch'] as SwitchComponent;
            sw.state$.subscribe((value) => {
                console.log(sw.status);
            });
        }),
    )
    .subscribe();

// Call `subscription.unsubscribe()` to stop watching, and `device.terminate()`
// to tear the device down for good.
```

You always want to start with an instance of `EspDevice`. This is your starting
point. You have to supply a hostname or an IP address, and can optionally
supply a password, if required, and a different port number. The `EspDevice`
will automatically try to connect to your device. Once it has done so, a list
of standard commands will be sent, authenticating the client, if required, and
querying the device for information on its component(s).

Once this process is done, `true` will be emitted through `discovery$` observable,
hence the filter pipe. Afterwards, you can access the discovered components via the
`components` dictionary. When ESPHome supplies an object ID, that ID is normally the dictionary key.
Newer devices can omit object IDs; those components receive a key derived from their numeric
entity key instead. Use `Object.values(device.components)` and component properties when you
cannot rely on an object ID. If an entity's object ID changes on reconnect, the existing
component instance and its original dictionary key are retained by numeric entity key. If
different entities report the same nonempty object ID, the first keeps that dictionary key and
later collisions use a key-derived fallback instead.
Numeric entity keys are not guaranteed to remain the same across device changes.

ESPHome 2026.1 removed native API password authentication. For older devices a supplied password
is still sent and a rejection is reported on `error$`; newer devices may not send an authentication
response. This library does not support ESPHome's Noise-encrypted API connections.

## Supported components

At this point in time lights, binary sensors, regular sensors and switches are
supported. Every component inherits from `BaseComponent` and exposes a state
observable `state$`. Depending on the component, different pieces of information
will be shared. This provides rather raw access to the underlying state and should
probably only be used to call the methods on the component itself.
Identical re-sent states are de-duplicated: `state$` emits only when the state
actually changes.

### Light component

Supports the following commands:

- turn on, turn off
- set brightness
- set color (rgb, hsv)
- and respective get methods

### Binary sensor

- get status

### Switch

- turn on, turn off
- get status

### Sensor

- get value

Typescript should point out most values that you can expect and their names have been
somewhat reasonable, so I won't go into detail what they do.

## Connection management

`EspDevice` manages the connection lifecycle for you: it opens the connection when it is
constructed, reconnects when the connection drops (and retries once per second while the device
cannot be reached), and `terminate()` tears everything down.

Failures that cannot be fixed by reconnecting are reported on `EspDevice.error$`: an
`InvalidPasswordError` when the device rejects the password (the handshake then stops, so
`discovery$` never emits), and the decode error of any discovery frame the device sent that
could not be parsed — undecodable state frames are dropped silently. `EspSocket` owns the
wire format end to end: it reports its own connection errors, and
commands that could not be sent, on its `error$`.

You shouldn't really have to interact with such low level stuff. Should you decide to do this
anyways, then the classes `Client` and `EspSocket` are of interest to you. `EspSocket` handles the
connection (a real TCP path, or any `Connection` you inject) and the message framing, while
`Client` is on a higher level and already allows you to send specific messages to your ESP. There
is no separate raw-socket class: `EspSocket` is the lowest level the library exports.
