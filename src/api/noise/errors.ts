/**
 * Errors raised while establishing or using an encrypted ESPHome API session.
 *
 * `EncryptionError` is the common base so callers can treat every encryption
 * problem alike; the individual classes distinguish the terminal failures
 * (bad key, key required but missing, plaintext device) from retryable
 * handshake failures.
 */
export class EncryptionError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'EncryptionError';
    }
}

/** The configured encryption key is not a base64-encoded 32-byte value, or is the reserved all-zero sentinel. */
export class InvalidEncryptionKeyFormatError extends EncryptionError {
    constructor(message = 'encryptionKey must be a base64-encoded 32-byte value') {
        super(message);
        this.name = 'InvalidEncryptionKeyFormatError';
    }
}

/**
 * The device rejected the encryption key. Carries the device identity from the
 * plaintext ServerHello, so a caller can report which device refused the key
 * even though the secure session never came up. The ServerHello is not part of
 * the Noise transcript, so treat name/MAC as reported identification, not
 * verified identity.
 */
export class InvalidEncryptionKeyError extends EncryptionError {
    constructor(
        public readonly serverName?: string,
        public readonly serverMac?: string,
    ) {
        super(
            serverName
                ? `The ESPHome device "${serverName}" rejected the encryption key`
                : 'The ESPHome device rejected the encryption key',
        );
        this.name = 'InvalidEncryptionKeyError';
    }
}

/** The device requires API encryption, but no encryption key was configured. */
export class EncryptionRequiredError extends EncryptionError {
    constructor() {
        super('The ESPHome device requires an encryption key, but none was configured');
        this.name = 'EncryptionRequiredError';
    }
}

/** A plaintext frame arrived while an encryption key was configured. */
export class EncryptionPlaintextError extends EncryptionError {
    constructor() {
        super('The ESPHome device is not using API encryption, but an encryption key was configured');
        this.name = 'EncryptionPlaintextError';
    }
}

/** A retryable Noise handshake failure: malformed frame, unsupported protocol, or bad server hello. */
export class EncryptionHandshakeError extends EncryptionError {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'EncryptionHandshakeError';
    }
}
