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

export type ComponentType = 'light' | 'binarySensor' | 'sensor' | 'switch' | 'cover' | 'fan';
