import {
    CoverOperation,
    CoverStateResponse,
    LegacyCoverState,
    LightStateResponse,
    ListEntitiesBinarySensorResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    BinarySensorStateResponse,
    SensorStateResponse,
    SwitchStateResponse,
} from '../../src/api/protobuf/api';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import { type StateResponses } from '../../src/api/interfaces';
import { createComponents, emptyCommandInterface, stateParser, transformStates } from '../../src/api/helpers';
import { BinarySensorComponent, LightComponent, SensorComponent, SwitchComponent } from '../../src/components';
import { type ReadData } from '../../src/api/espSocket';
import { Subject, firstValueFrom } from 'rxjs';
import { DebugConnection } from '../testHelpers/debugConnection';

const readData = (type: MessageTypes, payload: Uint8Array): ReadData => ({ type, payload });

describe('helpers', () => {
    describe('stateParser', () => {
        it('decodes a binary sensor state response', () => {
            const payload = BinarySensorStateResponse.encode({ key: 1234, state: true, missingState: false }).finish();
            const parsed = stateParser(readData(MessageTypes.BinarySensorStateResponse, payload));
            expect(parsed).toEqual({ key: 1234, state: true, missingState: false });
        });

        it('decodes a sensor state response with a float payload', () => {
            const payload = SensorStateResponse.encode({ key: 42, state: 21.5, missingState: false }).finish();
            const parsed = stateParser(readData(MessageTypes.SensorStateResponse, payload)) as SensorStateResponse;
            expect(parsed.key).toBe(42);
            expect(parsed.state).toBeCloseTo(21.5);
            expect(parsed.missingState).toBe(false);
        });

        it('decodes a switch state response', () => {
            const payload = SwitchStateResponse.encode({ key: 7, state: false }).finish();
            const parsed = stateParser(readData(MessageTypes.SwitchStateResponse, payload));
            expect(parsed).toEqual({ key: 7, state: false });
        });

        it('decodes a light state response', () => {
            const payload = LightStateResponse.encode({
                key: 5,
                state: true,
                brightness: 0.5,
                red: 1,
                green: 0.2,
                blue: 0.3,
                white: 0,
                colorTemperature: 153,
                effect: 'float',
            }).finish();
            const parsed = stateParser(readData(MessageTypes.LightStateResponse, payload)) as LightStateResponse;
            expect(parsed.key).toBe(5);
            expect(parsed.state).toBe(true);
            expect(parsed.brightness).toBeCloseTo(0.5);
            expect(parsed.effect).toBe('float');
            expect(parsed.colorTemperature).toBe(153);
        });

        it('decodes a cover state response', () => {
            const payload = CoverStateResponse.encode({
                key: 9,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_OPEN,
                position: 0.75,
                tilt: 0.5,
                currentOperation: CoverOperation.COVER_OPERATION_IS_OPENING,
            }).finish();
            const parsed = stateParser(readData(MessageTypes.CoverStateResponse, payload)) as CoverStateResponse;
            expect(parsed.key).toBe(9);
            expect(parsed.legacyState).toBe(LegacyCoverState.LEGACY_COVER_STATE_OPEN);
            expect(parsed.position).toBeCloseTo(0.75);
            expect(parsed.tilt).toBeCloseTo(0.5);
            expect(parsed.currentOperation).toBe(CoverOperation.COVER_OPERATION_IS_OPENING);
        });

        it('falls back to the protobuf defaults for an empty payload', () => {
            const parsed = stateParser(readData(MessageTypes.SensorStateResponse, new Uint8Array()));
            expect(parsed as SensorStateResponse).toEqual({ key: 0, state: 0, missingState: false });
        });

        it('returns undefined instead of throwing for a malformed payload', () => {
            const malformed = new Uint8Array(10).fill(0xff);

            expect(stateParser(readData(MessageTypes.SwitchStateResponse, malformed))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.LightStateResponse, malformed))).toBeUndefined();
        });

        it('returns undefined for non state message types', () => {
            expect(stateParser(readData(MessageTypes.HelloResponse, new Uint8Array()))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.ConnectResponse, new Uint8Array()))).toBeUndefined();
            expect(stateParser(readData(MessageTypes.SubscribeStatesRequest, new Uint8Array()))).toBeUndefined();
        });

        it('returns undefined for list entity message types', () => {
            const payload = ListEntitiesSensorResponse.encode({
                objectId: 'sensor',
                key: 1,
                name: 'Sensor',
                uniqueId: 'uid',
                icon: '',
                unitOfMeasurement: '',
                accuracyDecimals: 0,
                forceUpdate: false,
                deviceClass: '',
            }).finish();
            expect(stateParser(readData(MessageTypes.ListEntitiesSensorResponse, payload))).toBeUndefined();
        });
    });

    describe('transformStates', () => {
        it('only forwards state events for the matching key', async () => {
            const stateEvents$ = new Subject<StateResponses>();
            const listEntity: ListEntitiesLightResponse = {
                objectId: 'transform_test',
                key: 99,
                name: 'My light',
                uniqueId: 'transform_test_uid',
                supportsBrightness: false,
                supportsRgb: false,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 0,
                maxMireds: 0,
                effects: [],
            };
            const transformed$ = transformStates<LightStateResponse>(stateEvents$, listEntity);

            const firstMatchingEvent = firstValueFrom(transformed$);
            stateEvents$.next({ key: 42 } as StateResponses);
            stateEvents$.next({ key: 99, state: true, brightness: 1 });

            const received = await firstMatchingEvent;
            expect(received).toEqual({ key: 99, state: true, brightness: 1 });
        });
    });

    describe('createComponents', () => {
        let stateEvents$: Subject<StateResponses>;
        let debugConnection: DebugConnection;

        beforeEach(() => {
            stateEvents$ = new Subject<StateResponses>();
            debugConnection = new DebugConnection();
        });

        it('creates a switch component and wires its state', () => {
            const payload = ListEntitiesSwitchResponse.encode({
                objectId: 'created_switch',
                key: 32,
                name: 'Kitchen switch',
                uniqueId: 'uid_32',
                icon: 'mdi:toggle-switch',
                assumedState: true,
            }).finish();
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesSwitchResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_switch');
            expect(component).toBeInstanceOf(SwitchComponent);
            const switchComponent = component as SwitchComponent;
            expect(switchComponent.type).toBe('switch');
            expect(switchComponent.name).toBe('Kitchen switch');
            expect(switchComponent.key).toBe(32);

            stateEvents$.next({ key: 32, state: true });
            expect(switchComponent.status).toBe(true);
        });

        it('creates a light component with its entity details', () => {
            const payload = ListEntitiesLightResponse.encode({
                objectId: 'created_light',
                key: 7,
                name: 'My light',
                uniqueId: 'uid_7',
                supportsBrightness: true,
                supportsRgb: true,
                supportsWhiteValue: false,
                supportsColorTemperature: false,
                minMireds: 153,
                maxMireds: 500,
                effects: ['None', 'Rainbow'],
            }).finish();
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesLightResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_light');
            expect(component).toBeInstanceOf(LightComponent);
            const lightComponent = component as LightComponent;
            expect(lightComponent.type).toBe('light');
            expect(lightComponent.supportsRgb).toBe(true);
            expect(lightComponent.supportsBrightness).toBe(true);
            expect(lightComponent.availableEffects()).toEqual(['None', 'Rainbow']);
        });

        it('creates a sensor component with its entity details and state', () => {
            const payload = ListEntitiesSensorResponse.encode({
                objectId: 'created_sensor',
                key: 1578816251,
                name: 'Living room temperature',
                uniqueId: 'uid_sensor',
                icon: 'mdi:thermometer',
                unitOfMeasurement: '°C',
                accuracyDecimals: 1,
                forceUpdate: true,
                deviceClass: 'temperature',
            }).finish();
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesSensorResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_sensor');
            expect(component).toBeInstanceOf(SensorComponent);
            const sensorComponent = component as SensorComponent;
            expect(sensorComponent.type).toBe('sensor');
            expect(sensorComponent.icon).toBe('mdi:thermometer');
            expect(sensorComponent.unitOfMeasurement).toBe('°C');
            expect(sensorComponent.deviceClass).toBe('temperature');

            stateEvents$.next({ key: 1578816251, state: 22.5 } as StateResponses);
            expect(sensorComponent.value).toBeCloseTo(22.5);
        });

        it('creates a binary sensor component which receives its state', () => {
            const payload = ListEntitiesBinarySensorResponse.encode({
                objectId: 'created_binary_sensor',
                key: 12,
                name: 'Back door',
                uniqueId: 'uid_bs',
                deviceClass: 'door',
                isStatusBinarySensor: true,
            }).finish();
            const { id, component } = createComponents(
                readData(MessageTypes.ListEntitiesBinarySensorResponse, payload),
                stateEvents$,
                debugConnection,
                new Set(),
            );

            expect(id).toBe('created_binary_sensor');
            expect(component).toBeInstanceOf(BinarySensorComponent);
            const binarySensorComponent = component as BinarySensorComponent;
            expect(binarySensorComponent.type).toBe('binarySensor');
            expect(binarySensorComponent.deviceClass).toBe('door');
            expect(binarySensorComponent.ready).toBe(false);

            stateEvents$.next({ key: 12, state: true });
            expect(binarySensorComponent.ready).toBe(true);
            expect(binarySensorComponent.status).toBe(true);
        });

        it('only provides the state observable for known components', async () => {
            const objectId = 'already_known';
            const payload = ListEntitiesSwitchResponse.encode({
                objectId,
                key: 55,
                name: 'Hallway switch',
                uniqueId: 'uid_55',
                icon: '',
                assumedState: false,
            }).finish();
            const { id, component, state$ } = createComponents(
                readData(MessageTypes.ListEntitiesSwitchResponse, payload),
                stateEvents$,
                debugConnection,
                new Set([objectId]),
            );

            expect(component).toBeUndefined();
            expect(id).toBe(objectId);
            expect(state$).toBeDefined();

            const firstMatchingEvent = firstValueFrom(state$!);
            stateEvents$.next({ key: 42, state: true });
            stateEvents$.next({ key: 55, state: false });

            const received = await firstMatchingEvent;
            expect(received).toEqual({ key: 55, state: false });
        });

        it('returns an empty entry for list entity message types outside the component switch', () => {
            const result = createComponents(
                readData(MessageTypes.ListEntitiesRequest, new Uint8Array()),
                stateEvents$,
                debugConnection,
                new Set(),
            );
            expect(result).toEqual({ id: '' });
            expect(result.component).toBeUndefined();
            expect(result.state$).toBeUndefined();
        });

        it('returns an empty entry for plain requests sent through the switch', () => {
            const result = createComponents(
                readData(MessageTypes.SubscribeLogsRequest, new Uint8Array()),
                stateEvents$,
                debugConnection,
                new Set(['whatever']),
            );
            expect(result).toEqual({ id: '' });
        });
    });

    describe('emptyCommandInterface', () => {
        it('silently accepts any command', () => {
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.PingRequest, new Uint8Array()),
            ).not.toThrow();
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.LightCommandRequest, new Uint8Array([1, 2, 3])),
            ).not.toThrow();
        });
    });
});
