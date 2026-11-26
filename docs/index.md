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

The all-zero 32-byte key is also rejected as `InvalidEncryptionKeyFormatError`:
ESPHome reserves it as the unprovisioned provisioning sentinel, not a usable
protection key. A future `noise_encryption_set_key` provisioning path must use
that zero PSK internally rather than routing it through user connection config.

The device name and MAC carried by `InvalidEncryptionKeyError` come from the
ServerHello, which ESPHome sends outside the Noise transcript. Treat them as
reported identification hints, not verified identity.

## Supported components

At this point in time lights, binary sensors, regular sensors, switches, covers,
fans and climate components are supported. Entities are addressed by their key
on the main device; ESPHome sub-devices (`devices:`, non-zero `device_id`) are
not modelled, and keys are unique only within a device. Every component
inherits from `BaseComponent` and exposes a state observable `state$`.
Depending on the component, different pieces of information
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
- set and get the color mode (`setColorMode`, `colorMode`)
- set and get the white channel (`white`) and the color temperature in mireds
  (`colorTemperature`); set the cold and warm white channel levels with
  `setColdWarmWhite` and read them with `coldWhite`/`warmWhite`
- set and get the color brightness (`colorBrightness`)

#### Color modes

ESPHome firmware that advertises `supportedColorModes` (ESPHome 2021.8 and
later, which reports API 1.6) can be switched between color and white without
encoding white as rgb values. `supportsColorMode` tells you whether the device
does; on older firmware the component keeps sending the legacy rgb / brightness
commands and the new setters are no-ops.

`supportedColorModes` is the list of advertised `ColorMode` values (on firmware
that predates color modes it is derived from the legacy boolean capabilities).
Its members are capability bitmasks, so a mode can be tested with its enum
value: `COLOR_MODE_RGB = 35` means `ON_OFF | BRIGHTNESS | RGB`. `ColorMode` is
exported from the package root. Mode values newer than this client knows are
ignored; if no known mode remains, the capability getters report no color
support and only on/off commands are sent.

The capability getters (`supportsRgb`, `supportsBrightness`,
`supportsWhiteValue`, `supportsColorTemperature`) are derived from the
advertised modes. When firmware predates color modes they are derived from the
deprecated capability booleans instead, matching Home Assistant's
`supported_color_modes_compat`.

`supportsWhiteValue` is specifically the single white-channel capability
(`COLOR_MODE_WHITE` / `COLOR_MODE_RGB_WHITE`). An rgbww or cwww light reports
`false` here even though it can display white: its white output is driven
through `colorTemperature` or `setColdWarmWhite`, and `supportsColorTemperature`
is the getter that stays true. The `white` setter is likewise a no-op on such a
light, because there is no WHITE-capable mode to select.

Commands choose the simplest supported mode for the values they carry. A
brightness change sends only `brightness` and keeps the active mode, `turnOn`
sends only the on/off state (the firmware keeps its active mode across
on/off), and `setColorMode` changes the mode without touching the stored channel
values or the on/off state:

```typescript
// rgbww light with color_interlock: switches white -> color.
lights.setColorMode(ColorMode.COLOR_MODE_RGB);
// and back; the firmware reuses the stored white channels.
lights.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
```

If the white channels have never been driven, set `colorTemperature` or
`setColdWarmWhite` instead of a bare mode switch: the switch reuses whatever
levels the firmware stored, which may be zero. Switching back to color likewise
reuses the stored color brightness, which may be 0 after a white session; set a
color with `rgb`/`hsv` to give it intensity.

The white, cold/warm white and color temperature setters turn the light on, like
`setBrightness` and the `rgb`/`hsv` setters. White output is the master
brightness multiplied by the channel level: with `setBrightness(30)`,
`white = 100` yields 30% white, and the same applies to `setColdWarmWhite`. For
an absolute level, set the master brightness as well (`setBrightness(level)`
with `white = 100`), which is what Home Assistant's white control sends.

Levels are exposed as `0..100`, like `getBrightness`/`setBrightness`; `rgb` and
`hsv` keep their existing `0..255` / `0..360` ranges. `rgb` includes both the
master brightness and the color brightness, while `getBrightness()` and
`hsv.value` report the master brightness on their own. The `rgb`/`hsv` setters
send the full color at the requested master brightness and set color brightness
to 100%; on a device whose color brightness another controller lowered, an `rgb`
round-trip keeps the visual color, while an `hsv` round-trip moves the color
brightness into the master and looks brighter. `setBrightness(0)` and a black
`rgb`/`hsv` value turn a color-mode light off; negative or non-finite brightness
is treated as zero. Lights without the brightness capability ignore
`setBrightness`, including 0; use `turnOff`. A zero white level (`white = 0`, or
`setColdWarmWhite({coldWhite: 0, warmWhite: 0})`) turns the light off when the
selected white mode has no color channel to fall back on. `colorBrightness` is a
modifier for the active RGB mode: setting it does not change the light's state
or mode, and the component only sends it while an RGB-capable mode is active:
firmware treats a positive value as an RGB request, which would switch an
interlocked light back to color. Value getters report the
channels the firmware stored for each mode; firmware keeps the inactive mode's
channels, so consult `colorMode` to know which value is currently driving the
light.

Color temperature is reported and set in mireds. Firmware accepts
`color_temperature` when the active mode has the color-temperature or
cold/warm-white capability, and clamps it to the advertised mired range. ESPHome
leaves cold/warm white channel temperatures unset by default, so a bare
`rgbww`/`cwww` light reports `minMireds = maxMireds = 0`; configuring
`cold_white_color_temperature` / `warm_white_color_temperature` in the YAML
provides the range. On a cold/warm-white light without a range the component
follows Home Assistant: `colorTemperature` drives both white channels at full,
which is neutral white. `supportsColorTemperature` is still true there (the
device can display white), but read `minMireds`/`maxMireds` before showing a
temperature slider. The getter returns `undefined` until the device reports a
usable value, and when a mired range exists the setter also sends the mired
value so it can be read back. Use `setColdWarmWhite` for explicit channel
levels.

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

### Climate

- get the operating `mode`, the `action` the device is currently performing,
  the measured `currentTemperature`, the `targetTemperature` setpoint (or the
  `targetTemperatureLow`/`targetTemperatureHigh` range on two-point devices)
  and, where reported, `currentHumidity`/`targetHumidity`
- set the operating mode (`setMode`), the setpoints
  (`setTargetTemperature`, or `setTargetTemperatureLow`/`setTargetTemperatureHigh`
  and the atomic `setTargetTemperatureRange` on devices that advertise
  two-point support) and the humidity setpoint (`setTargetHumidity`)
- set and get the fan mode (`setFanMode`, `fanMode`), a custom fan mode
  (`setCustomFanMode`, `customFanMode`), the swing mode (`setSwingMode`,
  `swingMode`), a preset (`setPreset`, `preset`, `away`) and a custom preset
  (`setCustomPreset`, `customPreset`)
- capability getters describe what the device supports:
  `supportedModes`, `supportedFanModes`, `supportedCustomFanModes`,
  `supportedSwingModes`, `supportedPresets`, `supportedCustomPresets`,
  `supportsCurrentTemperature`, `supportsTwoPointTargetTemperature`,
  `supportsAction`, `supportsCurrentHumidity`, `supportsTargetHumidity`, and
  the `visualMinTemperature`/`visualMaxTemperature`/`visualTemperatureStep`
  (and humidity) ranges plus `temperatureUnit` for UI rendering and, on some
  platforms, hard setpoint limits

All setter methods ignore values the device does not advertise (and non-finite
numbers) and return without an error; check the capability getters first.

`setMode` accepts OFF without requiring it in the advertised list: firmware
seeds its supported-mode set with OFF, so the list normally includes it, and a
platform that removes it will warn-and-drop the OFF command like any other
unsupported mode. Every other mode must be advertised. `setTargetTemperature`
is a no-op on two-point devices, where firmware only accepts the low/high pair.
The visual temperature range is a UI hint: neither the setters nor the API
command layer clamp to it, though platform control loops (for example the
thermostat platform) may still clamp to the visual range. The API command
layer only rejects NaN, the single setpoint on two-point devices, and a paired
range whose low exceeds its high; use `setTargetTemperatureRange` when
changing both bounds so that check applies atomically. While a custom fan mode
is active, `fanMode` is undefined and `customFanMode` carries the active mode.

A state event with `missingState` set means the device has not produced a
valid state yet; every climate state getter returns undefined until a real
state arrives (the capability getters are static list-entity data and remain
available). `state$` and `ready` still fire: an event arrived, the stream is
live. Sensors and binary sensors do not suppress such frames — they expose
the protobuf defaults (0 and false) — but their `state$` events carry the
`missingState` flag if you need to filter. Firmware older than ESPHome 2026.10
does not send the flag, so a never-published climate device can still surface
placeholder values there.

Mode and preset values changed as ESPHome grew. Firmware that predates the
heat/cool and auto split reports its automatic heat/cool mode as
`CLIMATE_MODE_HEAT_COOL` (the wire value it always used); `CLIMATE_MODE_AUTO`
is the newer, separate mode and is only sent when the device advertises it.
Firmware before API 1.5 has no presets, only an away toggle: the component
maps it to the `CLIMATE_PRESET_HOME`/`CLIMATE_PRESET_AWAY` presets in both
directions, so `preset`/`setPreset` behave the same for the HOME/AWAY presets.
On those devices `preset` is undefined when the firmware does not advertise
away support. Clearing with `CLIMATE_PRESET_NONE` is the exception: legacy
firmware with away support applies it as away-off (which reads back as HOME),
while legacy firmware without away support drops the command and `preset`
stays undefined. Newer firmware may drop NONE if it is not advertised.
On modern firmware a device that advertises no presets reports
`CLIMATE_PRESET_NONE` (and `away === false`) after its first state; use
`supportedPresets` as the capability signal. While a custom preset is active,
`preset` reads `CLIMATE_PRESET_NONE` (and `away` is false) and `customPreset`
carries the name. This differs from `fanMode`, which is suppressed to undefined
under a custom fan mode. Components are retained across reconnects: re-discovery
refreshes their capability data and API version, so a firmware update that
changes capabilities is reflected without recreating the objects.
Custom fan modes and custom presets have no clear command — switching to a
regular mode or `setPreset(CLIMATE_PRESET_NONE)` clears them on the firmware
side, though firmware that does not advertise the NONE preset drops the
command instead of applying it.

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
