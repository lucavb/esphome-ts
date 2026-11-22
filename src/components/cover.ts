import { BaseComponent } from './base';
import { type ComponentType, type CoverEntity } from './entities';
import { type CoverStateEvent } from './states';
import { type CommandInterface } from './commandInterface';
import { MessageTypes } from '../api/requestResponseMatching';
import { CoverCommandRequest, type CoverOperation, LegacyCoverCommand, LegacyCoverState } from '../api/protobuf/api';
import { type Observable } from 'rxjs';

export interface ApiVersion {
    major: number;
    minor: number;
}

const DEFAULT_API_VERSION: ApiVersion = { major: 1, minor: 8 };

export class CoverComponent extends BaseComponent<CoverEntity, CoverStateEvent> {
    constructor(
        listEntity: CoverEntity,
        state: Observable<CoverStateEvent>,
        commandInterface: CommandInterface,
        private readonly apiVersion: ApiVersion = DEFAULT_API_VERSION,
    ) {
        super(listEntity, state, commandInterface);
    }

    public open(): void {
        if (this.usesLegacyProtocol) {
            this.sendCommand({ legacyCommand: LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN });
        } else {
            this.sendCommand({ position: 1 });
        }
    }

    public close(): void {
        if (this.usesLegacyProtocol) {
            this.sendCommand({ legacyCommand: LegacyCoverCommand.LEGACY_COVER_COMMAND_CLOSE });
        } else {
            this.sendCommand({ position: 0 });
        }
    }

    public stop(): void {
        if (!this.supportsStop) {
            return;
        }
        if (this.usesLegacyProtocol) {
            this.sendCommand({ legacyCommand: LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP });
        } else {
            this.sendCommand({ stop: true });
        }
    }

    public setPosition(position: number): void {
        if (this.usesLegacyProtocol || !this.supportsPosition) {
            return;
        }
        this.sendCommand({ position });
    }

    public setTilt(tilt: number): void {
        if (this.usesLegacyProtocol || !this.supportsTilt) {
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
        return this.isApiVersionAtLeast(1, 1) && this.listEntity.supportsPosition;
    }

    public get supportsStop(): boolean {
        return !this.isApiVersionAtLeast(1, 8) || (this.listEntity.supportsStop ?? false);
    }

    public get supportsTilt(): boolean {
        return this.isApiVersionAtLeast(1, 1) && this.listEntity.supportsTilt;
    }

    /**
     * Current position between 0 (closed) and 1 (open). This is feedback from
     * the state response and is independent of position-control support. API
     * versions before 1.1 do not report position values.
     */
    public get position(): number | undefined {
        if (this.usesLegacyProtocol) {
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
     * Whether the cover is fully closed. API versions before 1.1 report this
     * using the legacy state enum; newer versions report the position.
     */
    public get isClosed(): boolean | undefined {
        const state = this.state.getValue();
        if (state === undefined) {
            return undefined;
        }
        if (this.usesLegacyProtocol) {
            return state.legacyState === LegacyCoverState.LEGACY_COVER_STATE_CLOSED;
        }
        const position = state.position;
        return position === undefined ? undefined : position === 0;
    }

    /**
     * Whether the cover is fully open. Uses the legacy state before API 1.1
     * and position thereafter; a partially open cover is neither open nor closed.
     */
    public get isOpen(): boolean | undefined {
        const state = this.state.getValue();
        if (state === undefined) {
            return undefined;
        }
        if (this.usesLegacyProtocol) {
            return state.legacyState === LegacyCoverState.LEGACY_COVER_STATE_OPEN;
        }
        const position = state.position;
        return position === undefined ? undefined : position === 1;
    }

    /**
     * What the cover is currently doing. Undefined until the first state was
     * received.
     */
    public get operation(): CoverOperation | undefined {
        return this.state.getValue()?.currentOperation;
    }

    private get usesLegacyProtocol(): boolean {
        return !this.isApiVersionAtLeast(1, 1);
    }

    private isApiVersionAtLeast(major: number, minor: number): boolean {
        return this.apiVersion.major > major || (this.apiVersion.major === major && this.apiVersion.minor >= minor);
    }

    private sendCommand(command: {
        legacyCommand?: LegacyCoverCommand;
        position?: number;
        tilt?: number;
        stop?: boolean;
    }): void {
        this.queueCommand(
            MessageTypes.CoverCommandRequest,
            () =>
                CoverCommandRequest.encode({
                    key: this.key,
                    // API 1.0 predates position/stop commands; retain the
                    // legacy enum command for those firmware versions.
                    hasLegacyCommand: command.legacyCommand !== undefined,
                    legacyCommand: command.legacyCommand ?? LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN,
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
