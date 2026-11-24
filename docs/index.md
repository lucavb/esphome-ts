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
response. Devices that use ESPHome's Noise transport encryption require `encryptionKey` instead of
`password`.

## API encryption

If the device's YAML has an `api: encryption: key:`, pass that value as the
`encryptionKey` option. The key is the base64 string exactly as ESPHome prints it;
it must decode to 32 bytes.

```typescript
const device = new EspDevice('my_esp.local', '', 6053, {
    encryptionKey: 'qWHsO5CS0tz2Y4ZGYMicOAyFGIrWlu3wVHm8HTEIBms=',
});
```

Encryption is negotiated before the first protobuf message, so the normal
`HelloRequest`/`ConnectRequest`/discovery flow and every later command and state
update travel through the encrypted session. `password` and `encryptionKey` are
alternatives: ESPHome does not allow both in one device configuration. A key that
is not a base64-encoded 32-byte value throws `InvalidEncryptionKeyFormatError`
from the `EspDevice` constructor.

The device name and MAC carried by `InvalidEncryptionKeyError` come from the
ServerHello, which ESPHome sends outside the Noise transcript. Treat them as
reported identification hints, not verified identity.

## Supported components

At this point in time lights, binary sensors, regular sensors, switches, covers
and fans are supported. Every component inherits from `BaseComponent` and exposes a state
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

### Fan

- turn on, turn off, get status
- set a speed level (`setSpeedLevel`, 1..`speedCount`, or 0 to turn off) or a percentage
  (`setSpeedPercentage`, 0..100 where 0 turns the fan off), get `speedLevel` and
  `speedPercentage`. Setting a non-zero speed also turns the fan on. ESPHome
  keeps the last speed while a fan is off, so use `status` for on/off and treat
  the speed getters as the last reported level.
- set and get oscillation, direction and preset mode when the fan supports them;
  `setPresetMode('')` clears the active preset
- `supportsSpeed`, `supportsOscillation`, `supportsDirection` and
  `supportedPresetModes` describe the negotiated capabilities

Fans on API versions before 1.4 use the legacy three-valued `FanSpeed` enum.
Firmware 1.4/1.5 may report both that enum and `speed_level`; the component
prefers `speed_level` from 1.4 onward. The component translates between the
legacy enum and speed levels internally, so `speedLevel` and `setSpeedLevel`
behave the same on old and new firmware.

Typescript should point out most values that you can expect and their names have been
somewhat reasonable, so I won't go into detail what they do.

## Connection management

`EspDevice` manages the connection lifecycle for you: it opens the connection when it is
constructed, reconnects when the connection drops (and retries once per second while the device
cannot be reached), and `terminate()` tears everything down.

Failures that cannot be fixed by reconnecting are reported on `EspDevice.error$`: an
`InvalidPasswordError` when the device rejects the password, an
`InvalidEncryptionKeyError` when it rejects the encryption key, an
`EncryptionRequiredError` when the device requires encryption but no key was configured,
and an `EncryptionPlaintextError` when a plaintext frame arrives while a key was
configured. In all four cases the handshake stops, so `discovery$` never emits, and
the device does not reconnect until `provideRetryObservable()` is called again. A
plaintext device more often just closes during the Noise hello; that surfaces as a
retryable `ConnectionHandshakeError` with a hint to check the host/port and
whether the device uses or requires API encryption, and the normal one-second
reconnect cadence continues. A retryable
`EncryptionHandshakeError` covers Noise handshake problems (malformed ServerHello,
unsupported protocol, or a connection dropped after the handshake started), and a
`ConnectionHandshakeError` covers a peer that closes before sending any data
(usually a wrong host/port). Only the terminal classes latch: a persistent
protocol incompatibility keeps retrying once per second and re-emits the
retryable error on each attempt. The decode
error of any discovery frame the device sent that could not be parsed is reported
too — undecodable state frames are dropped silently. `EspSocket` owns the wire
format end to end: it reports its own connection errors, and commands that could
not be sent, on its `error$`.

You shouldn't really have to interact with such low level stuff. Should you decide to do this
anyways, then the classes `Client` and `EspSocket` are of interest to you. `EspSocket` handles the
connection (a real TCP path, or any `Connection` you inject) and the message framing, while
`Client` is on a higher level and already allows you to send specific messages to your ESP. There
is no separate raw-socket class: `EspSocket` is the lowest level the library exports.
`EspSocket.terminate()` is final: it tears down the codec pipeline and the connection watchers.
Use `EspSocket.disconnect()` to drop only the current connection while keeping the socket
reusable with a later `open()`.
