import {
    ColorMode,
    LightCommandRequest,
    LightStateResponse,
    ListEntitiesLightResponse,
} from '../../src/api/protobuf/api';

/**
 * These frames are built by hand the way ESPHome encodes them on the wire.
 * They pin the field numbers against the firmware rather than against our own
 * encoder, so a regression like silently dropping color_mode fails here.
 */
const tag = (field: number, wireType: number): number[] => {
    let value = (field << 3) | wireType;
    const bytes: number[] = [];
    while (value > 0x7f) {
        bytes.push((value & 0x7f) | 0x80);
        value >>>= 7;
    }
    bytes.push(value);
    return bytes;
};

const fixed32 = (value: number): number[] => {
    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, value, true);
    return [...new Uint8Array(view.buffer)];
};

const float = (value: number): number[] => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, value, true);
    return [...new Uint8Array(view.buffer)];
};

const string = (field: number, value: string): number[] => {
    const bytes = [...new TextEncoder().encode(value)];
    return [...tag(field, 2), bytes.length, ...bytes];
};

const bool = (field: number, value: boolean): number[] => [...tag(field, 0), value ? 1 : 0];

describe('light protocol color mode fields', () => {
    it('decodes the modern state frame from issue #908 without dropping fields', () => {
        const bytes = new Uint8Array([
            ...tag(1, 5),
            ...fixed32(2880471878),
            ...bool(2, true),
            ...tag(3, 5),
            ...float(0.78),
            ...tag(4, 5),
            ...float(1),
            ...tag(5, 5),
            ...float(0.239216),
            ...tag(6, 5),
            ...float(0.976471),
            ...tag(7, 5),
            ...float(1),
            ...tag(10, 5),
            ...float(1),
            ...tag(11, 0),
            35, // COLOR_MODE_RGB
            ...tag(12, 5),
            ...float(1),
            ...tag(13, 5),
            ...float(1),
        ]);

        const decoded = LightStateResponse.decode(bytes);
        expect(decoded.key).toBe(2880471878);
        expect(decoded.state).toBe(true);
        expect(decoded.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
        expect(decoded.colorBrightness).toBeCloseTo(1);
        expect(decoded.white).toBeCloseTo(1);
        expect(decoded.coldWhite).toBeCloseTo(1);
        expect(decoded.warmWhite).toBeCloseTo(1);
        expect(decoded.red).toBeCloseTo(1);
        expect(decoded.green).toBeCloseTo(0.239216);
        expect(decoded.blue).toBeCloseTo(0.976471);
    });

    it('decodes distinct color temperature and cold/warm white fields', () => {
        const bytes = new Uint8Array([
            ...tag(8, 5),
            ...float(350),
            ...tag(12, 5),
            ...float(0.25),
            ...tag(13, 5),
            ...float(0.75),
        ]);

        const decoded = LightStateResponse.decode(bytes);
        expect(decoded.colorTemperature).toBeCloseTo(350);
        expect(decoded.coldWhite).toBeCloseTo(0.25);
        expect(decoded.warmWhite).toBeCloseTo(0.75);
    });

    it('decodes supported_color_modes and keeps the legacy flags separate', () => {
        const bytes = new Uint8Array([
            ...string(1, 'studio-posters'),
            ...tag(2, 5),
            ...fixed32(2880471878),
            ...string(3, 'Studio Posters'),
            ...string(4, ''),
            ...bool(5, false),
            ...bool(6, false),
            ...bool(7, false),
            ...bool(8, false),
            ...tag(9, 5),
            ...float(153),
            ...tag(10, 5),
            ...float(500),
            ...string(11, 'None'),
            ...tag(12, 2),
            2,
            35, // COLOR_MODE_RGB
            19, // COLOR_MODE_COLD_WARM_WHITE
        ]);

        const decoded = ListEntitiesLightResponse.decode(bytes);
        expect(decoded.supportedColorModes).toEqual([ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE]);
        expect(decoded.minMireds).toBe(153);
        expect(decoded.maxMireds).toBe(500);
        expect(decoded.effects).toEqual(['None']);
        expect(decoded.supportsRgb).toBe(false);
        expect(decoded.supportsBrightness).toBe(false);
    });

    it('decodes the unpacked repeated-enum form the firmware actually emits', () => {
        const bytes = new Uint8Array([
            ...string(1, 'studio-posters'),
            ...tag(2, 5),
            ...fixed32(2880471878),
            ...string(3, 'Studio Posters'),
            // One tag-96 varint per element, as ListEntitiesLightResponse::encode_msg emits it.
            ...tag(12, 0),
            35, // COLOR_MODE_RGB
            ...tag(12, 0),
            19, // COLOR_MODE_COLD_WARM_WHITE
        ]);

        const decoded = ListEntitiesLightResponse.decode(bytes);
        expect(decoded.supportedColorModes).toEqual([ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE]);
    });

    it('uses the firmware command field numbers for color mode and white channels', () => {
        const expected = new Uint8Array([
            ...bool(20, true),
            ...tag(21, 5),
            ...float(0.5),
            ...bool(22, true),
            ...tag(23, 0),
            19, // COLOR_MODE_COLD_WARM_WHITE
            ...bool(24, true),
            ...tag(25, 5),
            ...float(0.25),
            ...bool(26, true),
            ...tag(27, 5),
            ...float(0.75),
        ]);

        const decoded = LightCommandRequest.decode(expected);
        expect(decoded.hasColorBrightness).toBe(true);
        expect(decoded.colorBrightness).toBeCloseTo(0.5);
        expect(decoded.hasColorMode).toBe(true);
        expect(decoded.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
        expect(decoded.hasColdWhite).toBe(true);
        expect(decoded.coldWhite).toBeCloseTo(0.25);
        expect(decoded.hasWarmWhite).toBe(true);
        expect(decoded.warmWhite).toBeCloseTo(0.75);

        const encoded = LightCommandRequest.encode({
            ...LightCommandRequest.decode(new Uint8Array()),
            hasColorBrightness: true,
            colorBrightness: 0.5,
            hasColorMode: true,
            colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            hasColdWhite: true,
            coldWhite: 0.25,
            hasWarmWhite: true,
            warmWhite: 0.75,
        }).finish();
        expect([...encoded]).toEqual([...expected]);
    });

    it('uses the firmware command field numbers for white and color temperature', () => {
        const expected = new Uint8Array([
            ...bool(10, true),
            ...tag(11, 5),
            ...float(0.4),
            ...bool(12, true),
            ...tag(13, 5),
            ...float(350),
        ]);

        const decoded = LightCommandRequest.decode(expected);
        expect(decoded.hasWhite).toBe(true);
        expect(decoded.white).toBeCloseTo(0.4);
        expect(decoded.hasColorTemperature).toBe(true);
        expect(decoded.colorTemperature).toBeCloseTo(350);

        const encoded = LightCommandRequest.encode({
            ...LightCommandRequest.decode(new Uint8Array()),
            hasWhite: true,
            white: 0.4,
            hasColorTemperature: true,
            colorTemperature: 350,
        }).finish();
        expect([...encoded]).toEqual([...expected]);
    });
});
