export interface ListEntity {
    key: number;
    name: string;
    uniqueId: string;
    objectId: string;
}

export interface SensorEntity extends ListEntity {
    unitOfMeasurement: string;
    accuracyDecimals: number;
    icon: string;
}

export interface BinarySensorEntity extends ListEntity {
    deviceClass: string;
}

export interface LightEntity extends ListEntity {
    effects: string[];
    supportsBrightness: boolean;
    supportsRgb: boolean;
}

export type ComponentType = 'light' | 'binarySensor' | 'sensor' | 'switch';
