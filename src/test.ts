import {EspDevice} from './api/espDevice';
import {RgbLight} from './components/rgbLight';
import {SwitchComponent} from "./components/switch";

const device = new EspDevice('10.0.0.118');
const light = new RgbLight('test_led', device);
const espSwitch = new SwitchComponent('living_room_dehumidifier', device);

setInterval(() => {
    espSwitch.toggle();
}, 2000);
