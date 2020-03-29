import {Light, Rgb} from '../components/states';

export enum ApiTypes {
    SENSOR = 'sensor',
    BINARY_SENSOR = 'binary_sensor',
    SWITCH = 'switch',
    LIGHT = 'light'
}

export enum ApiActions {
    TURN_ON = 'turn_on',
    TURN_OFF = 'turn_off',
    TOGGLE = 'toggle'
}

export interface Transition {
    transition: number;
}

export type OptionalArguments = Partial<Transition> & Partial<Light> & Partial<Rgb>;
