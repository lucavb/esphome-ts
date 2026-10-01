import { MessageTypes } from '../../src/api/requestResponseMatching';

describe('MessageTypes', () => {
    const knownNames = (Object.keys(MessageTypes) as (keyof typeof MessageTypes)[]).filter((key) =>
        Number.isNaN(Number(key)),
    );
    const knownValues = knownNames.map((name) => MessageTypes[name]);
    const valueByName = new Map<number, string>(knownNames.map((name) => [Number(MessageTypes[name]), name]));
    const nameForValue = (value: number): string | undefined => valueByName.get(value);

    it('assigns the documented wire numbers to every message type', () => {
        const expected: Partial<Record<keyof typeof MessageTypes, number>> = {
            HelloRequest: 1,
            HelloResponse: 2,
            ConnectRequest: 3,
            ConnectResponse: 4,
            DisconnectRequest: 5,
            DisconnectResponse: 6,
            PingRequest: 7,
            PingResponse: 8,
            DeviceInfoRequest: 9,
            DeviceInfoResponse: 10,
            ListEntitiesRequest: 11,
            ListEntitiesBinarySensorResponse: 12,
            ListEntitiesCoverResponse: 13,
            ListEntitiesFanResponse: 14,
            ListEntitiesLightResponse: 15,
            ListEntitiesSensorResponse: 16,
            ListEntitiesSwitchResponse: 17,
            ListEntitiesTextSensorResponse: 18,
            ListEntitiesDoneResponse: 19,
            SubscribeStatesRequest: 20,
            BinarySensorStateResponse: 21,
            CoverStateResponse: 22,
            FanStateResponse: 23,
            LightStateResponse: 24,
            SensorStateResponse: 25,
            SwitchStateResponse: 26,
            TextSensorStateResponse: 27,
            SubscribeLogsRequest: 28,
            SubscribeLogsResponse: 29,
            CoverCommandRequest: 30,
            FanCommandRequest: 31,
            LightCommandRequest: 32,
            SwitchCommandRequest: 33,
            SubscribeHomeassistantServicesRequest: 34,
            HomeassistantServiceResponse: 35,
            GetTimeRequest: 36,
            GetTimeResponse: 37,
            SubscribeHomeAssistantStatesRequest: 38,
            SubscribeHomeAssistantStateResponse: 39,
            HomeAssistantStateResponse: 40,
            ListEntitiesServicesResponse: 41,
            ExecuteServiceRequest: 42,
            ListEntitiesCameraResponse: 43,
            CameraImageResponse: 44,
            CameraImageRequest: 45,
            ListEntitiesClimateResponse: 46,
            ClimateStateResponse: 47,
            ClimateCommandRequest: 48,
        };
        for (const [name, value] of Object.entries(expected)) {
            expect(MessageTypes[name as keyof typeof MessageTypes]).toBe(value);
        }
        expect(knownNames.length).toBe(48);
        expect(Object.keys(expected).length).toBe(48);
    });

    it('uses distinct, contiguous numbers starting at 1', () => {
        expect(new Set(knownValues).size).toBe(knownValues.length);
        expect(Math.min(...knownValues)).toBe(1);
        expect(Math.max(...knownValues)).toBe(48);
        expect(knownValues.length).toBe(48);
    });

    it('supports the reverse mapping from wire number to name', () => {
        expect(MessageTypes[MessageTypes.HelloRequest]).toBe('HelloRequest');
        expect(MessageTypes[MessageTypes.ClimateCommandRequest]).toBe('ClimateCommandRequest');
        expect(nameForValue(8)).toBe('PingResponse');
        expect(nameForValue(21)).toBe('BinarySensorStateResponse');
    });

    describe('request/response pairing', () => {
        it.each([
            ['HelloRequest', 'HelloResponse'],
            ['ConnectRequest', 'ConnectResponse'],
            ['DisconnectRequest', 'DisconnectResponse'],
            ['PingRequest', 'PingResponse'],
            ['DeviceInfoRequest', 'DeviceInfoResponse'],
            ['SubscribeLogsRequest', 'SubscribeLogsResponse'],
            ['SubscribeHomeassistantServicesRequest', 'HomeassistantServiceResponse'],
            ['GetTimeRequest', 'GetTimeResponse'],
        ] satisfies [keyof typeof MessageTypes, keyof typeof MessageTypes][])(
            'pairs %s with the adjacent %s',
            (requestName, responseName) => {
                expect(MessageTypes[responseName]).toBe(MessageTypes[requestName] + 1);
            },
        );

        it('answers every state request with exactly one response per component family', () => {
            const stateResponseTypes = [
                MessageTypes.BinarySensorStateResponse,
                MessageTypes.CoverStateResponse,
                MessageTypes.FanStateResponse,
                MessageTypes.LightStateResponse,
                MessageTypes.SensorStateResponse,
                MessageTypes.SwitchStateResponse,
                MessageTypes.TextSensorStateResponse,
            ];
            for (const type of stateResponseTypes) {
                expect(type).toBeGreaterThan(MessageTypes.SubscribeStatesRequest);
            }
            expect(stateResponseTypes.length).toBe(7);
        });

        it('references the list entities family from the ListEntitiesRequest', () => {
            const listEntitiesResponseTypes = [
                MessageTypes.ListEntitiesBinarySensorResponse,
                MessageTypes.ListEntitiesCoverResponse,
                MessageTypes.ListEntitiesFanResponse,
                MessageTypes.ListEntitiesLightResponse,
                MessageTypes.ListEntitiesSensorResponse,
                MessageTypes.ListEntitiesSwitchResponse,
                MessageTypes.ListEntitiesTextSensorResponse,
                MessageTypes.ListEntitiesDoneResponse,
                MessageTypes.ListEntitiesServicesResponse,
                MessageTypes.ListEntitiesCameraResponse,
                MessageTypes.ListEntitiesClimateResponse,
            ];
            for (const type of listEntitiesResponseTypes) {
                expect(type).toBeGreaterThan(MessageTypes.ListEntitiesRequest);
            }
            expect(listEntitiesResponseTypes.length).toBe(11);
        });

        it('places the camera image response before its request', () => {
            expect(MessageTypes.CameraImageResponse).toBe(MessageTypes.CameraImageRequest - 1);
        });

        it('keeps command requests outside the request/link handshake block', () => {
            for (const type of [
                MessageTypes.CoverCommandRequest,
                MessageTypes.FanCommandRequest,
                MessageTypes.LightCommandRequest,
                MessageTypes.SwitchCommandRequest,
            ]) {
                expect(type).toBeGreaterThan(MessageTypes.SubscribeLogsResponse);
            }
        });
    });

    describe('unknown types', () => {
        it('has no reverse mapping outside the declared range', () => {
            expect(MessageTypes[0]).toBeUndefined();
            expect(MessageTypes[49]).toBeUndefined();
            expect(MessageTypes[-1]).toBeUndefined();
            expect(nameForValue(-1)).toBeUndefined();
            expect(nameForValue(0)).toBeUndefined();
            expect(nameForValue(49)).toBeUndefined();
        });

        it('contains no zero and no numbers above the handshake protocol ceiling', () => {
            expect(knownValues).not.toContain(0);
            expect(knownValues.filter((value) => Number(value) > 48)).toEqual([]);
        });
    });
});
