import { BaseComponent } from '../components/base';
import { SwitchComponent } from '../components/switch';

export const isSwitchComponent = (component: BaseComponent): component is SwitchComponent =>
    component.type === 'switch';
