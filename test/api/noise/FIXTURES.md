# Noise test fixtures

Two independent pins guard the encrypted transport:

## 1. Noise composition: cacophony known-answer vector

`noiseVector.ts` is copied verbatim from the published cacophony vectors:

- https://github.com/haskell-cryptography/cacophony/blob/master/vectors/cacophony.txt
- entry `Noise_NNpsk0_25519_ChaChaPoly_SHA256`

It uses the vector's own prologue (`"John Galt"`), so it tests the Noise
composition rather than ESPHome's prologue. `crypto.spec.ts` asserts both
handshake messages, the handshake hash, and alternating transport messages
byte-for-byte.

## 2. ESPHome wire layer: `esphomeTranscript.ts`

This fixture pins the ESPHome-specific layer: the empty client hello, the
ESPHome prologue, the `[0x01][BE16 length]` outer frame, the handshake status
byte, the `[type BE16][length BE16][payload]` inner header, and both transport
directions.

It was generated with `hjdhjd/esphome-client` **2.1.0** (ISC), specifically
`dist/crypto-noise.js`, using its ESPHome prologue and deterministic X25519
keys. The outer and inner frames were built directly from the wire
specification; they are also corroborated by that package's production
transport.

Fixed inputs:

| Input               | Value                           |
| ------------------- | ------------------------------- |
| PSK                 | `000102...1f` (32 bytes)        |
| initiator ephemeral | `11...11` (32 bytes)            |
| responder ephemeral | `22...22` (32 bytes)            |
| server name / MAC   | `kitchen` / `AA:BB:CC:DD:EE:FF` |
| client command      | type 33, payload `0801`         |
| server state        | type 26, payload `0801`         |

To regenerate:

1. `npm pack esphome-client@2.1.0 && tar -xzf esphome-client-2.1.0.tgz`
2. In `package/dist/crypto-noise.js`, add `createPrivateKey` to the
   `node:crypto` import and replace the body of `generateX25519KeyPair()` with
   a function that returns the fixed keys above (PKCS8 prefix
   `302e020100300506032b656e04220420` + the raw 32-byte scalar).
3. Instantiate `createESPHomeHandshake({ role: 'initiator', psk })`, write msg1;
   instantiate the responder, read msg1, write msg2; read msg2 on the initiator;
   split both sides.
4. Build the outer frames exactly as in `src/api/noise/frameCodec.ts` and the
   inner `[type BE16][length BE16][payload]` plaintext, then compare the hex with
   `esphomeTranscript.ts`.

`transcript.spec.ts` replays the fixture through this repository's
`createNoiseCodec` and fails if any prologue, frame header, status byte, type,
length, or AEAD byte drifts.
