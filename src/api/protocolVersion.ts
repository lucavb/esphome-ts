/**
 * The ESPHome native API version, negotiated by the hello handshake.
 *
 * Wire-format differences are keyed on this value: cover position and tilt
 * before 1.1, the three-valued fan speed enum before 1.4, the legacy away flag
 * before 1.5, and advertised cover stop support before 1.8. Components ask for
 * the comparison they need instead of re-implementing it.
 */
export interface ApiVersion {
    readonly major: number;
    readonly minor: number;
}

/** The shape a Hello response carries, so this module stays protobuf-free. */
export interface NegotiatedVersion {
    readonly apiVersionMajor: number;
    readonly apiVersionMinor: number;
}

/**
 * Newest protocol version this client models. It is the constructor default
 * for Components created outside a live handshake; a real handshake always
 * supplies the negotiated value.
 */
export const LATEST_KNOWN_PROTOCOL_VERSION: ApiVersion = Object.freeze({ major: 1, minor: 8 });

/**
 * The single live protocol version of one Device. `EspDevice` owns it and calls
 * {@link ProtocolVersion.updateFrom} after every handshake; Components hold the
 * same instance, so a reconnect is visible to them without re-construction.
 */
export class ProtocolVersion implements ApiVersion {
    public major: number;
    public minor: number;

    constructor(
        major: number = LATEST_KNOWN_PROTOCOL_VERSION.major,
        minor: number = LATEST_KNOWN_PROTOCOL_VERSION.minor,
    ) {
        this.major = major;
        this.minor = minor;
    }

    /** Adopt the version of a freshly completed handshake. */
    public updateFrom(negotiated: NegotiatedVersion): void {
        this.major = negotiated.apiVersionMajor;
        this.minor = negotiated.apiVersionMinor;
    }
}

/** Whether `version` is at or after `threshold`, comparing major then minor. */
export const atLeast = (version: ApiVersion, threshold: ApiVersion): boolean =>
    version.major > threshold.major || (version.major === threshold.major && version.minor >= threshold.minor);
