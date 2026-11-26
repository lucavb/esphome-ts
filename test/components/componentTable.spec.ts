import { Subject } from 'rxjs';
import { type ReadData } from '../../src/api/framer';
import {
    ClimateAction,
    ClimateCommandRequest,
    ClimateFanMode,
    ClimateMode,
    ClimatePreset,
    ClimateStateResponse,
    ClimateSwingMode,
    ColorMode,
    CoverOperation,
    FanDirection,
    FanSpeed,
    LegacyCoverState,
    ListEntitiesBinarySensorResponse,
    ListEntitiesClimateResponse,
    ListEntitiesCoverResponse,
    ListEntitiesFanResponse,
    ListEntitiesLightResponse,
    ListEntitiesSensorResponse,
    ListEntitiesSwitchResponse,
    TemperatureUnit,
} from '../../src/api/protobuf/api';
import { type ApiVersion } from '../../src/api/protocolVersion';
import { MessageTypes } from '../../src/api/requestResponseMatching';
import {
    BinarySensorComponent,
    ClimateComponent,
    CoverComponent,
    FanComponent,
    LightComponent,
    SensorComponent,
    SwitchComponent,
} from '../../src/components';
import { type StateResponses } from '../../src/components/componentKinds';
import { ComponentTable, fallbackEntityId, type ListFrameOutcome } from '../../src/components/componentTable';
import { emptyCommandInterface } from '../../src/components/commandInterface';
import { type SwitchStateEvent } from '../../src/components/states';
import { DebugConnection } from '../testHelpers/debugConnection';

const readData = (type: MessageTypes, payload: Uint8Array): ReadData => ({ type, payload });

interface TableHarness {
    readonly table: ComponentTable;
    readonly stateEvents$: Subject<StateResponses>;
    readonly connection: DebugConnection;
}

const makeTable = (options: { apiVersion?: ApiVersion; connection?: DebugConnection } = {}): TableHarness => {
    const stateEvents$ = new Subject<StateResponses>();
    const connection = options.connection ?? new DebugConnection();
    const table = new ComponentTable({
        stateEvents$,
        connection,
        apiVersion: options.apiVersion ?? { major: 1, minor: 8 },
    });
    return { table, stateEvents$, connection };
};

const apply = (harness: TableHarness, type: MessageTypes, payload: Uint8Array): ListFrameOutcome => {
    const outcome = harness.table.applyListFrame(readData(type, payload));
    if (outcome === undefined) {
        throw new Error(`expected ${MessageTypes[type]} to belong to a Component kind`);
    }
    return outcome;
};

const switchPayload = (overrides: Partial<ListEntitiesSwitchResponse> = {}): Uint8Array =>
    ListEntitiesSwitchResponse.encode({
        ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
        objectId: 'created_switch',
        key: 32,
        name: 'Kitchen switch',
        uniqueId: 'uid_32',
        ...overrides,
    }).finish();

describe('ComponentTable', () => {
    describe('creation', () => {
        it('creates a switch component and wires its state', () => {
            const harness = makeTable();

            const outcome = apply(harness, MessageTypes.ListEntitiesSwitchResponse, switchPayload());

            expect(outcome).toEqual({ status: 'created', id: 'created_switch' });
            const component = harness.table.byId[outcome.id];
            expect(component).toBeInstanceOf(SwitchComponent);
            const toggle = component as SwitchComponent;
            expect(toggle.type).toBe('switch');
            expect(toggle.name).toBe('Kitchen switch');
            expect(toggle.key).toBe(32);

            harness.stateEvents$.next({ key: 32, state: true });
            expect(toggle.status).toBe(true);
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
                supportedColorModes: [ColorMode.COLOR_MODE_RGB, ColorMode.COLOR_MODE_COLD_WARM_WHITE],
            }).finish();
            const harness = makeTable();

            const outcome = apply(harness, MessageTypes.ListEntitiesLightResponse, payload);

            expect(outcome).toEqual({ status: 'created', id: 'created_light' });
            const component = harness.table.byId[outcome.id] as LightComponent;
            expect(component).toBeInstanceOf(LightComponent);
            expect(component.type).toBe('light');
            expect(component.supportsRgb).toBe(true);
            expect(component.supportsBrightness).toBe(true);
            expect(component.supportsColorMode).toBe(true);
            expect(component.supportedColorModes).toEqual([
                ColorMode.COLOR_MODE_RGB,
                ColorMode.COLOR_MODE_COLD_WARM_WHITE,
            ]);
            expect(component.supportsColorTemperature).toBe(true);
            expect(component.minMireds).toBe(153);
            expect(component.maxMireds).toBe(500);
            expect(component.availableEffects()).toEqual(['None', 'Rainbow']);
        });

        it('creates a cover component and wires its state', () => {
            const payload = ListEntitiesCoverResponse.encode({
                objectId: 'created_cover',
                key: 9,
                name: 'Garage door',
                uniqueId: 'uid_cover',
                assumedState: true,
                supportsPosition: true,
                supportsTilt: false,
                supportsStop: true,
                deviceClass: 'garage',
            }).finish();
            const harness = makeTable();

            const outcome = apply(harness, MessageTypes.ListEntitiesCoverResponse, payload);

            expect(outcome).toEqual({ status: 'created', id: 'created_cover' });
            const component = harness.table.byId[outcome.id] as CoverComponent;
            expect(component).toBeInstanceOf(CoverComponent);
            expect(component.type).toBe('cover');
            expect(component.supportsPosition).toBe(true);
            expect(component.supportsStop).toBe(true);
            expect(component.supportsTilt).toBe(false);
            expect(component.assumedState).toBe(true);
            expect(component.tilt).toBeUndefined();

            harness.stateEvents$.next({
                key: 9,
                legacyState: LegacyCoverState.LEGACY_COVER_STATE_CLOSED,
                position: 0.4,
                tilt: 0,
                currentOperation: CoverOperation.COVER_OPERATION_IS_CLOSING,
            });
            expect(component.position).toBeCloseTo(0.4);
            expect(component.operation).toBe(CoverOperation.COVER_OPERATION_IS_CLOSING);
            expect(component.isClosed).toBe(false);
        });

        it('creates a fan component with its capabilities and state', () => {
            const payload = ListEntitiesFanResponse.encode({
                objectId: 'created_fan',
                key: 10,
                name: 'Bedroom fan',
                uniqueId: 'uid_fan',
                supportsOscillation: true,
                supportsSpeed: true,
                supportsDirection: true,
                supportedSpeedCount: 4,
                supportedPresetModes: ['auto', 'sleep'],
            }).finish();
            const harness = makeTable();

            const outcome = apply(harness, MessageTypes.ListEntitiesFanResponse, payload);

            expect(outcome).toEqual({ status: 'created', id: 'created_fan' });
            const component = harness.table.byId[outcome.id] as FanComponent;
            expect(component).toBeInstanceOf(FanComponent);
            expect(component.type).toBe('fan');
            expect(component.speedCount).toBe(4);
            expect(component.supportsSpeed).toBe(true);
            expect(component.supportsOscillation).toBe(true);
            expect(component.supportsDirection).toBe(true);
            expect(component.supportedPresetModes).toEqual(['auto', 'sleep']);
            expect(component.ready).toBe(false);

            harness.stateEvents$.next({
                key: 10,
                state: true,
                speedLevel: 2,
                oscillating: true,
                direction: FanDirection.FAN_DIRECTION_REVERSE,
                presetMode: 'sleep',
            });
            expect(component.ready).toBe(true);
            expect(component.status).toBe(true);
            expect(component.speedLevel).toBe(2);
            expect(component.speedPercentage).toBe(50);
            expect(component.oscillating).toBe(true);
            expect(component.direction).toBe(FanDirection.FAN_DIRECTION_REVERSE);
            expect(component.presetMode).toBe('sleep');
        });

        it('uses the negotiated API version for the legacy fan speed enum', () => {
            const payload = ListEntitiesFanResponse.encode({
                ...ListEntitiesFanResponse.decode(new Uint8Array()),
                objectId: 'legacy_fan',
                key: 13,
                name: 'Old fan',
                uniqueId: 'uid_old_fan',
                supportsSpeed: true,
            }).finish();
            const harness = makeTable({ apiVersion: { major: 1, minor: 3 } });

            const outcome = apply(harness, MessageTypes.ListEntitiesFanResponse, payload);

            const component = harness.table.byId[outcome.id] as FanComponent;
            expect(component.speedCount).toBe(3);

            harness.stateEvents$.next({ key: 13, state: true, speed: FanSpeed.FAN_SPEED_HIGH });
            expect(component.speedLevel).toBe(3);
            expect(component.speedPercentage).toBe(100);
        });

        it('creates a climate component with its capabilities and state', () => {
            const connection = new DebugConnection();
            const payload = ListEntitiesClimateResponse.encode({
                ...ListEntitiesClimateResponse.decode(new Uint8Array()),
                objectId: 'created_climate',
                key: 11,
                name: 'Air conditioner',
                uniqueId: 'uid_climate',
                supportsCurrentTemperature: true,
                supportsTwoPointTargetTemperature: false,
                supportedModes: [ClimateMode.CLIMATE_MODE_OFF, ClimateMode.CLIMATE_MODE_COOL],
                visualMinTemperature: 16,
                visualMaxTemperature: 32,
                visualTargetTemperatureStep: 0.5,
                legacySupportsAway: false,
                supportsAction: true,
                supportedFanModes: [ClimateFanMode.CLIMATE_FAN_AUTO, ClimateFanMode.CLIMATE_FAN_HIGH],
                supportedSwingModes: [ClimateSwingMode.CLIMATE_SWING_BOTH],
                supportedCustomFanModes: ['Silent'],
                supportedPresets: [ClimatePreset.CLIMATE_PRESET_HOME],
                supportedCustomPresets: ['Party'],
                supportsCurrentHumidity: false,
                supportsTargetHumidity: false,
                temperatureUnit: TemperatureUnit.TEMPERATURE_UNIT_FAHRENHEIT,
            }).finish();
            const harness = makeTable({ connection });

            const outcome = apply(harness, MessageTypes.ListEntitiesClimateResponse, payload);

            expect(outcome).toEqual({ status: 'created', id: 'created_climate' });
            const component = harness.table.byId[outcome.id] as ClimateComponent;
            expect(component).toBeInstanceOf(ClimateComponent);
            expect(component.type).toBe('climate');
            expect(component.supportsCurrentTemperature).toBe(true);
            expect(component.supportsTwoPointTargetTemperature).toBe(false);
            expect(component.supportsAction).toBe(true);
            expect(component.supportedModes).toEqual([ClimateMode.CLIMATE_MODE_OFF, ClimateMode.CLIMATE_MODE_COOL]);
            expect(component.supportedFanModes).toEqual([
                ClimateFanMode.CLIMATE_FAN_AUTO,
                ClimateFanMode.CLIMATE_FAN_HIGH,
            ]);
            expect(component.supportedCustomFanModes).toEqual(['Silent']);
            expect(component.supportedSwingModes).toEqual([ClimateSwingMode.CLIMATE_SWING_BOTH]);
            expect(component.supportedPresets).toEqual([ClimatePreset.CLIMATE_PRESET_HOME]);
            expect(component.supportedCustomPresets).toEqual(['Party']);
            expect(component.temperatureUnit).toBe(TemperatureUnit.TEMPERATURE_UNIT_FAHRENHEIT);
            expect(component.visualMinTemperature).toBeCloseTo(16);
            expect(component.visualMaxTemperature).toBeCloseTo(32);
            expect(component.ready).toBe(false);

            harness.stateEvents$.next({
                key: 11,
                mode: ClimateMode.CLIMATE_MODE_COOL,
                currentTemperature: 25.5,
                targetTemperature: 23,
                targetTemperatureLow: 0,
                targetTemperatureHigh: 0,
                unusedLegacyAway: false,
                action: ClimateAction.CLIMATE_ACTION_COOLING,
                fanMode: ClimateFanMode.CLIMATE_FAN_HIGH,
                swingMode: ClimateSwingMode.CLIMATE_SWING_OFF,
                customFanMode: '',
                preset: ClimatePreset.CLIMATE_PRESET_HOME,
                customPreset: '',
                currentHumidity: 0,
                targetHumidity: 0,
                missingState: false,
            });
            expect(component.ready).toBe(true);
            expect(component.mode).toBe(ClimateMode.CLIMATE_MODE_COOL);
            expect(component.currentTemperature).toBeCloseTo(25.5);
            expect(component.targetTemperature).toBeCloseTo(23);
            expect(component.fanMode).toBe(ClimateFanMode.CLIMATE_FAN_HIGH);
            expect(component.customFanMode).toBeUndefined();

            // Firmware clears the regular fan mode while a custom mode is
            // active, so the zero default must not read as FAN_ON.
            harness.stateEvents$.next({
                ...ClimateStateResponse.decode(new Uint8Array()),
                key: 11,
                fanMode: ClimateFanMode.CLIMATE_FAN_ON,
                customFanMode: 'Silent',
            });
            expect(component.fanMode).toBeUndefined();
            expect(component.customFanMode).toBe('Silent');

            // The discovered component commands through the table's connection,
            // not the inert emptyCommandInterface the read-only kinds get.
            component.setMode(ClimateMode.CLIMATE_MODE_COOL);
            expect(connection.calls.length).toBe(1);
            expect(connection.calls[0][0]).toBe(MessageTypes.ClimateCommandRequest);
            expect(ClimateCommandRequest.decode(connection.calls[0][1]).key).toBe(11);
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
            const harness = makeTable();

            const outcome = apply(harness, MessageTypes.ListEntitiesSensorResponse, payload);

            expect(outcome).toEqual({ status: 'created', id: 'created_sensor' });
            const component = harness.table.byId[outcome.id] as SensorComponent;
            expect(component).toBeInstanceOf(SensorComponent);
            expect(component.type).toBe('sensor');
            expect(component.icon).toBe('mdi:thermometer');
            expect(component.unitOfMeasurement).toBe('°C');
            expect(component.deviceClass).toBe('temperature');

            harness.stateEvents$.next({ key: 1578816251, state: 22.5 } as StateResponses);
            expect(component.value).toBeCloseTo(22.5);
        });

        it('creates a binary sensor component and wires its state', () => {
            const payload = ListEntitiesBinarySensorResponse.encode({
                objectId: 'created_binary_sensor',
                key: 12,
                name: 'Back door',
                uniqueId: 'uid_bs',
                deviceClass: 'door',
                isStatusBinarySensor: true,
            }).finish();
            const harness = makeTable();

            const outcome = apply(harness, MessageTypes.ListEntitiesBinarySensorResponse, payload);

            expect(outcome).toEqual({ status: 'created', id: 'created_binary_sensor' });
            const component = harness.table.byId[outcome.id] as BinarySensorComponent;
            expect(component).toBeInstanceOf(BinarySensorComponent);
            expect(component.type).toBe('binarySensor');
            expect(component.deviceClass).toBe('door');
            expect(component.ready).toBe(false);

            harness.stateEvents$.next({ key: 12, state: true });
            expect(component.ready).toBe(true);
            expect(component.status).toBe(true);
        });
    });

    describe('identity', () => {
        it('reuses the public id for a known numeric key and filters state by key', () => {
            const harness = makeTable();
            const first = apply(harness, MessageTypes.ListEntitiesSwitchResponse, switchPayload());
            const component = harness.table.byId[first.id] as SwitchComponent;

            const outcome = apply(
                harness,
                MessageTypes.ListEntitiesSwitchResponse,
                switchPayload({ objectId: 'renamed_switch' }),
            );

            expect(outcome).toEqual({ status: 'rebound', id: first.id });
            expect(harness.table.byId[first.id]).toBe(component);

            const received: SwitchStateEvent[] = [];
            component.state$.subscribe((state) => received.push(state));
            harness.stateEvents$.next({ key: 42, state: true });
            harness.stateEvents$.next({ key: 32, state: false });
            expect(received).toEqual([{ key: 32, state: false }]);
        });

        it('uses deterministic key-based IDs for empty object IDs across every kind', () => {
            const entities = [
                [
                    MessageTypes.ListEntitiesBinarySensorResponse,
                    ListEntitiesBinarySensorResponse.encode({
                        ...ListEntitiesBinarySensorResponse.decode(new Uint8Array()),
                        key: 101,
                    }).finish(),
                    BinarySensorComponent,
                ],
                [
                    MessageTypes.ListEntitiesCoverResponse,
                    ListEntitiesCoverResponse.encode({
                        ...ListEntitiesCoverResponse.decode(new Uint8Array()),
                        key: 102,
                    }).finish(),
                    CoverComponent,
                ],
                [
                    MessageTypes.ListEntitiesClimateResponse,
                    ListEntitiesClimateResponse.encode({
                        ...ListEntitiesClimateResponse.decode(new Uint8Array()),
                        key: 107,
                    }).finish(),
                    ClimateComponent,
                ],
                [
                    MessageTypes.ListEntitiesSwitchResponse,
                    ListEntitiesSwitchResponse.encode({
                        ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                        key: 103,
                    }).finish(),
                    SwitchComponent,
                ],
                [
                    MessageTypes.ListEntitiesFanResponse,
                    ListEntitiesFanResponse.encode({
                        ...ListEntitiesFanResponse.decode(new Uint8Array()),
                        key: 106,
                    }).finish(),
                    FanComponent,
                ],
                [
                    MessageTypes.ListEntitiesLightResponse,
                    ListEntitiesLightResponse.encode({
                        ...ListEntitiesLightResponse.decode(new Uint8Array()),
                        key: 104,
                    }).finish(),
                    LightComponent,
                ],
                [
                    MessageTypes.ListEntitiesSensorResponse,
                    ListEntitiesSensorResponse.encode({
                        ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                        key: 105,
                    }).finish(),
                    SensorComponent,
                ],
            ] as const;

            for (const [type, payload, Component] of entities) {
                const harness = makeTable();
                const outcome = apply(harness, type, payload);
                const component = harness.table.byId[outcome.id];
                expect(outcome.id).toBe(fallbackEntityId(component.key));
                expect(component).toBeInstanceOf(Component);
            }
        });

        it('avoids a fallback ID already occupied by a different object ID', () => {
            const harness = makeTable();
            const occupiedId = fallbackEntityId(17);
            apply(
                harness,
                MessageTypes.ListEntitiesSensorResponse,
                ListEntitiesSensorResponse.encode({
                    ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                    objectId: occupiedId,
                    key: 99,
                }).finish(),
            );

            const outcome = apply(
                harness,
                MessageTypes.ListEntitiesSensorResponse,
                ListEntitiesSensorResponse.encode({
                    ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                    key: 17,
                }).finish(),
            );

            expect(outcome.id).toBe(`${occupiedId}_1`);
            expect(harness.table.byId[outcome.id]).toBeInstanceOf(SensorComponent);
            expect(harness.table.byId[occupiedId]).toBeInstanceOf(SensorComponent);
        });

        it('reuses the existing ID by numeric key when the object ID changes', () => {
            const harness = makeTable();
            const payload = (objectId: string): Uint8Array =>
                ListEntitiesSensorResponse.encode({
                    ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                    objectId,
                    key: 18,
                }).finish();
            apply(harness, MessageTypes.ListEntitiesSensorResponse, payload('sensor_before'));
            const component = harness.table.byId['sensor_before'];

            const outcome = apply(harness, MessageTypes.ListEntitiesSensorResponse, payload(''));

            expect(outcome).toEqual({ status: 'rebound', id: 'sensor_before' });
            expect(harness.table.byId['sensor_before']).toBe(component);
        });

        it('does not overwrite a different entity with a duplicate nonempty object ID', () => {
            const harness = makeTable();
            const payload = (key: number): Uint8Array =>
                ListEntitiesSwitchResponse.encode({
                    ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                    objectId: 'duplicate_object_id',
                    key,
                }).finish();
            apply(harness, MessageTypes.ListEntitiesSwitchResponse, payload(20));

            const outcome = apply(harness, MessageTypes.ListEntitiesSwitchResponse, payload(19));

            expect(outcome.id).toBe(fallbackEntityId(19));
            expect(harness.table.byId['duplicate_object_id']).toBeInstanceOf(SwitchComponent);
            expect(harness.table.byId[outcome.id]).toBeInstanceOf(SwitchComponent);
        });
        it('keeps a __proto__ object ID as an ordinary key', () => {
            const harness = makeTable();
            const payload = ListEntitiesSensorResponse.encode({
                ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                objectId: '__proto__',
                key: 71,
            }).finish();

            const outcome = apply(harness, MessageTypes.ListEntitiesSensorResponse, payload);

            // Pin the literal id: a fallback or a special case that rewrites
            // the id would leave the rest of this test green.
            expect(outcome.id).toBe('__proto__');
            const component = harness.table.byId[outcome.id];
            expect(component).toBeInstanceOf(SensorComponent);
            // A plain assignment would have routed the id through the prototype
            // setter, hiding the Component from values and terminate().
            expect(Object.values(harness.table.byId)).toContain(component);
            const terminate = vi.spyOn(component, 'terminate');
            harness.table.terminate();
            expect(terminate).toHaveBeenCalledTimes(1);
        });
    });

    describe('retention', () => {
        it('rebinds a retained component onto refreshed list-entity data', () => {
            const harness = makeTable();
            const payload = (presets: ClimatePreset[]): Uint8Array =>
                ListEntitiesClimateResponse.encode({
                    ...ListEntitiesClimateResponse.decode(new Uint8Array()),
                    objectId: 'retained_climate',
                    key: 21,
                    name: 'Thermostat',
                    supportedPresets: presets,
                }).finish();
            const first = apply(harness, MessageTypes.ListEntitiesClimateResponse, payload([]));
            const component = harness.table.byId[first.id] as ClimateComponent;
            expect(component.supportedPresets).toEqual([]);

            const outcome = apply(
                harness,
                MessageTypes.ListEntitiesClimateResponse,
                payload([ClimatePreset.CLIMATE_PRESET_HOME, ClimatePreset.CLIMATE_PRESET_ECO]),
            );

            expect(outcome).toEqual({ status: 'rebound', id: first.id });
            expect(harness.table.byId[first.id]).toBe(component);
            expect(component.supportedPresets).toEqual([
                ClimatePreset.CLIMATE_PRESET_HOME,
                ClimatePreset.CLIMATE_PRESET_ECO,
            ]);
        });

        it('replaces a retained component when the entity changes kind under the same key', () => {
            const harness = makeTable();
            const objectId = 'morphing_entity';
            const switchFrame = ListEntitiesSwitchResponse.encode({
                ...ListEntitiesSwitchResponse.decode(new Uint8Array()),
                objectId,
                key: 9,
                name: 'Morph',
            }).finish();
            const climateFrame = ListEntitiesClimateResponse.encode({
                ...ListEntitiesClimateResponse.decode(new Uint8Array()),
                objectId,
                key: 9,
                name: 'Morph',
                supportsCurrentTemperature: true,
                supportsAction: true,
                supportedModes: [ClimateMode.CLIMATE_MODE_OFF, ClimateMode.CLIMATE_MODE_HEAT],
                supportedPresets: [],
                temperatureUnit: 0,
            }).finish();
            const first = apply(harness, MessageTypes.ListEntitiesSwitchResponse, switchFrame);
            const retained = harness.table.byId[first.id] as SwitchComponent;
            const terminate = vi.spyOn(retained, 'terminate');

            const outcome = apply(harness, MessageTypes.ListEntitiesClimateResponse, climateFrame);

            expect(outcome).toEqual({ status: 'replaced', id: objectId });
            expect(terminate).toHaveBeenCalledTimes(1);
            expect(harness.table.byId[objectId]).toBeInstanceOf(ClimateComponent);
            expect(harness.table.byId[objectId]).not.toBe(retained);
        });
    });

    describe('lifecycle', () => {
        it('terminates every retained component', () => {
            const harness = makeTable();
            apply(harness, MessageTypes.ListEntitiesSwitchResponse, switchPayload());
            apply(
                harness,
                MessageTypes.ListEntitiesSensorResponse,
                ListEntitiesSensorResponse.encode({
                    ...ListEntitiesSensorResponse.decode(new Uint8Array()),
                    objectId: 'a_sensor',
                    key: 40,
                }).finish(),
            );
            const spies = Object.values(harness.table.byId).map((component) => vi.spyOn(component, 'terminate'));

            harness.table.terminate();

            for (const spy of spies) {
                expect(spy).toHaveBeenCalledTimes(1);
            }
        });

        it('returns undefined for list types outside the registry', () => {
            const harness = makeTable();

            expect(
                harness.table.applyListFrame(readData(MessageTypes.ListEntitiesRequest, new Uint8Array())),
            ).toBeUndefined();
            expect(
                harness.table.applyListFrame(readData(MessageTypes.ListEntitiesTextSensorResponse, new Uint8Array())),
            ).toBeUndefined();
        });

        it('reports a malformed list frame by throwing', () => {
            const harness = makeTable();
            const malformed = new Uint8Array(10).fill(0xff);

            expect(() =>
                harness.table.applyListFrame(readData(MessageTypes.ListEntitiesSwitchResponse, malformed)),
            ).toThrow();
        });

        it('provides a no-op command sink for read-only components', () => {
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.PingRequest, new Uint8Array()),
            ).not.toThrow();
            expect(() =>
                emptyCommandInterface.sendEspMessage(MessageTypes.LightCommandRequest, new Uint8Array([1, 2, 3])),
            ).not.toThrow();
        });
    });
});
