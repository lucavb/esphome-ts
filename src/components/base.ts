import { type ComponentType, type ListEntity } from './entities';
import { type StateEvent } from './states';
import {
    BehaviorSubject,
    debounceTime,
    distinctUntilChanged,
    filter,
    Observable,
    Subject,
    take,
    takeUntil,
    tap,
} from 'rxjs';
import { type CommandInterface } from './commandInterface';
import { isTrue } from '../api/booleans';
import { type MessageTypes } from '../api/requestResponseMatching';

const shallowEqualStates = <S extends StateEvent>(previous: S, current: S): boolean => {
    const previousKeys = Object.keys(previous);
    const currentKeys = Object.keys(current);
    return (
        previousKeys.length === currentKeys.length &&
        previousKeys.every((key) => Object.is(previous[key as keyof S], current[key as keyof S]))
    );
};

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
        this.state$ = this.state.pipe(
            filter((state?: S): state is S => state !== undefined),
            // ESPHome re-sends identical states (e.g. a sensor polling a stable
            // reading): shallow-compare the flat state events so subscribers only
            // observe actual changes. Object.is is used per field so an identical
            // NaN-valued state also compares equal instead of re-emitting.
            distinctUntilChanged(shallowEqualStates),
        );
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

    protected queueCommand(type: MessageTypes, dataFn: () => Uint8Array, disableSerialise: boolean = false): void {
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
