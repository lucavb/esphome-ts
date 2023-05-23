import { ComponentType, ListEntity } from './entities';
import { StateEvent } from './states';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, filter, take, takeUntil, tap } from 'rxjs/operators';
import { CommandInterface } from './commandInterface';
import { isTrue, isTruthy, MessageTypes } from '../api';

export abstract class BaseComponent<L extends ListEntity = ListEntity, S extends StateEvent = StateEvent> {
    protected readonly state = new BehaviorSubject<S | undefined>(undefined);
    public readonly state$: Observable<S>;
    private readonly terminatePreviousStateSubscription = new Subject<void>();

    private readonly commandInPipeline: BehaviorSubject<boolean>;

    protected readonly teardown = new Subject<void>();

    constructor(
        protected readonly listEntity: L,
        state: Observable<S>,
        private readonly commandInterface: CommandInterface,
    ) {
        this.commandInPipeline = new BehaviorSubject<boolean>(false);
        this.state$ = this.state.pipe(filter(isTruthy));
        this.provideStateObservable(state);
        this.commandInPipeline
            .pipe(
                debounceTime(30 * 1000),
                filter(isTrue),
                tap(() => this.commandInPipeline.next(false)),
                takeUntil(this.teardown),
            )
            .subscribe();
    }

    public provideStateObservable(state$: Observable<S>): void {
        this.terminatePreviousStateSubscription.next();
        state$
            .pipe(
                tap((state: S) => this.state.next(state)),
                tap(() => this.commandInPipeline.next(false)),
                takeUntil(this.terminatePreviousStateSubscription),
                takeUntil(this.teardown),
            )
            .subscribe();
    }

    public get ready(): boolean {
        return this.state.getValue() !== undefined;
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

    public terminate(): void {
        this.teardown.next();
    }

    protected queueCommand(type: MessageTypes, dataFn: () => Uint8Array, disableSerialise = false): void {
        this.commandInPipeline
            .pipe(
                filter((x: boolean) => !x || disableSerialise),
                take(1),
                tap(() => {
                    this.commandInterface.sendEspMessage(type, dataFn());
                    this.commandInPipeline.next(true);
                }),
                takeUntil(this.teardown),
            )
            .subscribe();
    }

    public abstract get type(): ComponentType;
}
