import {LightComponent, LightStateEvent} from '../../src';
import {Subject} from 'rxjs';
import {LightCommandRequest, ListEntitiesLightResponse} from '../../src/api/protobuf/api';
import {DebugConnection} from '../testHelpers/debugConnection';
import {Reader} from 'protobufjs/minimal';

describe('LightComponent', () => {

    let component: LightComponent;
    const debugConnection: DebugConnection = new DebugConnection();
    let stateObservable: Subject<LightStateEvent>;
    let listEntity: ListEntitiesLightResponse;
    let lastSendMessage: LightCommandRequest | undefined;

    afterEach(() => {
        debugConnection.calls = [];
        lastSendMessage = undefined;
    });

    describe('general component', () => {

        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'string',
                key: 9001,
                name: 'string',
                uniqueId: 'string',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 9001,
                maxMireds: 9001,
                effects: [],
            };
            lastSendMessage = undefined;
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: 3393925675,
                state: true,
            });
        });

        it('turns on / off calls are only sequential', () => {
            component.turnOff();
            expect(debugConnection.calls.length).toBe(1);
            component.turnOn();
            expect(debugConnection.calls.length).toBe(1);
            stateObservable.next({blue: 0, brightness: 1, green: 0, key: 0, red: 1, state: true});
            expect(debugConnection.calls.length).toBe(2);
        });

        it('provides information based on list entity', () => {
            expect(component.supportsBrightness).toBe(listEntity.supportsBrightness);
            expect(component.supportsRgb).toBe(listEntity.supportsRgb);
            expect(component.type).toBe('light');
        });

        it('setting color does nothing', () => {
            component.rgb = {red: 0, blue: 255, green: 255};
            component.hsv = {hue: 120, saturation: 100, value: 100};
        });

        it('getting colors returns 0 objects', () => {
            expect(component.rgb).toEqual({red: 0, green: 0, blue: 0});
            expect(component.hsv).toEqual({hue: 0, saturation: 0, value: 0});
        });

        it('should return undefined since it isnt supported', () => {
            expect(component.getBrightness()).toBe(undefined);
        });

    });

    describe('rgb', () => {
        beforeEach(() => {
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
            component = new LightComponent(listEntity, stateObservable, debugConnection);
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
            lastSendMessage = LightCommandRequest.decode(new Reader(debugConnection.calls[0][1]));
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
            lastSendMessage = LightCommandRequest.decode(new Reader(debugConnection.calls[0][1]));
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

    describe('only brightness', () => {

        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'string',
                key: 9001,
                name: 'string',
                uniqueId: 'string',
                supportsBrightness: true,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 9001,
                maxMireds: 9001,
                effects: [],
            };
            lastSendMessage = undefined;
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: 3393925675,
                state: true,
            });
        });

        it('setting brightness works', () => {
            component.setBrightness(75);
            expect(debugConnection.calls.length).toBe(1);
            lastSendMessage = LightCommandRequest.decode(new Reader(debugConnection.calls[0][1]));
            expect(lastSendMessage.brightness).toBe(0.75);
            expect(lastSendMessage.state).toBe(true);
        });

        it('should get the brightness value', () => {
            stateObservable.next({key: listEntity.key, brightness: 0.66});
            expect(component.getBrightness()).toBe(66);
        });

    });

});
