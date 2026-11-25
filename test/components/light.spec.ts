import { LightComponent, type LightStateEvent } from '../../src';
import { Subject } from 'rxjs';
import {
    ColorMode,
    LightCommandRequest,
    LightStateResponse,
    ListEntitiesLightResponse,
} from '../../src/api/protobuf/api';
import { stateParser } from '../../src/api/helpers';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { DebugConnection } from '../testHelpers/debugConnection';
import { BinaryReader } from '@bufbuild/protobuf/wire';

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
                supportedColorModes: [],
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
            expect(debugConnection.calls[0][0]).toBe(MessageTypes.LightCommandRequest);
            component.turnOn();
            expect(debugConnection.calls.length).toBe(1);
            stateObservable.next({
                blue: 0,
                brightness: 1,
                green: 0,
                key: 0,
                red: 1,
                state: true,
            });
            expect(debugConnection.calls.length).toBe(2);
        });

        it('provides information based on list entity', () => {
            expect(component.supportsBrightness).toBe(listEntity.supportsBrightness);
            expect(component.supportsRgb).toBe(listEntity.supportsRgb);
            expect(component.type).toBe('light');
        });

        it('setting color does nothing', () => {
            component.rgb = { red: 0, blue: 255, green: 255 };
            component.hsv = { hue: 120, saturation: 100, value: 100 };
        });

        it('getting colors returns 0 objects', () => {
            expect(component.rgb).toEqual({ red: 0, green: 0, blue: 0 });
            expect(component.hsv).toEqual({ hue: 0, saturation: 0, value: 0 });
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
                supportedColorModes: [],
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
            const { red, green, blue } = component.rgb;
            expect(red).toBe(255);
            expect(green).toBe(255);
            expect(blue).toBe(255);
        });

        it('set rgb works', () => {
            expect(lastSendMessage).toBe(undefined);
            component.rgb = { red: 255, green: 255, blue: 0 };
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
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
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.red).toBe(1);
            expect(lastSendMessage.green).toBe(0);
            expect(lastSendMessage.blue).toBe(0);
            expect(lastSendMessage.brightness).toBe(1);
        });

        it('generates the correct hsv values', () => {
            stateObservable.next({
                blue: 0,
                brightness: 1,
                green: 0,
                key: 0,
                red: 1,
                state: true,
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
                blue: 0,
                brightness: 1,
                green: 0,
                key: 0,
                red: 1,
                state: true,
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
                blue: 0,
                brightness: 0.6,
                green: 0,
                key: 0,
                red: 1,
                state: true,
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
                blue: 0,
                brightness: 1,
                green: 1,
                key: 0,
                red: 0,
                state: true,
            });
            component.setBrightness(75);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
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
                blue: 0,
                brightness: 0.64,
                green: 1,
                key: 0,
                red: 0,
                state: true,
            });
            expect(component.getBrightness()).toBe(64);
        });

        it('derives legacy modes but never sends color mode commands', () => {
            expect(component.supportsColorMode).toBe(false);
            expect(component.supportsWhiteValue).toBe(true);
            expect(component.supportsColorTemperature).toBe(true);
            expect(component.colorMode).toBeUndefined();
            expect(component.supportedColorModes).toEqual([ColorMode.COLOR_MODE_RGB_COLOR_TEMPERATURE]);
            component.setColorMode(ColorMode.COLOR_MODE_RGB);
            expect(debugConnection.calls.length).toBe(0);
            component.setBrightness(75);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasColorMode).toBe(false);
            expect(lastSendMessage.hasColorBrightness).toBe(false);
            expect(lastSendMessage.hasColdWhite).toBe(false);
            expect(lastSendMessage.hasWarmWhite).toBe(false);
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
                supportedColorModes: [],
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
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.brightness).toBe(0.75);
            expect(lastSendMessage.state).toBe(true);
        });

        it('should get the brightness value', () => {
            stateObservable.next({ key: listEntity.key, brightness: 0.66 });
            expect(component.getBrightness()).toBe(66);
        });
    });

    describe('effects', () => {
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
                effects: ['None', 'Strobe', 'Flicker'],
                supportedColorModes: [],
            };
            lastSendMessage = undefined;
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: 3393925675,
                state: true,
            });
        });

        it('tells me about the effects it has', () => {
            expect(component.availableEffects().length).toBe(listEntity.effects.length);
        });

        it('does not do anything when requested to sent an unknown effect', () => {
            component.effect = 'does not exist';
            expect(debugConnection.calls.length).toBe(0);
        });

        it('communicates proper effect request', () => {
            component.effect = listEntity.effects[1];
            expect(debugConnection.calls.length).toBe(1);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.effect).toBe(listEntity.effects[1]);
            expect(lastSendMessage.hasEffect).toBe(true);
            expect(lastSendMessage.hasRgb).toBe(false);
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasBrightness).toBe(true);
            expect(lastSendMessage.brightness).toBeCloseTo(1);
            expect(lastSendMessage.hasColorMode).toBe(false);
            expect(lastSendMessage.hasColorBrightness).toBe(false);
            expect(lastSendMessage.hasColdWhite).toBe(false);
            expect(lastSendMessage.hasWarmWhite).toBe(false);
        });

        it('reads the state when the queued effect command is sent', () => {
            component.setBrightness(50);
            expect(debugConnection.calls.length).toBe(1);
            component.effect = listEntity.effects[1];
            expect(debugConnection.calls.length).toBe(1);

            stateObservable.next({ key: listEntity.key, state: true, brightness: 0.7 });
            expect(debugConnection.calls.length).toBe(2);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[1][1]));
            expect(lastSendMessage.hasEffect).toBe(true);
            expect(lastSendMessage.brightness).toBeCloseTo(0.7);
        });
    });

    describe('color modes', () => {
        const decodeLastCommand = (): LightCommandRequest => {
            const [type, data] = debugConnection.calls[debugConnection.calls.length - 1];
            expect(type).toBe(MessageTypes.LightCommandRequest);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(data));
            return lastSendMessage;
        };

        const nextState = (state: Partial<LightStateEvent>): void => {
            stateObservable.next({ key: listEntity.key, ...state });
        };

        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'studio-posters',
                key: 9001,
                name: 'Studio Posters',
                uniqueId: '',
                // Firmware >= 2025.8 sends only the color modes; the legacy
                // capability flags are gone.
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            };
            lastSendMessage = undefined;
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            nextState({
                state: true,
                brightness: 1,
                red: 1,
                green: 0,
                blue: 0,
                colorMode: ColorMode.COLOR_MODE_RGB,
                colorBrightness: 1,
                coldWhite: 1,
                warmWhite: 1,
            });
        });

        it('derives capabilities from the advertised modes', () => {
            expect(component.supportsColorMode).toBe(true);
            expect(component.supportedColorModes).toEqual([
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            ]);
            expect(component.supportsRgb).toBe(true);
            expect(component.supportsBrightness).toBe(true);
            expect(component.supportsWhiteValue).toBe(false);
            expect(component.supportsColorTemperature).toBe(true);
            expect(component.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
        });

        it('switches modes without touching the stored values', () => {
            component.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(debugConnection.calls.length).toBe(1);
            const command = decodeLastCommand();
            expect(command.key).toBe(listEntity.key);
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(command.hasState).toBe(false);
            expect(command.hasRgb).toBe(false);
            expect(command.hasBrightness).toBe(false);
            expect(command.hasColdWhite).toBe(false);
            expect(command.hasWarmWhite).toBe(false);
        });

        it('ignores unsupported and unknown modes', () => {
            component.setColorMode(ColorMode.COLOR_MODE_WHITE);
            component.setColorMode(ColorMode.COLOR_MODE_UNKNOWN);
            expect(debugConnection.calls.length).toBe(0);
        });

        it('sends the RGB mode and full color brightness with an rgb command', () => {
            component.rgb = { red: 0, green: 0, blue: 255 };
            expect(debugConnection.calls.length).toBe(1);
            const command = decodeLastCommand();
            expect(command.key).toBe(listEntity.key);
            expect(command.hasRgb).toBe(true);
            expect(command.blue).toBe(1);
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
            expect(command.hasColorBrightness).toBe(true);
            expect(command.colorBrightness).toBe(1);
            expect(command.hasState).toBe(true);
            expect(command.brightness).toBe(1);
        });

        it('keeps the master brightness separate from the color on hsv commands', () => {
            component.hsv = { hue: 120, saturation: 100, value: 40 };
            const command = decodeLastCommand();
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
            expect(command.hasColorBrightness).toBe(true);
            expect(command.colorBrightness).toBe(1);
            expect(command.hasBrightness).toBe(true);
            expect(command.brightness).toBeCloseTo(0.4);
            expect(command.red).toBe(0);
            expect(command.green).toBe(1);
        });

        it('changes brightness without resending the color or its mode', () => {
            component.setBrightness(75);
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(true);
            expect(command.hasBrightness).toBe(true);
            expect(command.brightness).toBeCloseTo(0.75);
            expect(command.hasRgb).toBe(false);
            expect(command.hasColorMode).toBe(false);
            expect(command.hasColorBrightness).toBe(false);
            expect(command.hasWhite).toBe(false);
            expect(command.hasColdWhite).toBe(false);
            expect(command.hasWarmWhite).toBe(false);
            expect(command.hasEffect).toBe(false);
        });

        it('treats zero brightness as off', () => {
            component.setBrightness(0);
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(false);
            expect(command.hasBrightness).toBe(false);
        });

        it('turns on without re-sending or guessing a mode', () => {
            nextState({ state: false, colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE });
            component.turnOn();
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(true);
            expect(command.hasColorMode).toBe(false);
            expect(command.hasRgb).toBe(false);
            expect(command.hasBrightness).toBe(false);
            expect(command.hasColorBrightness).toBe(false);
            expect(command.hasWhite).toBe(false);
            expect(command.hasColdWhite).toBe(false);
            expect(command.hasWarmWhite).toBe(false);
        });

        it('does not guess a mode when the firmware has never reported one', () => {
            nextState({ state: false, colorMode: undefined });
            component.turnOn();
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.hasColorMode).toBe(false);
        });

        it('turns off with the state only', () => {
            component.turnOff();
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(false);
            expect(command.hasColorMode).toBe(false);
            expect(command.hasBrightness).toBe(false);
            expect(command.hasRgb).toBe(false);
            expect(command.hasColdWhite).toBe(false);
            expect(command.hasWarmWhite).toBe(false);
        });

        it('switches back to the color mode', () => {
            nextState({ colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE });
            component.setColorMode(ColorMode.COLOR_MODE_RGB);
            const command = decodeLastCommand();
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
            expect(command.hasState).toBe(false);
            expect(command.hasBrightness).toBe(false);
            expect(command.hasColorBrightness).toBe(false);
            expect(command.hasRgb).toBe(false);
            expect(command.hasWhite).toBe(false);
            expect(command.hasColdWhite).toBe(false);
            expect(command.hasWarmWhite).toBe(false);
            expect(command.hasEffect).toBe(false);
        });

        it('converts color temperature to neutral cold/warm white without a mired range', () => {
            component.colorTemperature = 300;
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(true);
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(command.hasColorTemperature).toBe(false);
            expect(command.hasColdWhite).toBe(true);
            expect(command.coldWhite).toBe(1);
            expect(command.hasWarmWhite).toBe(true);
            expect(command.warmWhite).toBe(1);
            expect(command.hasRgb).toBe(false);
            expect(command.hasWhite).toBe(false);
            expect(command.hasColorBrightness).toBe(false);
        });

        it('does not report a fake color temperature without a mired range', () => {
            nextState({ colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE, colorTemperature: 0 });
            expect(component.colorTemperature).toBeUndefined();
        });

        it('sends the cold/warm white channels the caller asked for', () => {
            component.setColdWarmWhite({ coldWhite: 30, warmWhite: 70 });
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(true);
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(command.coldWhite).toBeCloseTo(0.3);
            expect(command.warmWhite).toBeCloseTo(0.7);
            expect(command.hasRgb).toBe(false);
            expect(command.hasWhite).toBe(false);
            expect(command.hasColorBrightness).toBe(false);
        });

        it('refuses a white channel value on a light without a white channel', () => {
            component.white = 40;
            expect(debugConnection.calls.length).toBe(0);
        });

        it('does not report the unknown mode', () => {
            nextState({ colorMode: ColorMode.COLOR_MODE_UNKNOWN });
            expect(component.colorMode).toBeUndefined();
        });

        it('ignores non-finite white-channel levels', () => {
            component.setColdWarmWhite({ coldWhite: Number.NaN, warmWhite: Number.NaN });
            expect(debugConnection.calls.length).toBe(0);
        });

        it('ignores a non-finite color brightness', () => {
            component.colorBrightness = Number.NaN;
            expect(debugConnection.calls.length).toBe(0);
        });

        it('does not flip an interlocked light out of white to set color brightness', () => {
            nextState({ colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE });
            component.colorBrightness = 50;
            expect(debugConnection.calls.length).toBe(0);
        });

        it('drops a queued color brightness when the light reports white before it is sent', () => {
            component.setBrightness(75);
            expect(debugConnection.calls.length).toBe(1);
            component.colorBrightness = 50;
            expect(debugConnection.calls.length).toBe(1);

            nextState({ state: true, brightness: 1, colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE });
            expect(debugConnection.calls.length).toBe(1);
        });

        it('treats all-zero cold/warm white as off', () => {
            component.setColdWarmWhite({ coldWhite: 0, warmWhite: 0 });
            const command = decodeLastCommand();
            expect(command.state).toBe(false);
            expect(command.hasColdWhite).toBe(false);
            expect(command.hasWarmWhite).toBe(false);
        });

        it('sends only the provided white channel', () => {
            component.setColdWarmWhite({ coldWhite: 30 });
            const command = decodeLastCommand();
            expect(command.hasColdWhite).toBe(true);
            expect(command.coldWhite).toBeCloseTo(0.3);
            expect(command.hasWarmWhite).toBe(false);

            nextState({ state: true, brightness: 1, colorMode: ColorMode.COLOR_MODE_RGB });
            component.setColdWarmWhite({});
            expect(debugConnection.calls.length).toBe(1);
        });

        it('ignores color brightness before the first state arrives', () => {
            const freshState$ = new Subject<LightStateEvent>();
            const fresh = new LightComponent(listEntity, freshState$, debugConnection);
            fresh.colorBrightness = 50;
            expect(debugConnection.calls.length).toBe(0);
        });

        it('switches back to color from a color-temperature mode', () => {
            nextState({ colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE });
            component.rgb = { red: 0, green: 0, blue: 255 };
            const command = decodeLastCommand();
            expect(command.hasColorMode).toBe(true);
            expect(command.colorMode).toBe(ColorMode.COLOR_MODE_RGB);
            expect(command.colorBrightness).toBe(1);
            expect(command.blue).toBe(1);
        });

        it('treats a black color as off on color-mode firmware', () => {
            component.hsv = { hue: 0, saturation: 0, value: 0 };
            const command = decodeLastCommand();
            expect(command.hasState).toBe(true);
            expect(command.state).toBe(false);
            expect(command.hasRgb).toBe(false);
            expect(command.hasColorMode).toBe(false);
        });

        it('sets color brightness without switching modes', () => {
            component.colorBrightness = 25;
            const command = decodeLastCommand();
            expect(command.hasColorBrightness).toBe(true);
            expect(command.colorBrightness).toBeCloseTo(0.25);
            expect(command.hasColorMode).toBe(false);
            expect(command.hasState).toBe(false);
        });

        it('applies color brightness to the reported rgb color', () => {
            nextState({
                state: true,
                brightness: 1,
                colorBrightness: 0.5,
                red: 1,
                green: 0,
                blue: 0,
                colorMode: ColorMode.COLOR_MODE_RGB,
            });
            expect(component.rgb.red).toBeCloseTo(128);
            expect(component.rgb.green).toBe(0);
            expect(component.rgb.blue).toBe(0);
        });

        it('reports the master brightness without folding in the color brightness', () => {
            nextState({
                state: true,
                brightness: 0.6,
                colorBrightness: 0.5,
                red: 1,
                green: 0,
                blue: 0,
                colorMode: ColorMode.COLOR_MODE_RGB,
            });
            expect(component.getBrightness()).toBe(60);
        });

        it('drops a queued color brightness after a queued switch to white', () => {
            // The state frame that releases the queue predates the mode switch,
            // so the builder must use the requested mode, not the reported one.
            component.setBrightness(75);
            expect(debugConnection.calls.length).toBe(1);
            component.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            component.colorBrightness = 50;
            expect(debugConnection.calls.length).toBe(1);

            nextState({
                state: true,
                brightness: 0.75,
                colorMode: ColorMode.COLOR_MODE_RGB,
                colorBrightness: 1,
            });

            expect(debugConnection.calls.length).toBe(2);
            expect(debugConnection.calls[1][0]).toBe(MessageTypes.LightCommandRequest);
            const modeCommand = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[1][1]));
            expect(modeCommand.hasColorMode).toBe(true);
            expect(modeCommand.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(modeCommand.hasColorBrightness).toBe(false);
        });

        it('accepts color brightness again once the mode switch is reported', () => {
            component.setBrightness(75);
            component.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            component.colorBrightness = 50;
            nextState({
                state: true,
                brightness: 0.75,
                colorMode: ColorMode.COLOR_MODE_RGB,
                colorBrightness: 1,
            });
            expect(debugConnection.calls.length).toBe(2);

            // Confirm the switch, then return to RGB and let that land too.
            nextState({
                state: true,
                brightness: 0.75,
                colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE,
                colorBrightness: 1,
            });
            component.setColorMode(ColorMode.COLOR_MODE_RGB);
            nextState({
                state: true,
                brightness: 0.75,
                colorMode: ColorMode.COLOR_MODE_RGB,
                colorBrightness: 1,
            });
            expect(debugConnection.calls.length).toBe(3);

            component.colorBrightness = 40;
            const command = decodeLastCommand();
            expect(command.hasColorBrightness).toBe(true);
            expect(command.colorBrightness).toBeCloseTo(0.4);
            expect(command.hasState).toBe(false);
        });

        it('drops a color brightness when a post-send frame still reports the old mode', () => {
            component.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(debugConnection.calls.length).toBe(1);
            component.colorBrightness = 50;
            expect(debugConnection.calls.length).toBe(1);

            // The first frame after the switch can predate the device applying
            // it. It differs in brightness, so dedup does not hide it; it must
            // not be treated as a refusal of the requested mode.
            nextState({ state: true, brightness: 0.9, colorMode: ColorMode.COLOR_MODE_RGB, colorBrightness: 1 });
            expect(debugConnection.calls.length).toBe(1);
        });

        it('keeps a color brightness queued before the mode switch', () => {
            component.setBrightness(75);
            expect(debugConnection.calls.length).toBe(1);

            // Queued before the switch, so it is applied while the light is
            // still in RGB; the switch must not hide the pending mode from it.
            component.colorBrightness = 80;
            component.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(debugConnection.calls.length).toBe(1);

            nextState({ state: true, brightness: 0.75, colorMode: ColorMode.COLOR_MODE_RGB, colorBrightness: 1 });

            expect(debugConnection.calls.length).toBe(3);
            const colorBrightness = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[1][1]));
            expect(colorBrightness.hasColorBrightness).toBe(true);
            expect(colorBrightness.colorBrightness).toBeCloseTo(0.8);
            expect(colorBrightness.hasColorMode).toBe(false);
            const mode = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[2][1]));
            expect(mode.hasColorMode).toBe(true);
            expect(mode.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
        });
    });

    describe('color temperature modes', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'tunable-white',
                key: 9002,
                name: 'Tunable white',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 153,
                maxMireds: 500,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLOR_TEMPERATURE],
            };
            lastSendMessage = undefined;
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_COLOR_TEMPERATURE,
                colorTemperature: 300,
            });
        });

        it('uses the mired value directly when the mode supports it', () => {
            component.colorTemperature = 300;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasColorMode).toBe(true);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_COLOR_TEMPERATURE);
            expect(lastSendMessage.hasColorTemperature).toBe(true);
            expect(lastSendMessage.colorTemperature).toBeCloseTo(300);
            expect(lastSendMessage.hasColdWhite).toBe(false);
        });

        it('clamps to the advertised mired range', () => {
            component.colorTemperature = 100;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.colorTemperature).toBeCloseTo(153);
        });

        it('clamps the upper mired bound', () => {
            component.colorTemperature = 10_000;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.colorTemperature).toBeCloseTo(500);
        });

        it('sends the mired value unclamped when the device advertises no range', () => {
            const noRangeList: ListEntitiesLightResponse = {
                ...listEntity,
                minMireds: 0,
                maxMireds: 0,
                supportedColorModes: [ColorMode.COLOR_MODE_COLOR_TEMPERATURE],
            };
            const noRangeState$ = new Subject<LightStateEvent>();
            const noRange = new LightComponent(noRangeList, noRangeState$, debugConnection);
            noRangeState$.next({
                key: noRangeList.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_COLOR_TEMPERATURE,
            });

            noRange.colorTemperature = 300;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasColorMode).toBe(true);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_COLOR_TEMPERATURE);
            expect(lastSendMessage.hasColorTemperature).toBe(true);
            expect(lastSendMessage.colorTemperature).toBeCloseTo(300);
            expect(lastSendMessage.hasColdWhite).toBe(false);
        });
    });

    describe('white channel modes', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'rgbw',
                key: 9003,
                name: 'RGBW',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_WHITE],
            };
            lastSendMessage = undefined;
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB,
                white: 0,
            });
        });

        it('sets the white channel in the WHITE mode', () => {
            component.white = 40;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasColorMode).toBe(true);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_WHITE);
            expect(lastSendMessage.hasWhite).toBe(true);
            expect(lastSendMessage.white).toBeCloseTo(0.4);
            expect(lastSendMessage.hasRgb).toBe(false);
            expect(lastSendMessage.hasColdWhite).toBe(false);
            expect(lastSendMessage.hasWarmWhite).toBe(false);
            expect(lastSendMessage.hasColorBrightness).toBe(false);
        });

        it('reports the white channel back', () => {
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                white: 0.25,
                colorMode: ColorMode.COLOR_MODE_WHITE,
            });
            expect(component.white).toBe(25);
            expect(component.getBrightness()).toBe(100);
        });

        it('ignores a non-finite white level', () => {
            component.white = Number.NaN;
            expect(debugConnection.calls.length).toBe(0);
        });

        it('does nothing for color temperature without a compatible mode', () => {
            component.colorTemperature = 300;
            expect(debugConnection.calls.length).toBe(0);
        });

        it('treats a zero white level as off', () => {
            component.white = 0;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.state).toBe(false);
            expect(lastSendMessage.hasWhite).toBe(false);
            expect(lastSendMessage.hasColorMode).toBe(false);
        });

        it('keeps the light on when a zero white level has a color channel to fall back on', () => {
            const rgbwList: ListEntitiesLightResponse = {
                ...listEntity,
                supportedColorModes: [ColorMode.COLOR_MODE_RGB_WHITE],
            };
            const rgbwState$ = new Subject<LightStateEvent>();
            const rgbw = new LightComponent(rgbwList, rgbwState$, debugConnection);
            rgbwState$.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB_WHITE,
                white: 0.5,
                red: 1,
            });

            rgbw.white = 0;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasWhite).toBe(true);
            expect(lastSendMessage.white).toBe(0);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_RGB_WHITE);
        });

        it('keeps an rgb-cold/warm-white light on when all-zero white has a color channel', () => {
            const rgbCwwList: ListEntitiesLightResponse = {
                ...listEntity,
                supportedColorModes: [ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE],
            };
            const rgbCwwState$ = new Subject<LightStateEvent>();
            const rgbCww = new LightComponent(rgbCwwList, rgbCwwState$, debugConnection);
            rgbCwwState$.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE,
                coldWhite: 0.5,
                warmWhite: 0.5,
            });

            rgbCww.setColdWarmWhite({ coldWhite: 0, warmWhite: 0 });
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasColorMode).toBe(true);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_RGB_COLD_WARM_WHITE);
            expect(lastSendMessage.hasColdWhite).toBe(true);
            expect(lastSendMessage.coldWhite).toBe(0);
            expect(lastSendMessage.hasWarmWhite).toBe(true);
            expect(lastSendMessage.warmWhite).toBe(0);
            expect(lastSendMessage.hasRgb).toBe(false);
        });
    });

    describe('on/off only color mode', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'relay',
                key: 9004,
                name: 'Relay',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_ON_OFF],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({ key: listEntity.key, state: true, colorMode: ColorMode.COLOR_MODE_ON_OFF });
        });

        it('ignores brightness changes instead of toggling the relay', () => {
            expect(component.supportsBrightness).toBe(false);
            component.setBrightness(50);
            component.setBrightness(0);
            expect(debugConnection.calls.length).toBe(0);
        });

        it('reports no channel values for a mode it does not support', () => {
            expect(component.white).toBeUndefined();
            expect(component.coldWhite).toBeUndefined();
            expect(component.warmWhite).toBeUndefined();
            expect(component.colorBrightness).toBeUndefined();
            expect(component.colorTemperature).toBeUndefined();
        });
    });

    describe('cold/warm white with a mired range', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'studio-posters',
                key: 9005,
                name: 'Studio Posters',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 153,
                maxMireds: 500,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE,
                colorTemperature: 0,
                coldWhite: 1,
                warmWhite: 1,
            });
        });

        it('sends the mired value alongside the converted white channels', () => {
            component.colorTemperature = 400;
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasColorMode).toBe(true);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(lastSendMessage.hasColorTemperature).toBe(true);
            expect(lastSendMessage.colorTemperature).toBeCloseTo(400);
            expect(lastSendMessage.coldWhite).toBeCloseTo(0.405, 3);
            expect(lastSendMessage.warmWhite).toBeCloseTo(1);
            expect(lastSendMessage.hasRgb).toBe(false);
            expect(lastSendMessage.hasWhite).toBe(false);
            expect(lastSendMessage.hasColorBrightness).toBe(false);
        });

        it('reports the stored color temperature', () => {
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE,
                colorTemperature: 400,
                coldWhite: 0.7,
                warmWhite: 1,
            });
            expect(component.colorTemperature).toBe(400);
            expect(component.coldWhite).toBe(70);
            expect(component.warmWhite).toBe(100);
        });
    });

    describe('decoded firmware state', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'legacy-rgb',
                key: 9006,
                name: 'Legacy RGB',
                uniqueId: '',
                supportsBrightness: true,
                supportsRgb: true,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
        });

        it('does not let the protobuf default color brightness black out legacy rgb', () => {
            const payload = LightStateResponse.encode({
                ...LightStateResponse.decode(new Uint8Array()),
                key: listEntity.key,
                state: true,
                brightness: 1,
                red: 1,
                green: 0,
                blue: 0,
            }).finish();
            const decoded = stateParser({ type: MessageTypes.LightStateResponse, payload });
            expect(decoded).toBeDefined();
            stateObservable.next(decoded as LightStateEvent);

            expect(component.supportsColorMode).toBe(false);
            expect(component.colorBrightness).toBeUndefined();
            expect(component.rgb.red).toBeCloseTo(255);
            expect(component.hsv.value).toBe(100);
        });

        it('folds in color brightness on firmware that reports it', () => {
            const modernList: ListEntitiesLightResponse = {
                ...listEntity,
                supportedColorModes: [ColorMode.COLOR_MODE_RGB],
            };
            const modernState$ = new Subject<LightStateEvent>();
            const modern = new LightComponent(modernList, modernState$, debugConnection);

            const payload = LightStateResponse.encode({
                ...LightStateResponse.decode(new Uint8Array()),
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorBrightness: 0.5,
                colorMode: ColorMode.COLOR_MODE_RGB,
                red: 1,
                green: 0,
                blue: 0,
            }).finish();
            modernState$.next(stateParser({ type: MessageTypes.LightStateResponse, payload }) as LightStateEvent);

            expect(modern.supportsColorMode).toBe(true);
            expect(modern.rgb.red).toBeCloseTo(128);
            expect(modern.colorBrightness).toBe(50);
        });

        it('reports a decoded zero color brightness as no color', () => {
            const modernList: ListEntitiesLightResponse = {
                ...listEntity,
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            };
            const modernState$ = new Subject<LightStateEvent>();
            const modern = new LightComponent(modernList, modernState$, debugConnection);

            const payload = LightStateResponse.encode({
                ...LightStateResponse.decode(new Uint8Array()),
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorBrightness: 0,
                colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE,
                red: 1,
                green: 0,
                blue: 0,
                coldWhite: 1,
                warmWhite: 1,
            }).finish();
            modernState$.next(stateParser({ type: MessageTypes.LightStateResponse, payload }) as LightStateEvent);

            expect(modern.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            expect(modern.colorBrightness).toBe(0);
            expect(modern.rgb).toEqual({ red: 0, green: 0, blue: 0 });
            expect(modern.coldWhite).toBe(100);
        });
    });

    describe('legacy payload parity', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'legacy-rgbw',
                key: 9007,
                name: 'Legacy RGBW',
                uniqueId: '',
                supportsBrightness: true,
                supportsRgb: true,
                supportsWhiteValue: true,
                supportsColorTemperature: true,
                minMireds: 153,
                maxMireds: 500,
                effects: [],
                supportedColorModes: [],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 0.5,
                red: 1,
                green: 0.5,
                blue: 0,
            });
        });

        it('resends the stored channels on turn on', () => {
            component.turnOn();
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasBrightness).toBe(true);
            expect(lastSendMessage.brightness).toBeCloseTo(0.5);
            expect(lastSendMessage.hasRgb).toBe(true);
            expect(lastSendMessage.red).toBeCloseTo(1);
            expect(lastSendMessage.green).toBeCloseTo(0.5);
            expect(lastSendMessage.blue).toBe(0);
            expect(lastSendMessage.hasColorMode).toBe(false);
            expect(lastSendMessage.hasColorBrightness).toBe(false);
            expect(lastSendMessage.hasColdWhite).toBe(false);
            expect(lastSendMessage.hasWarmWhite).toBe(false);
        });

        it('resends the stored channels on turn off', () => {
            stateObservable.next({
                key: listEntity.key,
                state: false,
                brightness: 0.5,
                red: 1,
                green: 0.5,
                blue: 0,
            });
            component.turnOff();
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(false);
            expect(lastSendMessage.hasBrightness).toBe(true);
            expect(lastSendMessage.brightness).toBeCloseTo(0.5);
            expect(lastSendMessage.hasRgb).toBe(true);
            expect(lastSendMessage.red).toBeCloseTo(1);
            expect(lastSendMessage.green).toBeCloseTo(0.5);
            expect(lastSendMessage.hasColorMode).toBe(false);
            expect(lastSendMessage.hasColorBrightness).toBe(false);
            expect(lastSendMessage.hasColdWhite).toBe(false);
            expect(lastSendMessage.hasWarmWhite).toBe(false);
        });

        it('reads the state when the queued command is sent, not when it is queued', () => {
            // Occupy the command pipeline, then queue a turn-on behind it.
            component.setBrightness(50);
            expect(debugConnection.calls.length).toBe(1);
            component.turnOn();
            expect(debugConnection.calls.length).toBe(1);

            // The state that arrives before the pipeline drains must be the one
            // the queued command encodes.
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 0.9,
                red: 1,
                green: 0.25,
                blue: 0.75,
            });
            expect(debugConnection.calls.length).toBe(2);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[1][1]));
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.brightness).toBeCloseTo(0.9);
            expect(lastSendMessage.green).toBeCloseTo(0.25);
            expect(lastSendMessage.blue).toBeCloseTo(0.75);
        });
    });

    describe('input clamping', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'clamping',
                key: 9008,
                name: 'Clamping',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB,
                red: 1,
                green: 0,
                blue: 0,
            });
        });

        const resetPipeline = (): void => {
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB,
                red: 1,
                green: 0,
                blue: 0,
            });
        };

        it('clamps brightness into range', () => {
            component.setBrightness(150);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.brightness).toBeCloseTo(1);
            expect(lastSendMessage.state).toBe(true);
        });

        it('treats negative and non-finite brightness as off', () => {
            component.setBrightness(-5);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.state).toBe(false);
            expect(lastSendMessage.hasBrightness).toBe(false);

            resetPipeline();
            component.setBrightness(Number.NaN);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[1][1]));
            expect(lastSendMessage.state).toBe(false);
            expect(lastSendMessage.hasBrightness).toBe(false);
        });

        it('ignores a non-finite color temperature', () => {
            component.colorTemperature = Number.NaN;
            expect(debugConnection.calls.length).toBe(0);
        });
    });

    describe('transitional firmware', () => {
        it('prefers the advertised modes over the legacy capability booleans', () => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'transitional',
                key: 9009,
                name: 'Transitional',
                uniqueId: '',
                // 2021.8-2025.7 firmware sends both of these.
                supportsBrightness: true,
                supportsRgb: true,
                supportsWhiteValue: true,
                supportsColorTemperature: true,
                minMireds: 153,
                maxMireds: 500,
                effects: [],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB,
                red: 1,
                green: 0,
                blue: 0,
            });

            expect(component.supportsColorMode).toBe(true);
            expect(component.supportedColorModes).toEqual([
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            ]);
            expect(component.supportsRgb).toBe(true);
            expect(component.supportsBrightness).toBe(true);
            expect(component.supportsWhiteValue).toBe(false);

            component.setColorMode(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasColorMode).toBe(true);
            expect(lastSendMessage.colorMode).toBe(ColorMode.COLOR_MODE_COLD_WARM_WHITE);
        });
    });

    describe('effects on color-mode firmware', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'effects',
                key: 9010,
                name: 'Effects',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: ['None', 'Strobe'],
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 0.4,
                colorMode: ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            });
        });

        it('keeps the active mode and leaves the level to the firmware', () => {
            component.effect = 'Strobe';
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.key).toBe(listEntity.key);
            expect(lastSendMessage.hasEffect).toBe(true);
            expect(lastSendMessage.effect).toBe('Strobe');
            expect(lastSendMessage.hasState).toBe(true);
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasBrightness).toBe(false);
            expect(lastSendMessage.hasColorMode).toBe(false);
            expect(lastSendMessage.hasRgb).toBe(false);
        });

        it('does not guess a level before the first state arrives', () => {
            const freshState$ = new Subject<LightStateEvent>();
            const fresh = new LightComponent(listEntity, freshState$, debugConnection);
            fresh.effect = 'Strobe';
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.hasEffect).toBe(true);
            expect(lastSendMessage.hasBrightness).toBe(false);
        });
    });

    describe('unknown advertised modes', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'future',
                key: 9011,
                name: 'Future',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [99 as ColorMode, ColorMode.COLOR_MODE_RGB],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({
                key: listEntity.key,
                state: true,
                brightness: 1,
                colorMode: ColorMode.COLOR_MODE_RGB,
                red: 1,
                green: 0,
                blue: 0,
            });
        });

        it('drops unknown modes and refuses to command them', () => {
            expect(component.supportedColorModes).toEqual([ColorMode.COLOR_MODE_RGB]);
            component.setColorMode(99 as ColorMode);
            expect(debugConnection.calls.length).toBe(0);
        });

        it('does not report an unknown active mode', () => {
            stateObservable.next({
                key: listEntity.key,
                state: true,
                colorMode: 99 as ColorMode,
            });
            expect(component.colorMode).toBeUndefined();
        });
    });

    describe('only unknown advertised modes', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'future-only',
                key: 9013,
                name: 'Future only',
                uniqueId: '',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
                supportedColorModes: [99 as ColorMode],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({ key: listEntity.key, state: true });
        });

        it('degrades to on/off without sending channel commands', () => {
            expect(component.supportsColorMode).toBe(true);
            expect(component.supportedColorModes).toEqual([]);
            expect(component.supportsRgb).toBe(false);
            expect(component.supportsBrightness).toBe(false);

            component.setBrightness(50);
            component.setColorMode(99 as ColorMode);
            component.white = 50;
            expect(debugConnection.calls.length).toBe(0);

            component.turnOn();
            lastSendMessage = LightCommandRequest.decode(new BinaryReader(debugConnection.calls[0][1]));
            expect(lastSendMessage.state).toBe(true);
            expect(lastSendMessage.hasColorMode).toBe(false);
            expect(lastSendMessage.hasRgb).toBe(false);
            expect(lastSendMessage.hasBrightness).toBe(false);
        });
    });

    describe('legacy firmware setter no-ops', () => {
        beforeEach(() => {
            stateObservable = new Subject<LightStateEvent>();
            listEntity = {
                objectId: 'legacy-noop',
                key: 9012,
                name: 'Legacy noop',
                uniqueId: '',
                supportsBrightness: true,
                supportsRgb: true,
                supportsWhiteValue: true,
                supportsColorTemperature: true,
                minMireds: 153,
                maxMireds: 500,
                effects: [],
                supportedColorModes: [],
            };
            component = new LightComponent(listEntity, stateObservable, debugConnection);
            stateObservable.next({ key: listEntity.key, state: true, brightness: 1 });
        });

        it('does nothing for the color-mode-only setters', () => {
            component.white = 50;
            component.setColdWarmWhite({ coldWhite: 50, warmWhite: 50 });
            component.colorTemperature = 300;
            component.colorBrightness = 50;
            expect(debugConnection.calls.length).toBe(0);
        });
    });
});
