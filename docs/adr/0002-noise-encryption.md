# Noise encryption: a per-connection codec inside EspSocket

ESPHome's `api: encryption:` option wraps the native API in
`Noise_NNpsk0_25519_ChaChaPoly_SHA256`. The encryption is below the protobuf
layer: the Noise handshake runs first, then the normal `HelloRequest` /
`ConnectRequest` / discovery sequence travels through the resulting session.
Issue lucavb/homebridge-esphome-ts#506 asked for this support, and the old draft
PR lucavb/esphome-ts#866 failed because it wired the handshake into
`Client.hello()`/`connect()` and parsed encrypted frames per chunk instead of
owning the transport state.

## Decision

`EspSocket` owns a small internal `WireCodec` seam. It creates one codec per
connection generation:

- `createPlaintextCodec()` keeps today's `0x00`/varint framing and adds a
  first-chunk `0x01` check so an encrypted device is reported as
  `EncryptionRequiredError` instead of silently timing out.
- `createNoiseCodec(psk)` owns the handshake state machine, the ServerHello
  parse, and the two ChaCha20-Poly1305 transport ciphers.

The codec's `start()` writes the empty client-hello frame and the first Noise
message; `push()` consumes chunks and emits application frames only after the
session is ready; `seal()` encrypts outgoing commands. `EspSocket.sendEspMessage`
waits for the codec's ready signal (five seconds plaintext, sixty seconds Noise,
matching ESPHome's handshake timeout) and then seals. `EspSocket` keeps its parse
pipeline warm so the handshake advances even when a caller only sends commands.

Cryptographic primitives come from `node:crypto` only:

- X25519 key agreement (RFC 7748)
- ChaCha20-Poly1305 AEAD (RFC 8439)
- SHA-256 and HKDF (RFC 5869)

We do not implement any primitive ourselves. The Noise composition is a
spec-literal NNpsk0 state machine, pinned byte-for-byte by the published
cacophony vector and exercised with fragmentation and tamper tests.

## Considered options

- **`noise-handshake` / `noise-protocol` npm packages** — rejected: both
  hardcode `Noise_*_BLAKE2b`, so they cannot interoperate with ESPHome's
  `..._SHA256` variant.
- **`@richardhopton/noise-c.wasm`** — rejected for now: it is the reference
  `noise-c` implementation, but the package has been unmaintained since 2023 and
  adds a WASM + async-init dependency to an otherwise Node-native library.
- **`hjdhjd/esphome-client`'s Noise core** — rejected: version 2.1.0 now
  publicly exports `createESPHomeHandshake` and `CipherState`, but its public
  options cannot pin ephemeral keys (so the cacophony known-answer vector cannot
  run through it), it requires Node >= 22.20 while this package's floor is
  22.12, and it provides no ESPHome framing or lifecycle. The transcript fixture
  already pins this package's bytes to its output, which is the useful
  relationship without runtime coupling.
- **A Noise `Connection` decorator** — rejected: `Connection` is the raw byte
  seam; handshake readiness and session state would leak through it, and the
  ADR 0001 contract becomes harder to state.
- **A `NoiseClient` beside `Client`** — rejected: it duplicates the protobuf
  request/response logic and makes frame routing conditional, which is what
  broke draft PR lucavb/esphome-ts#866.
- **Update `api.proto`** — not needed for connecting with an existing key.
  ESPHome's newer dynamic provisioning (`noise_encryption_set_key`,
  `api_encryption_supported`) would need it and is a separate follow-up.

## Consequences

- `EspDevice` gains a fourth, additive options argument with `encryptionKey`.
  `new EspDevice(host, password?, port?, { connection?, encryptionKey? })`
  remains backward compatible.
- Encryption failures use a typed taxonomy:
    - `InvalidEncryptionKeyError` (terminal; carries the ServerHello name/MAC)
    - `EncryptionRequiredError` (terminal; no key configured)
    - `EncryptionPlaintextError` (terminal; key configured but device is plaintext)
    - `EncryptionHandshakeError` (retryable)
    - `InvalidEncryptionKeyFormatError` (thrown at construction for a bad key)
      `EspDevice` latches the terminal failures and stops reconnecting until
      `provideRetryObservable()` re-arms it, mirroring `InvalidPasswordError`.
- Transport/handshake failures use two retryable classes: `ConnectionHandshakeError`
  (the peer closed before sending any data, usually a wrong host/port) and
  `EncryptionHandshakeError` (a Noise handshake problem). Both feed the same
  one-second reconnect cadence.
- A reconnect creates a fresh codec, so the Noise ephemeral key, chaining key,
  and nonce counters never carry over between sessions.
- Encrypted payloads carry a four-byte plaintext header and a 16-byte
  authentication tag, so the maximum application payload is 65515 bytes.
  Firmware's receive buffer is smaller (8 KiB on ESP8266, 32 KiB elsewhere);
  the device remains the final authority on that limit.
- A Noise send waits up to 60 seconds for handshake readiness, matching
  ESPHome's own handshake timeout; the plaintext path keeps the five-second
  connect budget.
- `EspSocket.terminate()` is final and unsubscribes the codec pipeline and
  connection watchers. `EspSocket.disconnect()` drops only the current
  connection so `provideRetryObservable()` can reopen a fresh generation.
- Key-material zeroization is best-effort and deferred: Node Buffers can be
  copied by GC, and the socket-level PSK must persist for reconnects. A
  dedicated codec `destroy()` pass is a follow-up.
- Tests prove the core against the cacophony known-answer vector, pin the
  ESPHome-specific handshake and transport bytes against an independently
  generated transcript, and drive complete encrypted discovery plus a second
  session through the in-memory `Connection` seam.
