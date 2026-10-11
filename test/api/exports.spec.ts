import * as api from '../../src';
import { CoverOperation, LegacyCoverState } from '../../src/api/protobuf/api';

describe('package export surface', () => {
    it('exposes the documented runtime exports', () => {
        expect(api.EspDevice).toBeDefined();
        expect(api.InvalidPasswordError).toBeDefined();
        expect(api.Client).toBeDefined();
        expect(api.EspSocket).toBeDefined();
        expect(api.MessageTypes).toBeDefined();
        expect(api.isSwitchComponent).toBeDefined();
        expect(api.isTrue).toBeDefined();
        expect(api.isFalse).toBeDefined();
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
    });

    it('exposes BinarySensorTypes through the root barrel', () => {
        // test/components/binarySensor.spec.ts deep-imports past the barrel;
        // consumers using only the public surface still need it here.
        expect(api.BinarySensorTypes).toBeDefined();
    });

    it('exposes the cover enums downstream code needs at runtime', () => {
        expect(api.CoverOperation).toBe(CoverOperation);
        expect(api.LegacyCoverState).toBe(LegacyCoverState);
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
