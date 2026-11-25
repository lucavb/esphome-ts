import * as api from '../../src';
import { ColorMode, CoverOperation, FanDirection, FanSpeed, LegacyCoverState } from '../../src/api/protobuf/api';

describe('package export surface', () => {
    it('exposes the documented runtime exports', () => {
        expect(api.EspDevice).toBeDefined();
        expect(api.InvalidPasswordError).toBeDefined();
        expect(api.EncryptionError).toBeDefined();
        expect(api.ConnectionHandshakeError).toBeDefined();
        expect(api.InvalidEncryptionKeyError).toBeDefined();
        expect(api.InvalidEncryptionKeyFormatError).toBeDefined();
        expect(api.EncryptionRequiredError).toBeDefined();
        expect(api.EncryptionPlaintextError).toBeDefined();
        expect(api.EncryptionHandshakeError).toBeDefined();
        expect(api.Client).toBeDefined();
        expect(api.EspSocket).toBeDefined();
        expect(api.MessageTypes).toBeDefined();
        expect(api.isSwitchComponent).toBeDefined();
        expect(api.isTrue).toBeDefined();
        expect(api.isFalse).toBeDefined();
    });

    it('keeps every encryption error under the EncryptionError base', () => {
        const errors = [
            new api.InvalidEncryptionKeyError(),
            new api.InvalidEncryptionKeyFormatError(),
            new api.EncryptionRequiredError(),
            new api.EncryptionPlaintextError(),
            new api.EncryptionHandshakeError('test'),
        ];
        for (const error of errors) {
            expect(error).toBeInstanceOf(api.EncryptionError);
        }
        expect(new api.ConnectionHandshakeError('test')).not.toBeInstanceOf(api.EncryptionError);
    });

    it('exposes every component class from the root barrel', () => {
        // Enumerated from src/components/index.ts: each component class must be
        // reachable through the root barrel.
        expect(api.BaseComponent).toBeDefined();
        expect(api.BinarySensorComponent).toBeDefined();
        expect(api.LightComponent).toBeDefined();
        expect(api.SensorComponent).toBeDefined();
        expect(api.SwitchComponent).toBeDefined();
        expect(api.CoverComponent).toBeDefined();
        expect(api.FanComponent).toBeDefined();
    });

    it('exposes BinarySensorTypes through the root barrel', () => {
        // test/components/binarySensor.spec.ts deep-imports past the barrel;
        // consumers using only the public surface still need it here.
        expect(api.BinarySensorTypes).toBeDefined();
    });

    it('exposes the cover and fan enums downstream code needs at runtime', () => {
        expect(api.CoverOperation).toBe(CoverOperation);
        expect(api.LegacyCoverState).toBe(LegacyCoverState);
        expect(api.FanDirection).toBe(FanDirection);
        expect(api.FanSpeed).toBe(FanSpeed);
    });

    it('exposes the light color mode enum downstream code needs at runtime', () => {
        expect(api.ColorMode).toBe(ColorMode);
        // Pin every wire value: ColorMode members are capability bitmasks, so a
        // regenerated enum with a wrong number would silently change commands.
        const expected: Record<string, number> = {
            COLOR_MODE_UNKNOWN: 0,
            COLOR_MODE_ON_OFF: 1,
            COLOR_MODE_LEGACY_BRIGHTNESS: 2,
            COLOR_MODE_BRIGHTNESS: 3,
            COLOR_MODE_WHITE: 7,
            COLOR_MODE_COLOR_TEMPERATURE: 11,
            COLOR_MODE_COLD_WARM_WHITE: 19,
            COLOR_MODE_RGB: 35,
            COLOR_MODE_RGB_WHITE: 39,
            COLOR_MODE_RGB_COLOR_TEMPERATURE: 47,
            COLOR_MODE_RGB_COLD_WARM_WHITE: 51,
        };
        for (const [name, value] of Object.entries(expected)) {
            expect(api.ColorMode[name as keyof typeof api.ColorMode]).toBe(value);
        }
    });

    it('does not leak internal helpers on the root namespace', () => {
        const surface = api as unknown as Record<string, unknown>;
        // isLightComponent is an internal helper; if a future export adds it to
        // the barrel, this tripwire fails loudly instead of silently widening
        // the public surface.
        expect(surface.isLightComponent).toBeUndefined();
        expect(surface.stateParser).toBeUndefined();
        expect(surface.createComponents).toBeUndefined();
        expect(surface.transformStates).toBeUndefined();
    });

    it('no longer exports the removed RxjsSocket', () => {
        // RxjsSocket became the internal TCP adapter in the Connection-seam
        // refactor; the surface must not leak it.
        const surface = api as unknown as Record<string, unknown>;
        expect(surface.RxjsSocket).toBeUndefined();
    });
});
