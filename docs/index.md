# esphome-ts Documentation

This project implements the esphome native API in Typescript and provides
a RxJS based interface to it.

## Getting started

```typescript
import { EspDevice, SwitchComponent } from 'esphome-ts/dist';
import { filter, tap } from 'rxjs/operators';

const device = new EspDevice('my_esp.local');
device.discovery$
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
```

You always want to start with an instance of `EspDevice`. This is your starting
point. You have to supply a hostname or an IP address, and can optionally
supply a password, if required, and a different port number. The `EspDevice`
will automatically try to connect to your device. Once it has done so, a list
of standard commands will be sent, authenticating the client, if required, and
querying the device for information on its component(s).

Once this process is done, `true` will be emmited through `discovery$` observable,
hence the filter pipe. Afterwards, you can access the discovered components via the
`components` dictionary. You just have to know the name of your component.
_Beware of the naming scheme of esphome here_.

## Supported components

At this point in time lights, binary sensors, regular sensors and switches are
supported. Every component inherits from `BaseComponent` and exposes a state
observable `state$`. Depending on the component, different pieces of information
will be shared. This provides rather raw access to the underlying state and should
probably only be used to call the methods on the component itself.

### Light component

Supports the following actions:

-   turn on, turn off
-   set brightness
-   set color (rgb, hsv)
-   and respective get methods

### Binary sensor

-   get status

### Switch

-   turn on, turn off
-   get status

### Sensor

-   get value

Typescript should point out most values that you can expect and their names have been
somewhat reasonable, so I won't go into detail what they do.

## Connection management

This library will automatically respond to PingRequest from your device. You shouldn't really
have to interact with such low level stuff. Should you decide to do this anyways, then the
classes `Client` and `Connection` are of interest to you. `Client` is on a higher level
and already allows you do send specific messages to your ESP. `Connection` on the other hand
is much more low level and requires you to provide byte arrays and will offer you an observable
that provides you with the responses.
