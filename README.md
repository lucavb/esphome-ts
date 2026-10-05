# esphome-ts

This is a client library for use with [esphome](https://esphome.io).

## Example use

```typescript
import { EspDevice, SwitchComponent } from 'esphome-ts';
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

`rxjs` (>= 7.8) is a peer dependency: install it next to the library (`npm install esphome-ts rxjs`).

Please see more [here](docs/index.md)

## Examples

See [examples/kitchenLights.ts](examples/kitchenLights.ts) for a runnable demo script (`npx tsx examples/kitchenLights.ts <device-host>`).

## Upgrading to v4

v4 is a breaking modernisation release. The package is now ESM-only (`"type": "module"`) and
requires Node.js >= 22.12.0; CommonJS consumers should stay on v3 (or use `require(esm)` on
Node >= 22.12). Import from the package root (e.g. `import { EspDevice } from 'esphome-ts'`) —
deep imports such as the previously documented `esphome-ts/dist` no longer resolve under the
exports map. The legacy `Connection` class, the `isLightComponent` type guard and internal helpers
(`decode`, `stateParser`, `convertNumbers`, `BytePositions`, …) are no longer exported; the public
surface is `EspDevice` (with `InvalidPasswordError`), `Client`, `EspSocket`, `Connection` (type),
`MessageTypes`, `ReadData`, the `isSwitchComponent` type guard, the `isTrue`/`isFalse` filters and
the component classes with their entity and state types. `EspDevice` now reconnects when a
connection attempt fails, reports invalid passwords and undecodable frames on its new `error$`
observable instead of stalling or crashing, and `Client.listEntities()` /
`Client.subscribeStateChange()` emit `void` instead of a placeholder message. The
generated protobuf layer now depends on `@bufbuild/protobuf` instead of `protobufjs`.

The transport layer was also reworked from inheritance to composition over a `Connection`
interface:

- `RxjsSocket` is internal now — it became `TcpConnection` and is no longer exported.
- `EspSocket` no longer exposes `data$`, `send()`, `timeout$`, `close(force)` — use
  `sendEspMessage` and `terminate()`.
- `reconnectOnTimeout`/`disconnectOnTimeout` are gone — an idle timeout always tears the
  connection down, and reconnection stays driven by `EspDevice`.
- If you need a custom transport, inject your own `Connection` via `EspDevice`'s new options
  parameter or via `EspSocket`'s config.

## Development

The protobuf layer in `src/api/protobuf/` is generated from the `.proto` files alongside it. After changing a `.proto` file, regenerate with:

```bash
npm run proto
```

This requires `protoc` on your `PATH` (e.g. `brew install protobuf`). Do not edit the generated files by hand.

## Contribution

Please, feel free to make a PR and contribute to this project. Esphome is a good project, and this expands their
ecosystem.

## License

While this project in general and my contributions (Luca Becker) are licensed under the GPLv3, the `.proto`
files are licensed under different licenses. Please see those files for their respective licenses. Copies
of their licenses have been saved in the `licenses` folder.
