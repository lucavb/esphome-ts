import {LightComponent, LightStateEvent} from '../../src';
import {CommandInterface} from '../../src/components/commandInterface';
import {Subject} from 'rxjs';
import {LightCommandRequest, ListEntitiesLightResponse} from '../../src/api/protobuf/api';
import {Reader} from 'protobufjs/minimal';

describe('LightComponent', () => {

    let component: LightComponent;
    let commandInterface: CommandInterface;
    let stateObservable: Subject<LightStateEvent>;
    let listEntity: ListEntitiesLightResponse;
    let lastSendMessage: LightCommandRequest | undefined;

    beforeEach(() => {
        commandInterface = {
            send: (type, array) => {
                lastSendMessage = LightCommandRequest.decode(new Reader(array));
            },
        };
        stateObservable = new Subject<LightStateEvent>();
        listEntity = {
            objectId: 'string',
            key: 9001,
            name: 'string',
            uniqueId: 'string',
            supportsBrightness: true,
            supportsRgb: true,
            supportsWhiteValue: true,
            supportsColorTemperature: true,
            minMireds: 9001,
            maxMireds: 9001,
            effects: [],
        };
        lastSendMessage = undefined;
        component = new LightComponent(listEntity, stateObservable, commandInterface);
        stateObservable.next({
            key: 3393925675,
            state: true,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
        });
    });

    it('get rgb works', () => {
        stateObservable.next({
            key: 3393925675,
            state: true,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
        });
        const {red, green, blue} = component.rgb;
        expect(red).toBe(255);
        expect(green).toBe(255);
        expect(blue).toBe(255);
    });

    it('set rgb works', () => {
        expect(lastSendMessage).toBe(undefined);
        component.rgb = {red: 255, green: 255, blue: 0};
        expect(lastSendMessage?.red).toBe(1);
        expect(lastSendMessage?.green).toBe(1);
        expect(lastSendMessage?.blue).toBe(0);
    });

    it('setting hsv creates the proper command', () => {
        component.hsv = {
            hue: 0,
            saturation: 100,
            value: 100,
        };
        if (lastSendMessage) {
            const request = lastSendMessage;
            expect(request.red).toBe(1);
            expect(request.green).toBe(0);
            expect(request.blue).toBe(0);
            expect(request.brightness).toBe(1);
        }
    });

    it('generates the correct hsv values', () => {
        stateObservable.next({
            blue: 0, brightness: 1, green: 0, key: 0, red: 1, state: true,
        });
        const hsv = component.hsv;
        expect(hsv).toEqual({
            hue: 0,
            saturation: 100,
            value: 100,
        });
    });

    it('generates the correct hsv values considering brightness', () => {
        stateObservable.next({
            blue: 0, brightness: 1, green: 0, key: 0, red: 1, state: true,
        });
        const hsv = component.hsv;
        expect(hsv).toEqual({
            hue: 0,
            saturation: 100,
            value: 100,
        });
    });

    it('generates the correct hsv values considering saturation', () => {
        stateObservable.next({
            blue: 0, brightness: 0.6, green: 0, key: 0, red: 1, state: true,
        });
        const hsv = component.hsv;
        expect(hsv).toEqual({
            hue: 0,
            saturation: 100,
            value: 60,
        });
    });

    it('setbrightness test', () => {
        stateObservable.next({
            blue: 0, brightness: 1, green: 1, key: 0, red: 0, state: true,
        });
        component.setBrightness(75);
        if (lastSendMessage) {
            expect(lastSendMessage.red).toBe(0);
            expect(lastSendMessage.green).toBe(1);
            expect(lastSendMessage.brightness).toBe(0.75);
        } else {
            throw new Error('Should have had an expect call');
        }
    });

    it('get brightness test', () => {
        stateObservable.next({
            blue: 0, brightness: 0.64, green: 1, key: 0, red: 0, state: true,
        });
        expect(component.getBrightness()).toBe(64);
    });

});
