# esphome-ts

A TypeScript client library for ESPHome devices: it connects to a device over TCP, speaks the ESPHome native API wire format, and exposes the device's components as RxJS streams.

## Language

### Talking to a device

**Device**:
The physical ESPHome device the library is talking to. `EspDevice` is the module representing it.
_Avoid_: board, node

**Connection**:
The live path between the library and a Device, along which frames travel as byte chunks. A Connection can be a real TCP path or an in-memory one in specs; both satisfy the same interface. Being connected is not the same as the Device being alive — see Liveness.
_Avoid_: session, channel, transport

**Frame**:
The single wire unit: a fixed three-byte header (marker byte, length byte, type byte) followed by up to 255 payload bytes. One frame carries one message.
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

**Client**:
The protocol module that sends messages and correlates responses with requests.
_Avoid_: gateway

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
One named entity on a Device: a Switch, Light, Sensor, or BinarySensor.
_Avoid_: entity, accessory

**Component kind**:
Which of the four shapes a Component has.
_Avoid_: flavor, device type
