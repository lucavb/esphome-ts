import {EspDevice} from '../api/espDevice';
import {DefaultState} from './states';
import {ApiTypes} from '../api/apiTypes';
import {BehaviorSubject, Observable} from 'rxjs';
import {tap} from 'rxjs/operators';


export abstract class BaseComponent<T extends DefaultState = DefaultState> {

    protected apiType: ApiTypes;

    public state$: Observable<T | undefined>;
    protected readonly state: BehaviorSubject<T | undefined>;

    constructor(public readonly id: string, protected readonly device: EspDevice) {
        this.state = new BehaviorSubject<T | undefined>(undefined);
        this.state$ = this.state.asObservable();
        this.apiType = this.getType();
        this.getState();
        this.device.subscribeStateChanges<T>(this.id).pipe(
            tap((state) => this.state.next(state)),
        ).subscribe();
    }

    protected abstract getType(): ApiTypes;

    protected getState() {
        this.device.getState<T>(this.apiType, this.id).pipe(
            tap((state) => this.state.next(state)),
        ).subscribe();
    }

}
