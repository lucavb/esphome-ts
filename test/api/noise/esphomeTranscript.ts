/**
 * ESPHome-layer known-answer transcript.
 *
 * Generated with hjdhjd/esphome-client 2.1.0 (ISC), specifically
 * `dist/crypto-noise.js`, using its ESPHome prologue and fixed ephemeral keys.
 * The outer ESPHome frames and inner type/length headers were built directly
 * from the wire specification for generation, so this fixture is independent of
 * this repository's framing and Noise composition.
 *
 * Fixed inputs:
 *   PSK                  000102...1f
 *   initiator ephemeral  1111...11
 *   responder ephemeral  2222...22
 *   server name/MAC      kitchen / AA:BB:CC:DD:EE:FF
 *
 * The fixture pins:
 *   - the empty client-hello frame and ESPHome prologue transcript
 *   - the exact msg1/msg2 handshake frames
 *   - the first client→server and server→client transport frames,
 *     including the inner type|length header
 *
 * If these bytes change, the client has diverged from ESPHome's wire format.
 */
export const ESPHOME_NOISE_TRANSCRIPT = {
    pskHex: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    initiatorEphemeralHex: '1111111111111111111111111111111111111111111111111111111111111111',
    responderEphemeralHex: '2222222222222222222222222222222222222222222222222222222222222222',
    clientHelloHex: '010000',
    clientHandshakeFrameHex:
        '010031007b4e909bbe7ffe44c465a220037d608ee35897d31ef972f07f74892cb0f73f13d1bc1a38b6793685dc7e2ffdf8ea0933',
    serverHelloFrameHex: '01001b016b69746368656e0041413a42423a43433a44443a45453a464600',
    serverHandshakeFrameHex:
        '010031000faa684ed28867b97f4a6a2dee5df8ce974e76b7018e3f22a1c4cf2678570f207336b95933b321b1ae86673f689f5c9f',
    clientCommand: {
        type: 33,
        payloadHex: '0801',
        frameHex: '010016080c88d645561ba040144469e6c5a5ba5c1b1778aecf',
    },
    serverState: {
        type: 26,
        payloadHex: '0801',
        frameHex: '010016d9503bf68f1418a53f228dd0ef005eb42d568b7b3304',
    },
} as const;
