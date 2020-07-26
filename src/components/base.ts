import { ComponentType, ListEntity } from './entities';
import { StateEvent } from './states';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, take, tap } from 'rxjs/operators';
import { CommandInterface } from './commandInterface';
import { MessageTypes } from '../api/requestResponseMatching';
import { isTrue } from '../api/helpers';

export abstract class BaseComponent<
    L extends ListEntity = ListEntity,
    S extends StateEvent = StateEvent
> {
    protected state?: S;
    public readonly state$: Observable<S>;

    private readonly commandInPipeline: BehaviorSubject<boolean>;

    protected subscriptions: Subscription;

    constructor(
        protected readonly listEntity: L,
        state$: Observable<S>,
        private readonly commandInterface: CommandInterface,
    ) {
        this.commandInPipeline = new BehaviorSubject<boolean>(false);
        this.subscriptions = new Subscription();
        this.state$ = state$.pipe(
            tap((state: S) => (this.state = state)),
            tap(() => this.commandInPipeline.next(false)),
        );
        this.subscriptions.add(
            this.commandInPipeline
                .pipe(
                    debounceTime(30 * 1000),
                    filter(isTrue),
                    tap(() => this.commandInPipeline.next(false)),
                )
                .subscribe(),
        );
        this.subscriptions.add(this.state$.subscribe());
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

    public terminate(): void {
        this.subscriptions.unsubscribe();
    }

    protected queueCommand(
        type: MessageTypes,
        dataFn: () => Uint8Array,
        disableSerialise: boolean = false,
    ): void {
        this.subscriptions.add(
            this.commandInPipeline
                .pipe(
                    filter((x) => !x || disableSerialise),
                    take(1),
                    tap(() => {
                        this.commandInterface.send(type, dataFn());
                        this.commandInPipeline.next(true);
                    }),
                )
                .subscribe(),
        );
    }

    public abstract get type(): ComponentType;

    /*
     * @deprecated please use type instead
     */
    public get getType(): ComponentType {
        return this.type;
    }
}
