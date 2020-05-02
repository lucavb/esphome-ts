import {EspDevice} from '../../src';
import {EspDeviceMock} from '../testHelpers/espDeviceMock';
import {filter, tap} from 'rxjs/operators';
import {isTrue} from '../../src/api/helpers';


describe('espDevice', () => {

    let deviceMock: EspDeviceMock;
    let device: EspDevice;
    let portNumber: number;

    beforeEach(() => {
        portNumber = 23423;
        deviceMock = new EspDeviceMock(portNumber);
        device = new EspDevice('localhost', '', portNumber);
    });

    afterEach(() => {
        device.terminate();
        deviceMock.terminate();
    });

    it('connects', (done) => {
        device.discovery$.pipe(
            filter(isTrue),
            tap(() => {
                done();
            }),
        ).subscribe();
    }, 5 * 1000);

});
