import {
    type ClimateFanMode,
    type ClimateMode,
    type ClimatePreset,
    type ClimateSwingMode,
    type ColorMode,
    type TemperatureUnit,
} from '../api/protobuf/api';

export interface ListEntity {
    key: number;
    name: string;
    uniqueId: string;
    objectId: string;
}

export interface SensorEntity extends ListEntity {
    accuracyDecimals: number;
    deviceClass?: string;
    icon: string;
    unitOfMeasurement: string;
}

export interface BinarySensorEntity extends ListEntity {
    deviceClass: string;
}

export interface CoverEntity extends ListEntity {
    assumedState: boolean;
    supportsPosition: boolean;
    supportsTilt: boolean;
    supportsStop?: boolean;
    deviceClass: string;
}

export interface LightEntity extends ListEntity {
    effects: string[];
    supportsBrightness: boolean;
    supportsRgb: boolean;
    /**
     * Color modes advertised by firmware that supports them. Empty on older
     * firmware, which only sends the capability booleans above.
     */
    supportedColorModes?: ColorMode[];
    supportsWhiteValue?: boolean;
    supportsColorTemperature?: boolean;
    minMireds?: number;
    maxMireds?: number;
}

export interface FanEntity extends ListEntity {
    supportsOscillation: boolean;
    supportsSpeed: boolean;
    supportsDirection: boolean;
    /**
     * 0 when the firmware does not report a count. Firmware before API 1.4
     * omits the field; FanComponent then falls back to three levels. Modern
     * firmware that reports 0 is treated as having no usable speed control.
     */
    supportedSpeedCount: number;
    supportedPresetModes: string[];
}

export interface ClimateEntity extends ListEntity {
    supportsCurrentTemperature: boolean;
    supportsTwoPointTargetTemperature: boolean;
    supportedModes: ClimateMode[];
    visualMinTemperature: number;
    visualMaxTemperature: number;
    visualTargetTemperatureStep: number;
    /**
     * Legacy away capability of firmware before API 1.5. Newer firmware
     * advertises CLIMATE_PRESET_AWAY in supportedPresets instead; the
     * component's supportedPresets getter normalises the two forms.
     */
    legacySupportsAway: boolean;
    supportsAction: boolean;
    supportedFanModes: ClimateFanMode[];
    supportedSwingModes: ClimateSwingMode[];
    supportedCustomFanModes: string[];
    supportedPresets: ClimatePreset[];
    supportedCustomPresets: string[];
    supportsCurrentHumidity: boolean;
    supportsTargetHumidity: boolean;
    visualMinHumidity: number;
    visualMaxHumidity: number;
    temperatureUnit: TemperatureUnit;
    visualCurrentTemperatureStep: number;
}

export type ComponentType = 'light' | 'binarySensor' | 'sensor' | 'switch' | 'cover' | 'fan' | 'climate';
