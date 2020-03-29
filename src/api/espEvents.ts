export interface EspEvent {
    type: 'state' | 'log' | 'ping';
    data: any;
    lastEventId: string;
    origin: string;
}
