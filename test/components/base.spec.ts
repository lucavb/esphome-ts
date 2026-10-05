import { BaseComponent, type LightStateEvent } from '../../src';
import { type ComponentType, type LightEntity } from '../../src/components/entities';
import { Subject } from 'rxjs';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { DebugConnection } from '../testHelpers/debugConnection';

class DemoComponent extends BaseComponent {
    get type(): ComponentType {
        return 'light';
    }

    sendSomething(): void {
        this.queueCommand(MessageTypes.ConnectRequest, () => new Uint8Array([]));
    }
}

describe('BaseComponent', () => {
    const listEntity: LightEntity = {
        key: 28934,
        name: 'my name',
        uniqueId: 'uniqueId',
        objectId: 'objectId',
        effects: [],
        supportsBrightness: false,
        supportsRgb: false,
    };

    let component: DemoComponent;
    const states = new Subject<LightStateEvent>();
    const debugConnection = new DebugConnection();

    beforeEach(() => {
        component = new DemoComponent(listEntity, states, debugConnection);
    });

    it('responds with the name', () => {
        expect(component.name).toEqual(listEntity.name);
    });

    it('implements ready correctly', () => {
        expect(component.ready).toBe(false);
        states.next({
            key: listEntity.key,
        });
        expect(component.ready).toBe(true);
    });

    it('returns the name with toString', () => {
        expect(component.toString()).toEqual(listEntity.name);
    });

    it('terminates the subscription', () => {
        component.terminate();
        states.next({
            key: listEntity.key,
        });
        expect(component.ready).toBe(false);
    });

    it('unblocks the command pipeline after the 30s timeout', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
        try {
            // debounceTime arms its timer at construction, so the component must be created under the fake clock.
            const callsBefore = debugConnection.calls.length;
            component = new DemoComponent(listEntity, states, debugConnection);
            component.sendSomething();
            component.sendSomething();
            expect(debugConnection.calls.length).toBe(callsBefore + 1);

            await vi.advanceTimersByTimeAsync(30 * 1000 + 100);
            expect(debugConnection.calls.length).toBe(callsBefore + 2);
        } finally {
            vi.useRealTimers();
        }
    });

    describe('state dedup', () => {
        // The subscription is created before any state is pushed, so the
        // BehaviorSubject has nothing to replay and every emission counted
        // below corresponds to exactly one pushed state.
        const subscribeAndCollect = (): { seen: LightStateEvent[]; unsubscribe: () => void } => {
            const seen: LightStateEvent[] = [];
            const subscription = component.state$.subscribe((state) => seen.push(state));
            return { seen, unsubscribe: () => subscription.unsubscribe() };
        };

        it('suppresses the identical re-send but still emits a changed state', () => {
            const { seen, unsubscribe } = subscribeAndCollect();
            try {
                const first = { key: listEntity.key, brightness: 42 };
                states.next(first);
                // A fresh object with identical field values, as ESPHome would re-send.
                states.next({ key: listEntity.key, brightness: 42 });
                const changed = { key: listEntity.key, brightness: 43 };
                states.next(changed);

                // Fails if the comparator always says "equal" (changed state dropped)
                // or always says "unequal" (duplicate re-emitted).
                expect(seen).toEqual([first, changed]);
            } finally {
                unsubscribe();
            }
        });

        it('emits an identical NaN-valued state again only once', () => {
            const { seen, unsubscribe } = subscribeAndCollect();
            try {
                // NaN !== NaN with a plain === comparator, which previously bypassed the dedup.
                states.next({ key: listEntity.key, brightness: Number.NaN });
                states.next({ key: listEntity.key, brightness: Number.NaN });

                expect(seen.length).toBe(1);
                expect(seen[0].brightness).toBeNaN();
            } finally {
                unsubscribe();
            }
        });
    });
});
