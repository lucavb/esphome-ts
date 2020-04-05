import {ComponentType, ListEntity} from './entities';
import {StateEvent} from './states';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {CommandInterface} from './commandInterface';

export abstract class BaseComponent<L extends ListEntity = ListEntity, S extends StateEvent = StateEvent> {

    protected state?: S;
    public readonly state$: Observable<S>;

    constructor(protected readonly listEntity: L,
                state$: Observable<S>,
                protected readonly commandInterface: CommandInterface) {
        this.state$ = state$.pipe(
            tap((state: S) => this.state = state),
        );
        this.state$.subscribe();
    }

    public get ready(): boolean {
        return this.state !== undefined;
    }

    public get name(): string {
        return this.listEntity.name;
    }

    public get key(): number {
        return this.listEntity.key;
    }

    public toString(): string {
        return this.listEntity.name;
    }

    public abstract get getType(): ComponentType;

}
