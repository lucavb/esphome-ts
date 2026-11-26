# [5.4.0](https://github.com/lucavb/esphome-ts/compare/v5.3.0...v5.4.0) (2026-11-26)


### Features

* **climate:** add climate component with setpoints, modes and presets ([0b22cc4](https://github.com/lucavb/esphome-ts/commit/0b22cc461443d0d4c374b78dddf28a3955f5c0e0))

# [5.3.0](https://github.com/lucavb/esphome-ts/compare/v5.2.1...v5.3.0) (2026-11-25)


### Features

* **light:** support color modes, white and color temperature ([9846129](https://github.com/lucavb/esphome-ts/commit/9846129a08889b555c38e55daf5bc84e8ecfdf9a)), closes [#908](https://github.com/lucavb/esphome-ts/issues/908)

## [5.2.1](https://github.com/lucavb/esphome-ts/compare/v5.2.0...v5.2.1) (2026-11-24)


### Bug Fixes

* **api:** reject the all-zero encryption key sentinel ([cb7b413](https://github.com/lucavb/esphome-ts/commit/cb7b4136bc9acd7f4b303e3fe197652286be84af))

# [5.2.0](https://github.com/lucavb/esphome-ts/compare/v5.1.3...v5.2.0) (2026-11-24)


### Features

* **api:** support ESPHome Noise API encryption ([f7cfad5](https://github.com/lucavb/esphome-ts/commit/f7cfad5ca70247f74bb86dd238a25fcbe892487f)), closes [lucavb/homebridge-esphome-ts#506](https://github.com/lucavb/homebridge-esphome-ts/issues/506)
* **fan:** add fan component with speed, direction and presets ([75bc9be](https://github.com/lucavb/esphome-ts/commit/75bc9be7f6158e3865556104f7a244f82b45f6c8))

## [5.1.3](https://github.com/lucavb/esphome-ts/compare/v5.1.2...v5.1.3) (2026-11-23)


### Bug Fixes

* **deps:** update vulnerable vite resolution ([40fda84](https://github.com/lucavb/esphome-ts/commit/40fda848f683b42cf50cfff50a318e2d65e96c6b))

## [5.1.2](https://github.com/lucavb/esphome-ts/compare/v5.1.1...v5.1.2) (2026-11-22)


### Bug Fixes

* **api:** support modern ESPHome discovery ([8f3439c](https://github.com/lucavb/esphome-ts/commit/8f3439c0733cf7c65f031f99c39e43d112321df5))

## [5.1.1](https://github.com/lucavb/esphome-ts/compare/v5.1.0...v5.1.1) (2026-11-22)


### Bug Fixes

* **cover:** respect negotiated protocol capabilities ([26c8ce4](https://github.com/lucavb/esphome-ts/commit/26c8ce45ba35fa068b8d6b9173ecfe83e8c0d938))

# [5.1.0](https://github.com/lucavb/esphome-ts/compare/v5.0.0...v5.1.0) (2026-10-11)


### Features

* **cover:** add cover component with open, close, stop, position and tilt ([417ec7e](https://github.com/lucavb/esphome-ts/commit/417ec7e780379a55640badf46874a6cbec1f7c6a)), closes [#676](https://github.com/lucavb/esphome-ts/issues/676)

# [5.0.0](https://github.com/lucavb/esphome-ts/compare/v4.0.0...v5.0.0) (2026-10-06)


* feat(api)!: de-duplicate state events and make password rejection terminal ([f237939](https://github.com/lucavb/esphome-ts/commit/f2379397ee6faf06b84f869704d526159ff78eb0))
* refactor(api)!: collapse the socket stack into the Connection seam ([79f3c04](https://github.com/lucavb/esphome-ts/commit/79f3c04dba2a17db5d542fae3c99cf64b5109c42))


### BREAKING CHANGES

* component state$ no longer re-emits identical re-sent
states; subscribers observe actual changes only. A rejected password no
longer auto-retries: call provideRetryObservable() to re-arm
auto-reconnect after an InvalidPasswordError.
* RxjsSocket and RxjsSocketConfiguration are no longer
exported; the class lives on as internal TcpConnection. EspSocket loses
data$, send(), timeout$ and close(force?) -- use sendEspMessage() and
terminate(); unframed bytes are no longer reachable. The
reconnectOnTimeout and disconnectOnTimeout knobs are removed: the idle
timeout now always tears the connection down, and reconnection stays
driven by EspDevice. EspDevice gains an additive options constructor
parameter ({ connection }) and the Connection type is exported for
custom transports.

# [4.0.0](https://github.com/lucavb/esphome-ts/compare/v3.3.1...v4.0.0) (2026-10-05)


* build!: migrate to ESM, TypeScript 6, ESLint 10, Vitest 5 ([5663d9d](https://github.com/lucavb/esphome-ts/commit/5663d9d376d25908186e44fb80e2994da1175e3b))
* feat!: regenerate protobuf layer with ts-proto 2 and @bufbuild/protobuf ([4a4bf65](https://github.com/lucavb/esphome-ts/commit/4a4bf65d693b915fec18ba4709a77928c9b0761a))
* refactor!: remove shadow connection stack, fix leaks, curate public API ([e7600ec](https://github.com/lucavb/esphome-ts/commit/e7600ecb754a5578f14761fee4b07a93d1f8d853))


### Bug Fixes

* **api:** reassemble frames split across TCP chunks ([9449e4a](https://github.com/lucavb/esphome-ts/commit/9449e4a0012946af2aab59932b4300dd128aed2e))


### Features

* **api:** add framer module owning the wire format ([2d3d61c](https://github.com/lucavb/esphome-ts/commit/2d3d61c52af2c73e1c7315b36944df5e4aab3160))


### BREAKING CHANGES

* Connection, ReadData, framing constants (BytePositions,
HEADER_SIZE), decode/stateParser/createComponents and other internal helpers
are no longer exported; the public surface is EspDevice, Client, RxjsSocket,
MessageTypes, type guards and the component classes. convertNumbers and
DEFAULT_NO_EFFECT are no longer exported either.
* generated surface changes: ExecuteServiceArgument fields
renamed (int_/string_/bool_/float_ to int/string/bool/float), APIConnection
service types dropped (outputServices=false).
* the published package is ESM-only and requires Node >=22.12.0; CommonJS consumers must go through require(esm) on Node 22.12+/24.15+.

## [3.3.1](https://github.com/lucavb/esphome-ts/compare/v3.3.0...v3.3.1) (2023-05-07)


### Bug Fixes

* **deps:** move rxjs to become a peerdependency ([c5f1722](https://github.com/lucavb/esphome-ts/commit/c5f1722b7e24fa5917ca2d062a7ef8ad5cb265d1))

# [3.3.0](https://github.com/lucavb/esphome-ts/compare/v3.2.0...v3.3.0) (2021-06-10)


### Features

* release deviceClass ([56a8244](https://github.com/lucavb/esphome-ts/commit/56a8244c5f62c98066155fa61626c1e0be68a165))

# [3.2.0](https://github.com/lucavb/esphome-ts/compare/v3.1.1...v3.2.0) (2021-06-08)


### Features

* **deps:** rxjs@7 release commit ([32ccd14](https://github.com/lucavb/esphome-ts/commit/32ccd14caedec692479c950c94d6e71cf0c4d73e))

## [3.1.1](https://github.com/lucavb/esphome-ts/compare/v3.1.0...v3.1.1) (2021-04-05)


### Bug Fixes

* **api:** exchanging wrong interface / no longer decoding per default coverstate ([f4a82ba](https://github.com/lucavb/esphome-ts/commit/f4a82ba1f371f4299a7f89dbb522656f95c4018d))

# [3.1.0](https://github.com/lucavb/esphome-ts/compare/v3.0.5...v3.1.0) (2021-03-07)


### Bug Fixes

* **test:** updating typeguard ([10238e6](https://github.com/lucavb/esphome-ts/commit/10238e6790034ead36b8b6a7f58571317a3a3368))


### Features

* **protobuf:** updating proto definitions ([5567a97](https://github.com/lucavb/esphome-ts/commit/5567a9788fa811e14ff6b5f0fce5197a57c1bd85))
