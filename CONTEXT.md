# esphome-ts

A TypeScript client library for ESPHome devices: it connects to a device over TCP, speaks the ESPHome native API wire format, and exposes the device's components as RxJS streams.

## Language

### Talking to a device

**Device**:
The physical ESPHome device the library is talking to. `EspDevice` is the module representing it.
_Avoid_: board, node

**Connection**:
The live path between the library and a Device, along which frames travel as byte chunks. The TCP path is the production Connection; any implementation satisfying the same interface may substitute for it. Being connected is not the same as the Device being alive — see Liveness.
_Avoid_: session, channel, transport

**Frame**:
The single plaintext wire unit: marker byte `0x00`, unsigned-varint payload length, unsigned-varint message type, then up to 65535 payload bytes. One frame carries one message. The encrypted transport uses Noise frames instead.
_Avoid_: packet, chunk

**Message**:
The typed payload a frame carries — a HelloRequest, a SwitchStateResponse, and so on.
_Avoid_: frame (when you mean its typed content)

**Framer**:
The module that owns the wire format in both directions and reassembles frames from TCP chunks, regardless of where chunk boundaries fall.
_Avoid_: parser (the decode half only), codec (hides the stream state)

**Carry-over buffer**:
The bytes of a frame that has not fully arrived yet, held by the framer between chunks.
_Avoid_: backlog

**Encryption key**:
The base64 32-byte pre-shared key from a Device's `api: encryption: key:`. One per Device. It authenticates the Noise handshake and keys the Session.
_Avoid_: password (the older authentication secret), key (ambiguous)

**Noise handshake**:
The pre-protobuf exchange that proves the Encryption key and establishes a Session. Its frames are not Message frames; no protobuf traffic is sent until it completes.
_Avoid_: login, authentication

**Noise frame**:
The encrypted wire unit: indicator byte `0x01`, 16-bit big-endian payload length, then the payload. During the handshake the payload is a Noise handshake message; afterwards it is one encrypted Message.
_Avoid_: packet

**Session**:
The pair of directional ChaCha20-Poly1305 cipher states produced by one Noise handshake. A Session lasts exactly one Connection; every reconnect performs a fresh handshake and resets the nonces.
_Avoid_: connection (the transport), encryption layer

**Codec**:
The transport-internal module that owns one wire format in both directions: plaintext or Noise. `EspSocket` creates one Codec per Connection generation.
_Avoid_: framer (plaintext only), parser

**Client**:
The protocol module that sends messages and correlates responses with requests.
_Avoid_: gateway

**Protocol version**:
The `major.minor` version a Device reports in its Hello response. Wire-format differences are gated on it: cover position and tilt before 1.1, the three-valued fan speed enum before 1.4, the legacy away flag before 1.5, advertised cover stop support before 1.8. `EspDevice` owns the single live value and adopts each handshake; Components read it through `atLeast` and their own feature thresholds.
_Avoid_: API level, firmware version

### Life of a device

**Discovery**:
The phase after connecting where the Device announces its components; completes once all list responses have arrived. `EspDevice.discovery$` is a flag that flips to `true` at that point; it does not complete.
_Avoid_: scan, enumeration

**Liveness**:
Whether the Device is still answering. `EspDevice.alive$` combines socket connectivity with a traffic-based timeout: it is `false` while disconnected and also when a connected Device falls silent.
_Avoid_: heartbeat, availability

**Command**:
An instruction sent to a component — turn a switch on, set a light's brightness — serialized as a message in a frame.
_Avoid_: action, request

### What is on a device

**Component**:
One named entity on a Device: a Switch, Light, Sensor, BinarySensor, Cover, Fan, or Climate.
_Avoid_: entity, accessory

**Component kind**:
Which of the supported shapes a Component has.
_Avoid_: flavor, device type

**Component-kind registry**:
The module that maps a Component kind's list and state messages to its decoders and Component factory. The Component table resolves every list frame through it, so adding a kind is one registry entry.
_Avoid_: component factory (it also decodes state), entity map

**Component table**:
The set of Components one Device currently exposes, keyed by the public ids `EspDevice.components` returns. It owns Discovery's reconciliation: each list frame is decoded through the Component-kind registry, then the entity's Component is created, rebound onto the retained instance, or replaced when the kind changed. The numeric entity key is the identity; a rebuild keeps the instance unless the kind moved.
_Avoid_: entity map, component dictionary, kind registry
