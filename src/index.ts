import {NativeApiConnection} from './native_api/connection';
import {NativeApiWrapper} from './native_api/wrapper';


const connection = new NativeApiConnection('10.0.0.118');
connection.connected$.subscribe((connected) => {
    console.log(`we are ${connected ? 'connected' : 'disconnected'}`);
});
connection.open();
const wrapper = new NativeApiWrapper(connection);
wrapper.hello({clientInfo: 'esphome-ts'}).subscribe((data) => {
    console.log(data);
    wrapper.connect({password: ''}).subscribe((response) => {
        console.log(response);
    });
    console.log('ping?');
    wrapper.ping().subscribe(() => {
        console.log('pong!');
    });
});
