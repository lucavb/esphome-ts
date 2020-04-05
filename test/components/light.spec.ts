import {LightComponent} from '../../src/components/light';
import {CommandInterface} from '../../src/components/commandInterface';
import {Subject} from 'rxjs';
import {LightStateEvent} from '../../src/components/states';
import {LightCommandRequest, ListEntitiesLightResponse} from '../../src/api/protobuf/api';
import {Reader} from 'protobufjs/minimal';
import {last} from "rxjs/operators";

const round = (value: number) => {
    return Math.round(value * 1000) / 1000;
};

describe('LightComponent', () => {

    let component: LightComponent;
    let commandInterface: CommandInterface;
    let stateObservable: Subject<LightStateEvent>;
    let listEntity: ListEntitiesLightResponse;
    let lastSendMessage: Uint8Array | undefined;

    beforeEach(() => {
        commandInterface = {
            send: (type, array) => {
                lastSendMessage = array;
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
    });

    it('setting hsv creates the proper command', () => {
        component.hsv = {
            hue: 0,
            saturation: 100,
            value: 100,
        };
        if (lastSendMessage) {
            const request = LightCommandRequest.decode(new Reader(lastSendMessage));
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
            blue: 0, brightness: 0.33, green: 0, key: 0, red: 1, state: true,
        });
        const hsv = component.hsv;
        expect(hsv).toEqual({
            hue: 0,
            saturation: 100,
            value: 33,
        });
    });

    it('generates the correct hsv values considering saturation', () => {
        stateObservable.next({
            blue: 0, brightness: 0.33, green: 0, key: 0, red: 0.6, state: true,
        });
        const hsv = component.hsv;
        expect(hsv).toEqual({
            hue: 0,
            saturation: 100,
            value: 33,
        });
    });

    it('setting hsv creates the proper brightness', () => {
        component.hsv = {
            hue: 0,
            saturation: 100,
            value: 25,
        };
        if (lastSendMessage) {
            const request = LightCommandRequest.decode(new Reader(lastSendMessage));
            expect(request.red).toBe(1);
            expect(request.green).toBe(0);
            expect(request.blue).toBe(0);
            expect(request.brightness).toBe(0.25);
        }
    });

    it('setting rgb does not influence brightness', () => {
        stateObservable.next({
            blue: 0, brightness: 0.33, green: 0, key: 0, red: 1, state: true,
        });
        component.rgb = {
            red: 60,
            green: 50,
            blue: 0,
        };
        if (lastSendMessage) {
            const request = LightCommandRequest.decode(new Reader(lastSendMessage));
            expect(round(request.red)).toBe(0.6);
            expect(round(request.green)).toBe(0.5);
            expect(round(request.blue)).toBe(0);
            expect(round(request.brightness)).toBe(0.33);
        }
    });

});

