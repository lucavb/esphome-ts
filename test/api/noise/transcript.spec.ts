import { importNoiseTestKey } from '../../../src/api/noise/crypto';
import { createNoiseCodec } from '../../../src/api/noise/frameCodec';
import { MessageTypes } from '../../../src/api/requestResponseMatching';
import { ESPHOME_NOISE_TRANSCRIPT as TRANSCRIPT } from './esphomeTranscript';

const hex = (value: string): Buffer => Buffer.from(value, 'hex');

describe('ESPHome Noise transcript (independent fixture)', () => {
    it('produces the exact handshake and transport bytes of hjdhjd/esphome-client 2.1.0', () => {
        const client = createNoiseCodec(
            hex(TRANSCRIPT.pskHex),
            importNoiseTestKey(hex(TRANSCRIPT.initiatorEphemeralHex)).privateKey,
        );

        const [clientHello, clientHandshake] = client.start();
        expect(Buffer.from(clientHello).toString('hex')).toBe(TRANSCRIPT.clientHelloHex);
        expect(Buffer.from(clientHandshake).toString('hex')).toBe(TRANSCRIPT.clientHandshakeFrameHex);

        const handshakeFrames = client.push(
            Buffer.concat([hex(TRANSCRIPT.serverHelloFrameHex), hex(TRANSCRIPT.serverHandshakeFrameHex)]),
        );
        expect(handshakeFrames).toEqual([]);
        expect(client.ready).toBe(true);

        expect(MessageTypes.SwitchCommandRequest).toBe(TRANSCRIPT.clientCommand.type);
        const command = client.seal(MessageTypes.SwitchCommandRequest, hex(TRANSCRIPT.clientCommand.payloadHex));
        expect(Buffer.from(command).toString('hex')).toBe(TRANSCRIPT.clientCommand.frameHex);

        expect(MessageTypes.SwitchStateResponse).toBe(TRANSCRIPT.serverState.type);
        expect(client.push(hex(TRANSCRIPT.serverState.frameHex))).toEqual([
            {
                type: TRANSCRIPT.serverState.type,
                payload: new Uint8Array(hex(TRANSCRIPT.serverState.payloadHex)),
            },
        ]);
    });
});
