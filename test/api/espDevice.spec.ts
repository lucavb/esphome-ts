import {EspDevice} from '../../src';
import {EspDeviceMock} from '../testHelpers/espDeviceMock';
import {catchError, filter, switchMapTo, take, tap, timeout} from 'rxjs/operators';
import {isFalse, isTrue} from '../../src/api/helpers';
import {MessageTypes} from '../../src/api/requestResponseMatching';
import {ListEntitiesSwitchResponse} from '../../src/api/protobuf/api';
import {of} from "rxjs";

const listEntitySwitch = {
    key: 1337,
    name: 'my_switch',
    icon: 'some icon',
    assumedState: false,
    objectId: 'objectId',
    uniqueId: 'uniqueId',
};

describe('espDevice', () => {

    let deviceMock: EspDeviceMock;
    let device: EspDevice;
    let portNumber: number;

    beforeEach(() => {
        portNumber = 23423;
        deviceMock = new EspDeviceMock(portNumber);
    });

    afterEach(() => {
        device.terminate();
        deviceMock.terminate();
    });

    it('connects', (done) => {
        device = new EspDevice('localhost', '', portNumber);
        device.discovery$.pipe(
            filter(isTrue),
            take(1),
            tap(() => {
                done();
            }),
        ).subscribe();
    }, 5 * 1000);

    it('parses a light list entity response', (done) => {
        deviceMock.listEntities = [{
            type: MessageTypes.ListEntitiesSwitchResponse,
            data: ListEntitiesSwitchResponse.encode(listEntitySwitch).finish(),
        }];
        device = new EspDevice('localhost', '', portNumber);
        device.discovery$.pipe(
            filter(isTrue),
            take(1),
            tap(() => {
                expect(device.components).toHaveProperty(listEntitySwitch.objectId);
                done();
            }),
        ).subscribe();
    });

    it('alive$ returns false on close', (done) => {
        device = new EspDevice('localhost', '', portNumber);
        device.discovery$.pipe(
            filter(isTrue),
            tap(() => deviceMock.terminate()),
            switchMapTo(device.alive$),
            filter(isFalse),
            timeout(3000),
            catchError(() => of('timeout')),
            tap((val) => {
                expect(val).toBe(false);
                done();
            }),
        ).subscribe();
    });

    xit('alive$ runs out after 90s', (done) => {
        device = new EspDevice('localhost', '', portNumber);
        device.discovery$.pipe(
            filter(isTrue),
            tap(() => deviceMock.ping()),
            switchMapTo(device.alive$),
            filter((val: boolean) => !val),
            tap((val: boolean) => {
                expect(val).toBe(false);
                done();
            }),
        ).subscribe();
    }, 90 * 1000 + 5 * 1000);

});
