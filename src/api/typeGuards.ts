import { BaseComponent } from '../components/base';
import { SwitchComponent } from '../components/switch';
import { LightComponent } from '../components/light';

export const isSwitchComponent = (component: BaseComponent): component is SwitchComponent =>
    component.type === 'switch';

export const isLightComponent = (component: BaseComponent): component is LightComponent => component.type === 'light';
