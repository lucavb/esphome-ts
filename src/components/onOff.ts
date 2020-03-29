import {BaseComponent} from './base';
import {DefaultState} from './states';

export abstract class OnOffComponent<T extends DefaultState = DefaultState> extends BaseComponent<T> {

    public turnOn(): void {
        this.device.turnOn(this.apiType, this.id, {transition: 1}).subscribe((data) => {
            console.log(data);
        });
    }

    public turnOff(): void {
        this.device.turnOff(this.apiType, this.id, {transition: 1}).subscribe((data) => {
            console.log(data);
        });
    }

}
