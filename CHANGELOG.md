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
