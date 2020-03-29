export interface DefaultState {
    id: string;
    state: string;
}

export interface SwitchState extends DefaultState {
    state: 'ON' | 'OFF';
    value: boolean;
}

export type BinarySensor = SwitchState;

export interface SensorState extends DefaultState {
    state: 'ON' | 'OFF';
    value: number;
}

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

export interface Light {
    brightness?: number;
    color?: Rgb,
    effect?: string;
    // eslint-disable-next-line camelcase
    white_value?: number;
}

export type LightState = Light & DefaultState;
