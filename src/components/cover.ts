import { BaseComponent } from './base';
import { ComponentType, CoverEntity } from './entities';
import { MessageTypes } from '../api';
import { CoverCommandRequest, CoverOperation, LegacyCoverCommand } from '../api/protobuf/api';
import { CoverStateEvent } from './states';
import { title } from 'process';

export class CoverComponent extends BaseComponent<CoverEntity, CoverStateEvent> {
    public open(): void {
        this.queueCommand(MessageTypes.CoverCommandRequest, () =>
            CoverCommandRequest.encode(this.generateState(LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN, 1.0)).finish(),
        );
    }

    public close(): void {
        this.queueCommand(MessageTypes.CoverCommandRequest, () =>
            CoverCommandRequest.encode(this.generateState(LegacyCoverCommand.LEGACY_COVER_COMMAND_CLOSE, 0.0)).finish(),
        );
    }

    public stop(): void {
        this.queueCommand(MessageTypes.CoverCommandRequest, () =>
            CoverCommandRequest.encode(this.generateState(LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP, -1)).finish(),
        );
    }

    public setPosition(position: number): void {
        if (!this.supportsPosition) {
            return;
        }

        this.queueCommand(MessageTypes.CoverCommandRequest, () =>
            CoverCommandRequest.encode({
                ...this.generateState(LegacyCoverCommand.UNRECOGNIZED, position),
            }).finish(),
        );
    }

    public get assumedState(): boolean {
        return this.listEntity.assumedState;
    }

    public get supportsPosition(): boolean {
        return this.listEntity.supportsPosition;
    }

    public get supportsTilt(): boolean {
        return this.listEntity.supportsTilt;
    }

    public get type(): ComponentType {
        return 'cover';
    }

    private generateState(command: LegacyCoverCommand, position: number): CoverCommandRequest {
        const state = this.state.getValue();
        return {
            key: this.key,
            hasLegacyCommand: command ? true : false,
            legacyCommand: command,
            hasPosition: command != LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP,
            position: position,
            hasTilt: false,
            tilt: 0,
            stop: command === LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP,
        };
    }
}
