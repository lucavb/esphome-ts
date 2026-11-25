import { ColorMode } from '../api/protobuf/api';

/**
 * ESPHome encodes color modes as combinations of capabilities, so a mode's
 * numeric value is a bitmask. The firmware and Home Assistant both treat the
 * enum value as that bitmask; the helpers here do the same.
 */
export const ColorCapability = {
    ON_OFF: 1,
    BRIGHTNESS: 2,
    WHITE: 4,
    COLOR_TEMPERATURE: 8,
    COLD_WARM_WHITE: 16,
    RGB: 32,
} as const;

export type ColorCapability = (typeof ColorCapability)[keyof typeof ColorCapability];

const KNOWN_COLOR_MODES = new Set<number>([
    ColorMode.COLOR_MODE_ON_OFF,
    ColorMode.COLOR_MODE_LEGACY_BRIGHTNESS,
    ColorMode.COLOR_MODE_BRIGHTNESS,
    ColorMode.COLOR_MODE_WHITE,
    ColorMode.COLOR_MODE_COLOR_TEMPERATURE,
    ColorMode.COLOR_MODE_COLD_WARM_WHITE,
    ColorMode.COLOR_MODE_RGB,
    ColorMode.COLOR_MODE_RGB_WHITE,
    ColorMode.COLOR_MODE_RGB_COLOR_TEMPERATURE,
    ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE,
]);

/**
 * Values newer than this client knows are ignored. The binary decoder keeps
 * them as raw numbers (`reader.int32()`), so this allowlist -- not the
 * generated enum -- is what rejects them. aioesphomeapi filters the same way
 * when it converts advertised modes to its enum.
 */
export const isKnownColorMode = (mode: ColorMode): boolean => KNOWN_COLOR_MODES.has(mode);

export const modeSupportsCapability = (mode: ColorMode, capability: ColorCapability): boolean =>
    isKnownColorMode(mode) && (mode & capability) === capability;

export const modesWithCapability = (modes: readonly ColorMode[], capability: ColorCapability): ColorMode[] =>
    modes.filter((mode) => modeSupportsCapability(mode, capability));

const bitCount = (value: number): number => {
    let remaining = value;
    let count = 0;
    while (remaining !== 0) {
        remaining &= remaining - 1;
        count++;
    }
    return count;
};

/**
 * The mode covering the fewest capabilities, mirroring Home Assistant's
 * `_least_complex_color_mode`. Picking the simplest suitable mode keeps e.g.
 * an RGB request on COLOR_MODE_RGB rather than COLOR_MODE_RGB_COLD_WARM_WHITE.
 */
export const leastComplexMode = (modes: readonly ColorMode[]): ColorMode | undefined => {
    let best: ColorMode | undefined;
    let bestCapabilities = Number.POSITIVE_INFINITY;
    for (const mode of modes) {
        if (!isKnownColorMode(mode)) continue;
        const capabilities = bitCount(mode);
        if (capabilities < bestCapabilities) {
            best = mode;
            bestCapabilities = capabilities;
        }
    }
    return best;
};

export interface LegacyLightCapabilities {
    supportsBrightness: boolean;
    supportsRgb: boolean;
    supportsWhiteValue: boolean;
    supportsColorTemperature: boolean;
}

/**
 * Firmware before color modes (ESPHome < 2021.8) only reports the capability
 * booleans. This mirrors `aioesphomeapi`'s
 * `LightInfo.supported_color_modes_compat` for the combinations that first-party
 * light platforms produced; combinations they never emitted return an empty
 * list, and every capability getter falls back to the raw booleans.
 *
 * One upstream combination has no named `ColorMode`: rgb plus color temperature
 * without a white channel. aioesphomeapi returns the raw bitmask 43, for which
 * this client has no enum member; the decoder keeps it as a raw number and this
 * helper treats it as unknown rather than rounding to
 * `COLOR_MODE_RGB_COLOR_TEMPERATURE`, which would claim a white channel the
 * device does not have. No first-party platform emitted it -- rgbww reported a
 * white channel too.
 */
export const legacyColorModes = ({
    supportsBrightness,
    supportsRgb,
    supportsWhiteValue,
    supportsColorTemperature,
}: LegacyLightCapabilities): ColorMode[] => {
    const key = [supportsBrightness, supportsRgb, supportsWhiteValue, supportsColorTemperature].join(',');
    switch (key) {
        case 'false,false,false,false':
            return [ColorMode.COLOR_MODE_ON_OFF];
        case 'true,false,false,false':
            return [ColorMode.COLOR_MODE_BRIGHTNESS];
        case 'true,false,false,true':
            return [ColorMode.COLOR_MODE_COLOR_TEMPERATURE];
        case 'true,true,false,false':
            return [ColorMode.COLOR_MODE_RGB];
        case 'true,true,true,false':
            return [ColorMode.COLOR_MODE_RGB_WHITE];
        case 'true,true,true,true':
            return [ColorMode.COLOR_MODE_RGB_COLOR_TEMPERATURE];
        default:
            return [];
    }
};

/**
 * Convert a color temperature in mireds to cold/warm white channel levels,
 * normalised so the brighter channel is 1.0. Mirrors Home Assistant's
 * `_color_temp_to_cold_warm`: when the device exposes no mired range (the
 * ESPHome default for rgbww/cwww unless the YAML configures the white channel
 * temperatures) both channels are driven at full, which is neutral white.
 */
export const colorTemperatureToColdWarmWhite = (
    colorTemperature: number,
    minMireds: number,
    maxMireds: number,
): { coldWhite: number; warmWhite: number } => {
    if (!(maxMireds > minMireds)) {
        return { coldWhite: 1, warmWhite: 1 };
    }
    const clamped = Math.min(Math.max(colorTemperature, minMireds), maxMireds);
    const warmWhiteFraction = (clamped - minMireds) / (maxMireds - minMireds);
    const coldWhiteFraction = 1 - warmWhiteFraction;
    const maxFraction = Math.max(coldWhiteFraction, warmWhiteFraction);
    return {
        coldWhite: coldWhiteFraction / maxFraction,
        warmWhite: warmWhiteFraction / maxFraction,
    };
};
