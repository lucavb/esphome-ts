import {OnOffComponent} from './onOff';
import {SwitchState} from './states';
import {ApiTypes} from '../api/apiTypes';

export class SwitchComponent extends OnOffComponent<SwitchState> {

    public toggle(): void {
        this.device.toggle(this.apiType, this.id).subscribe((val) => {

        });
    }

    protected getType(): ApiTypes {
        return ApiTypes.SWITCH;
    }

}
