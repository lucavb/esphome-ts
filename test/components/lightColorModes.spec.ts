import { ColorMode } from '../../src/api/protobuf/api';
import {
    ColorCapability,
    colorTemperatureToColdWarmWhite,
    isKnownColorMode,
    leastComplexMode,
    legacyColorModes,
    modeSupportsCapability,
    modesWithCapability,
} from '../../src/components/lightColorModes';

describe('light color mode helpers', () => {
    describe('capabilities', () => {
        it('reads capabilities from the mode bitmask', () => {
            expect(modeSupportsCapability(ColorMode.COLOR_MODE_RGB, ColorCapability.RGB)).toBe(true);
            expect(modeSupportsCapability(ColorMode.COLOR_MODE_RGB, ColorCapability.WHITE)).toBe(false);
            expect(
                modeSupportsCapability(ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE, ColorCapability.COLD_WARM_WHITE),
            ).toBe(true);
            expect(modeSupportsCapability(ColorMode.COLOR_MODE_BRIGHTNESS, ColorCapability.BRIGHTNESS)).toBe(true);
            expect(modeSupportsCapability(ColorMode.COLOR_MODE_ON_OFF, ColorCapability.BRIGHTNESS)).toBe(false);
        });

        it('filters modes by the capabilities a command needs', () => {
            const modes = [
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
                ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE,
            ];
            expect(modesWithCapability(modes, ColorCapability.RGB)).toEqual([
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE,
            ]);
            expect(modesWithCapability(modes, ColorCapability.COLD_WARM_WHITE)).toEqual([
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
                ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE,
            ]);
            expect(modesWithCapability(modes, ColorCapability.WHITE)).toEqual([]);
        });

        it('ignores modes this client does not know', () => {
            expect(isKnownColorMode(ColorMode.COLOR_MODE_RGB)).toBe(true);
            expect(isKnownColorMode(ColorMode.UNRECOGNIZED)).toBe(false);
            expect(leastComplexMode([99 as ColorMode])).toBeUndefined();
        });
    });

    describe('leastComplexMode', () => {
        it('picks the mode with the fewest capabilities', () => {
            expect(leastComplexMode([ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE, ColorMode.COLOR_MODE_RGB])).toBe(
                ColorMode.COLOR_MODE_RGB,
            );
            expect(
                leastComplexMode([ColorMode.COLOR_MODE_RGB_COLOR_TEMPERATURE, ColorMode.COLOR_MODE_COLOR_TEMPERATURE]),
            ).toBe(ColorMode.COLOR_MODE_COLOR_TEMPERATURE);
            expect(leastComplexMode([])).toBeUndefined();
        });
    });

    describe('legacyColorModes', () => {
        it.each([
            [false, false, false, false, ColorMode.COLOR_MODE_ON_OFF],
            [true, false, false, false, ColorMode.COLOR_MODE_BRIGHTNESS],
            [true, false, false, true, ColorMode.COLOR_MODE_COLOR_TEMPERATURE],
            [true, true, false, false, ColorMode.COLOR_MODE_RGB],
            [true, true, true, false, ColorMode.COLOR_MODE_RGB_WHITE],
            [true, true, true, true, ColorMode.COLOR_MODE_RGB_COLOR_TEMPERATURE],
        ])(
            'maps %s/%s/%s/%s to the documented mode',
            (
                supportsBrightness: boolean,
                supportsRgb: boolean,
                supportsWhiteValue: boolean,
                supportsColorTemperature: boolean,
                expected: ColorMode,
            ) => {
                expect(
                    legacyColorModes({ supportsBrightness, supportsRgb, supportsWhiteValue, supportsColorTemperature }),
                ).toEqual([expected]);
            },
        );

        it('returns no modes for a combination legacy firmware never produced', () => {
            expect(
                legacyColorModes({
                    supportsBrightness: false,
                    supportsRgb: true,
                    supportsWhiteValue: true,
                    supportsColorTemperature: true,
                }),
            ).toEqual([]);
        });

        it('reports no named mode for rgb plus color temperature without a white channel', () => {
            // aioesphomeapi returns the raw bitmask 43 here; no named ColorMode
            // exists (47 would claim a white channel) and no first-party
            // platform produced the combination.
            expect(
                legacyColorModes({
                    supportsBrightness: true,
                    supportsRgb: true,
                    supportsWhiteValue: false,
                    supportsColorTemperature: true,
                }),
            ).toEqual([]);
        });
    });

    describe('colorTemperatureToColdWarmWhite', () => {
        it('drives both channels at full when the device exposes no mired range', () => {
            expect(colorTemperatureToColdWarmWhite(300, 0, 0)).toEqual({ coldWhite: 1, warmWhite: 1 });
            expect(colorTemperatureToColdWarmWhite(300, 500, 500)).toEqual({ coldWhite: 1, warmWhite: 1 });
        });

        it('maps the mired range onto the channels and normalises the brighter one', () => {
            expect(colorTemperatureToColdWarmWhite(153, 153, 500)).toEqual({ coldWhite: 1, warmWhite: 0 });
            expect(colorTemperatureToColdWarmWhite(500, 153, 500)).toEqual({ coldWhite: 0, warmWhite: 1 });
            expect(colorTemperatureToColdWarmWhite(326.5, 153, 500).coldWhite).toBeCloseTo(1);
            expect(colorTemperatureToColdWarmWhite(326.5, 153, 500).warmWhite).toBeCloseTo(1);
            const nearCold = colorTemperatureToColdWarmWhite(200, 153, 500);
            expect(nearCold.coldWhite).toBeCloseTo(1);
            expect(nearCold.warmWhite).toBeCloseTo(0.1567, 3);
        });

        it('clamps temperatures outside the range', () => {
            expect(colorTemperatureToColdWarmWhite(1, 153, 500)).toEqual({ coldWhite: 1, warmWhite: 0 });
            expect(colorTemperatureToColdWarmWhite(10_000, 153, 500)).toEqual({ coldWhite: 0, warmWhite: 1 });
        });
    });
});
