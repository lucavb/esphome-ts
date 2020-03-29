import {Light, Rgb} from '../components/states';

export enum ApiTypes {
    SENSOR = 'sensor',
    BINARY_SENSOR = 'binary_sensor',
    SWITCH = 'switch',
    LIGHT = 'light'
}

export interface Transition {
    transition: number;
}

export type OptionalArguments = Partial<Transition> & Partial<Light> & Partial<Rgb>;
