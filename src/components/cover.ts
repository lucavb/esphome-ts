import { BaseComponent } from './base';
import { type ComponentType, type CoverEntity } from './entities';
import { type CoverStateEvent } from './states';
import { MessageTypes } from '../api/requestResponseMatching';
import { CoverCommandRequest, type CoverOperation, LegacyCoverCommand } from '../api/protobuf/api';

export class CoverComponent extends BaseComponent<CoverEntity, CoverStateEvent> {
    public open(): void {
        this.sendCommand({ position: 1 });
    }

    public close(): void {
        this.sendCommand({ position: 0 });
    }

    public stop(): void {
        this.sendCommand({ stop: true });
    }

    public setPosition(position: number): void {
        if (!this.supportsPosition) {
            return;
        }
        this.sendCommand({ position });
    }

    public setTilt(tilt: number): void {
        if (!this.supportsTilt) {
            return;
        }
        this.sendCommand({ tilt });
    }

    public get type(): ComponentType {
        return 'cover';
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

    /**
     * Current position between 0 (closed) and 1 (open). Undefined until the
     * first state was received or when the cover does not support positions.
     */
    public get position(): number | undefined {
        if (!this.supportsPosition) {
            return undefined;
        }
        return this.state.getValue()?.position;
    }

    /**
     * Current tilt between 0 and 1. Undefined until the first state was
     * received or when the cover does not support tilt.
     */
    public get tilt(): number | undefined {
        if (!this.supportsTilt) {
            return undefined;
        }
        return this.state.getValue()?.tilt;
    }

    /**
     * Whether the cover is fully closed. Derived from the position field the
     * device always sends, exactly like aioesphomeapi derives is_closed
     * (position == 0). Undefined until the first state was received.
     */
    public get isClosed(): boolean | undefined {
        const position = this.state.getValue()?.position;
        return position === undefined ? undefined : position === 0;
    }

    /**
     * Whether the cover is fully open. Derived from the position field the
     * device always sends. Undefined until the first state was received; a
     * partially open cover is neither open nor closed.
     */
    public get isOpen(): boolean | undefined {
        const position = this.state.getValue()?.position;
        return position === undefined ? undefined : position === 1;
    }

    /**
     * What the cover is currently doing. Undefined until the first state was
     * received.
     */
    public get operation(): CoverOperation | undefined {
        return this.state.getValue()?.currentOperation;
    }

    private sendCommand(command: { position?: number; tilt?: number; stop?: boolean }): void {
        this.queueCommand(
            MessageTypes.CoverCommandRequest,
            () =>
                CoverCommandRequest.encode({
                    key: this.key,
                    // The legacy command fields are dead: Home Assistant last
                    // sent them to pre-2019 devices and firmware dropped their
                    // handling in 2025.8.0. Only the values below reach the
                    // wire; these two are wire-inert defaults that satisfy
                    // the generated message type.
                    hasLegacyCommand: false,
                    legacyCommand: LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN,
                    hasPosition: command.position !== undefined,
                    position: command.position ?? 0,
                    hasTilt: command.tilt !== undefined,
                    tilt: command.tilt ?? 0,
                    stop: command.stop ?? false,
                }).finish(),
            // Covers without position feedback never confirm a command with a
            // state response, so a serialized command would wait for the 30
            // second pipeline fallback. Like switch commands, cover commands
            // are cheap idempotent intents and go out immediately.
            true,
        );
    }
}
