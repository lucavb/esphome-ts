import {
    ConnectRequest,
    ConnectResponse,
    DeviceInfoRequest,
    DeviceInfoResponse,
    HelloRequest,
    HelloResponse,
    ListEntitiesRequest,
    PingRequest,
    PingResponse,
    SubscribeStatesRequest,
} from './protobuf/api';
import { Client } from './client';
import { ReadData } from './connection';
import { Observable, of, Subscription } from 'rxjs';
import { MessageTypes } from './requestResponseMatching';
import { filter, switchMap, take, tap } from 'rxjs/operators';
import { Message, Reader } from 'protobufjs/minimal';
import { EspSocket } from './espSocket';
import { voidMessage } from './protobuf/api_options';
import { error } from 'console';

// import Noise from 'noise-handshake';
// import Cipher from 'noise-handshake/cipher';
var createNoise = require("@richardhopton/noise-c.wasm");



// enum NoiseConnectionState{
//     HELLO = 1,
//     HANDSHAKE = 2,
//     READY = 3,
//     CLOSED = 4,
// }


export class NoiseClient implements Client {
    private readonly subscription: Subscription;
    private client: {
        Initialize: (arg0: Uint8Array, arg1: null, arg2: null, arg3: Uint8Array) => void;
        WriteMessage: () => any;
        ReadMessage: (arg0: Buffer, arg1: boolean) => void;
        Split: () => [any, any];
    };
    private encryptor: { 
        EncryptWithAd: (arg0: never[], arg1: any) => Uint8Array; 
    }  | undefined;
    private  decryptor: { 
        DecryptWithAd: (arg0: never[], arg1: Buffer | null) => void; 
    } | undefined;
    
    // private state: NoiseConnectionState = NoiseConnectionState.HELLO;

    constructor(private readonly socket: EspSocket, 
        private readonly encryptionKey: string) {
        console.log("~~~noiseClient.constructor~~~");
        this.subscription = new Subscription();
        // this.state = NoiseConnectionState.HELLO;
        this.subscription.add(
            this.socket.espData$
                .pipe(
                    tap((data) => {
                        if (data.type === MessageTypes.PingRequest) {
                            this.socket.sendEspMessageEncrypted(MessageTypes.PingResponse, PingResponse.encode({}).finish());
                        }
                    }),
                )
                .subscribe(),
        );

        // setup noise client
        const psk = Buffer.from(encryptionKey, "base64");
        this.client = {} as any;
        new Promise((res) => createNoise(res))
        .then(result => {
            var noise = result as any;
            this.client = noise.HandshakeState(
                "Noise_NNpsk0_25519_ChaChaPoly_SHA256",
                noise.constants.NOISE_ROLE_INITIATOR
            );
                
            this.client.Initialize(
                new Uint8Array(Buffer.from("NoiseAPIInit\x00\x00")),    // prologue
                null,                                                   // s
                null,                                                   // rs
                new Uint8Array(psk)                                     // psk
            );
        });

           
    }

    public terminate(): void {
        this.subscription.unsubscribe();
    }

    hello(request: HelloRequest): Observable<HelloResponse> {
        const frame = new Uint8Array();
        const payload = this.writeHandshakePacket(new Uint8Array());

        this.socket.sendEspMessageEncrypted(MessageTypes.HelloRequest, payload);

        return this.socket.espData$.pipe(
            // filter((value: ReadData) => value.type === MessageTypes.HelloResponse),
            take(1),
            tap((data: ReadData) => console.log(`some error (${data.type}): ${data.payload.toString()}`)),
            switchMap((data: ReadData) => of({ serverInfo: data.payload.toString() } as HelloResponse)),
        );
    }

    connect(request: ConnectRequest): Observable<ConnectResponse> {
        console.log("~~~noiseClient.connect~~~");
        const payload = this.writeHandshakePacket( Buffer.from(["\x00",...this.client.WriteMessage()]));

        this.socket.sendEspMessageEncrypted(MessageTypes.ConnectRequest, payload);

            
        return this.socket.espData$.pipe(
            // filter((value: ReadData) => value.type === MessageTypes.HelloResponse),
            take(1),
            switchMap((data: ReadData) => {
                var invalidPassword = true;

                this.client.ReadMessage(Buffer.from(data.payload), true);
                var tempEncryptor: { EncryptWithAd: (arg0: never[], arg1: any) => Uint8Array; }
                var tempDecryptor;
        
                [tempEncryptor, tempDecryptor] = this.client.Split();
                if(tempEncryptor != null){
                    invalidPassword = false;
                    this.encryptor = tempEncryptor;
                }
                if(tempEncryptor != null){
                    this.decryptor = tempDecryptor;
                }

                return of({ invalidPassword } as ConnectResponse);
            }),
        );
    }

    ping(): Observable<PingResponse> {
        console.log("~~~noiseClient.ping()~~~");
        const data = PingRequest.encode({}).finish();
        this.socket.sendEspMessageEncrypted(MessageTypes.ConnectRequest, data);
        return this.socket.espData$.pipe(
            filter((value: ReadData) => value.type === MessageTypes.PingResponse),
            take(1),
            switchMap((data: ReadData) => of(PingResponse.decode(new Reader(data.payload)))),
        );
    }

    deviceInfo(): Observable<DeviceInfoResponse> {
        console.log("~~~noiseClient.deviceInfo()~~~");
        const data = DeviceInfoRequest.encode({}).finish();
        this.sendMessage(MessageTypes.DeviceInfoRequest, data);

        return this.socket.espData$.pipe(
            filter(({ type }: ReadData) => type === MessageTypes.DeviceInfoResponse),
            tap((data: ReadData) => console.log(`deviceInfo: ${data.payload}`)),
            take(1),
            switchMap(({ payload }: ReadData) => of(DeviceInfoResponse.decode(new Reader(payload)))),
        );
    }

    listEntities(): Observable<voidMessage> {
        console.log("~~~noiseClient.listEntities~~~");

        const data = ListEntitiesRequest.encode({}).finish();
        this.sendMessage(MessageTypes.ListEntitiesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
    }

    subscribeStateChange(): Observable<voidMessage> {
        console.log("~~~noiseClient.subscribeStateChange~~~");
        const data = SubscribeStatesRequest.encode({}).finish();
        this.sendMessage(MessageTypes.SubscribeStatesRequest, data);
        return of(voidMessage.decode(new Reader(new Uint8Array())));
        
    }
    
    sendMessage(requestType: MessageTypes, encodedMessage: Uint8Array){
        // get packet frame
        const packet = this.writePacket(requestType, encodedMessage);  
        
        // encrypt
        if(this.encryptor == undefined){
            throw new Error("We have not established a connection with the server, encryptionKey needs to be set correctly");
        }
        const encryptedMessage = this.encryptor.EncryptWithAd([], packet);
        console.info(`sendMessage, (${requestType}), (${encodedMessage}), (${packet}), (${encryptedMessage})`);
        //send
        this.socket.sendEspMessageEncrypted(MessageTypes.DeviceInfoRequest, encryptedMessage);
    }
    writePacket(requestType: MessageTypes, frame: Uint8Array) {
        const frameLength = frame.length;
        const header = [(requestType >> 8) & 0xFF, 
                        requestType & 0xFF, 
                        (frameLength >> 8) & 0xFF, 
                        frameLength & 0xFF];
        var payload: Uint8Array;
        if(frameLength == 0){
            return Uint8Array.from(header);
        }else{
            payload = Buffer.from([...header, ...frame]);
        }

        return payload;
    }
    
    writeHandshakePacket(frame: Uint8Array){
        const frameLength = frame.length;
        const header = [0x01, (frameLength >> 8) & 0xFF, frameLength & 0xFF];
        const payload = Buffer.from([...header, ...frame]);
        return payload;
    }
    
}

