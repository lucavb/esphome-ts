import request, {get, post} from 'superagent';
import {ApiTypes, OptionalArguments, Transition} from './apiTypes';
import {Observable, Subject, Subscriber} from 'rxjs';
import {DefaultState} from '../components/states';
import EventSource from 'eventsource';
import {filter} from 'rxjs/operators';
import {convertObjectToParameters} from '../util';

const defaultCallbackHandler = (subscriber: Subscriber<unknown>) => {
    return (err: Error, res: request.Response) => {
        if (err) {
            subscriber.error(err);
        } else {
            subscriber.next(JSON.parse(res.text));
        }
        subscriber.complete();
    };
};

export class EspDevice {

    private readonly events: Subject<DefaultState>;
    public readonly events$: Observable<DefaultState>;
    private eventSource!: EventSource;

    constructor(private readonly host: string, private readonly port: number = 80) {
        this.events = new Subject<DefaultState>();
        this.events$ = this.events.asObservable();
        this.setupEventStream();
    }

    public subscribeStateChanges<T extends DefaultState = DefaultState>(id: string): Observable<T> {
        return this.events.pipe(
            filter((event) => !!event),
            filter((event: DefaultState) => event.id.indexOf(id) !== -1),
        ) as Observable<T>;
    }

    public getState<T extends DefaultState = DefaultState>(type: ApiTypes, id: string): Observable<T> {
        return new Observable((subscriber) => {
            get(`http://${this.host}:${this.port}/${type}/${id}`).end(
                defaultCallbackHandler(subscriber),
            );
        });
    }

    public turnOff(type: ApiTypes, id: string, transition?: Transition): Observable<Error | null> {
        return this.post(type, id, 'turn_off', transition ?? {});
    }

    public turnOn(apiType: ApiTypes, id: string, optionalArguments?: OptionalArguments): Observable<Error | null> {
        return this.post(apiType, id, 'turn_on', optionalArguments ?? {});
    }

    public toggle(apiType: ApiTypes, id: string, optionalArguments?: OptionalArguments): Observable<Error | null> {
        return this.post(apiType, id, 'toggle', optionalArguments ?? {});
    }

    private post(apiType: ApiTypes, id: string, action: string, optionalArguments: OptionalArguments): Observable<Error | null> {
        const args: string = convertObjectToParameters(optionalArguments);
        return new Observable((subscriber) => {
            post(`http://${this.host}:${this.port}/${apiType}/${id}/${action}?${args}`).end(
                (err, res) => {
                    if (res.status === 200) {
                        subscriber.next(null);
                    } else {
                        subscriber.next(err);
                    }
                    subscriber.complete();
                },
            );
        });
    }

    private setupEventStream(): void {
        this.eventSource = new EventSource(`http://${this.host}:${this.port}/events`);
        this.eventSource.addEventListener('state', (evt: any) => {
            this.events.next(JSON.parse(evt.data));
        });
    }
}
