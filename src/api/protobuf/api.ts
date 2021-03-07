/* eslint-disable */
import { Reader, Writer } from 'protobufjs/minimal';
import { voidMessage } from './api_options';

export const protobufPackage = '';

export enum LegacyCoverState {
    LEGACY_COVER_STATE_OPEN = 0,
    LEGACY_COVER_STATE_CLOSED = 1,
    UNRECOGNIZED = -1,
}

export function legacyCoverStateFromJSON(object: any): LegacyCoverState {
    switch (object) {
        case 0:
        case 'LEGACY_COVER_STATE_OPEN':
            return LegacyCoverState.LEGACY_COVER_STATE_OPEN;
        case 1:
        case 'LEGACY_COVER_STATE_CLOSED':
            return LegacyCoverState.LEGACY_COVER_STATE_CLOSED;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return LegacyCoverState.UNRECOGNIZED;
    }
}

export function legacyCoverStateToJSON(object: LegacyCoverState): string {
    switch (object) {
        case LegacyCoverState.LEGACY_COVER_STATE_OPEN:
            return 'LEGACY_COVER_STATE_OPEN';
        case LegacyCoverState.LEGACY_COVER_STATE_CLOSED:
            return 'LEGACY_COVER_STATE_CLOSED';
        default:
            return 'UNKNOWN';
    }
}

export enum CoverOperation {
    COVER_OPERATION_IDLE = 0,
    COVER_OPERATION_IS_OPENING = 1,
    COVER_OPERATION_IS_CLOSING = 2,
    UNRECOGNIZED = -1,
}

export function coverOperationFromJSON(object: any): CoverOperation {
    switch (object) {
        case 0:
        case 'COVER_OPERATION_IDLE':
            return CoverOperation.COVER_OPERATION_IDLE;
        case 1:
        case 'COVER_OPERATION_IS_OPENING':
            return CoverOperation.COVER_OPERATION_IS_OPENING;
        case 2:
        case 'COVER_OPERATION_IS_CLOSING':
            return CoverOperation.COVER_OPERATION_IS_CLOSING;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return CoverOperation.UNRECOGNIZED;
    }
}

export function coverOperationToJSON(object: CoverOperation): string {
    switch (object) {
        case CoverOperation.COVER_OPERATION_IDLE:
            return 'COVER_OPERATION_IDLE';
        case CoverOperation.COVER_OPERATION_IS_OPENING:
            return 'COVER_OPERATION_IS_OPENING';
        case CoverOperation.COVER_OPERATION_IS_CLOSING:
            return 'COVER_OPERATION_IS_CLOSING';
        default:
            return 'UNKNOWN';
    }
}

export enum LegacyCoverCommand {
    LEGACY_COVER_COMMAND_OPEN = 0,
    LEGACY_COVER_COMMAND_CLOSE = 1,
    LEGACY_COVER_COMMAND_STOP = 2,
    UNRECOGNIZED = -1,
}

export function legacyCoverCommandFromJSON(object: any): LegacyCoverCommand {
    switch (object) {
        case 0:
        case 'LEGACY_COVER_COMMAND_OPEN':
            return LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN;
        case 1:
        case 'LEGACY_COVER_COMMAND_CLOSE':
            return LegacyCoverCommand.LEGACY_COVER_COMMAND_CLOSE;
        case 2:
        case 'LEGACY_COVER_COMMAND_STOP':
            return LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return LegacyCoverCommand.UNRECOGNIZED;
    }
}

export function legacyCoverCommandToJSON(object: LegacyCoverCommand): string {
    switch (object) {
        case LegacyCoverCommand.LEGACY_COVER_COMMAND_OPEN:
            return 'LEGACY_COVER_COMMAND_OPEN';
        case LegacyCoverCommand.LEGACY_COVER_COMMAND_CLOSE:
            return 'LEGACY_COVER_COMMAND_CLOSE';
        case LegacyCoverCommand.LEGACY_COVER_COMMAND_STOP:
            return 'LEGACY_COVER_COMMAND_STOP';
        default:
            return 'UNKNOWN';
    }
}

export enum FanSpeed {
    FAN_SPEED_LOW = 0,
    FAN_SPEED_MEDIUM = 1,
    FAN_SPEED_HIGH = 2,
    UNRECOGNIZED = -1,
}

export function fanSpeedFromJSON(object: any): FanSpeed {
    switch (object) {
        case 0:
        case 'FAN_SPEED_LOW':
            return FanSpeed.FAN_SPEED_LOW;
        case 1:
        case 'FAN_SPEED_MEDIUM':
            return FanSpeed.FAN_SPEED_MEDIUM;
        case 2:
        case 'FAN_SPEED_HIGH':
            return FanSpeed.FAN_SPEED_HIGH;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return FanSpeed.UNRECOGNIZED;
    }
}

export function fanSpeedToJSON(object: FanSpeed): string {
    switch (object) {
        case FanSpeed.FAN_SPEED_LOW:
            return 'FAN_SPEED_LOW';
        case FanSpeed.FAN_SPEED_MEDIUM:
            return 'FAN_SPEED_MEDIUM';
        case FanSpeed.FAN_SPEED_HIGH:
            return 'FAN_SPEED_HIGH';
        default:
            return 'UNKNOWN';
    }
}

export enum FanDirection {
    FAN_DIRECTION_FORWARD = 0,
    FAN_DIRECTION_REVERSE = 1,
    UNRECOGNIZED = -1,
}

export function fanDirectionFromJSON(object: any): FanDirection {
    switch (object) {
        case 0:
        case 'FAN_DIRECTION_FORWARD':
            return FanDirection.FAN_DIRECTION_FORWARD;
        case 1:
        case 'FAN_DIRECTION_REVERSE':
            return FanDirection.FAN_DIRECTION_REVERSE;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return FanDirection.UNRECOGNIZED;
    }
}

export function fanDirectionToJSON(object: FanDirection): string {
    switch (object) {
        case FanDirection.FAN_DIRECTION_FORWARD:
            return 'FAN_DIRECTION_FORWARD';
        case FanDirection.FAN_DIRECTION_REVERSE:
            return 'FAN_DIRECTION_REVERSE';
        default:
            return 'UNKNOWN';
    }
}

/** ==================== SUBSCRIBE LOGS ==================== */
export enum LogLevel {
    LOG_LEVEL_NONE = 0,
    LOG_LEVEL_ERROR = 1,
    LOG_LEVEL_WARN = 2,
    LOG_LEVEL_INFO = 3,
    LOG_LEVEL_DEBUG = 4,
    LOG_LEVEL_VERBOSE = 5,
    LOG_LEVEL_VERY_VERBOSE = 6,
    UNRECOGNIZED = -1,
}

export function logLevelFromJSON(object: any): LogLevel {
    switch (object) {
        case 0:
        case 'LOG_LEVEL_NONE':
            return LogLevel.LOG_LEVEL_NONE;
        case 1:
        case 'LOG_LEVEL_ERROR':
            return LogLevel.LOG_LEVEL_ERROR;
        case 2:
        case 'LOG_LEVEL_WARN':
            return LogLevel.LOG_LEVEL_WARN;
        case 3:
        case 'LOG_LEVEL_INFO':
            return LogLevel.LOG_LEVEL_INFO;
        case 4:
        case 'LOG_LEVEL_DEBUG':
            return LogLevel.LOG_LEVEL_DEBUG;
        case 5:
        case 'LOG_LEVEL_VERBOSE':
            return LogLevel.LOG_LEVEL_VERBOSE;
        case 6:
        case 'LOG_LEVEL_VERY_VERBOSE':
            return LogLevel.LOG_LEVEL_VERY_VERBOSE;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return LogLevel.UNRECOGNIZED;
    }
}

export function logLevelToJSON(object: LogLevel): string {
    switch (object) {
        case LogLevel.LOG_LEVEL_NONE:
            return 'LOG_LEVEL_NONE';
        case LogLevel.LOG_LEVEL_ERROR:
            return 'LOG_LEVEL_ERROR';
        case LogLevel.LOG_LEVEL_WARN:
            return 'LOG_LEVEL_WARN';
        case LogLevel.LOG_LEVEL_INFO:
            return 'LOG_LEVEL_INFO';
        case LogLevel.LOG_LEVEL_DEBUG:
            return 'LOG_LEVEL_DEBUG';
        case LogLevel.LOG_LEVEL_VERBOSE:
            return 'LOG_LEVEL_VERBOSE';
        case LogLevel.LOG_LEVEL_VERY_VERBOSE:
            return 'LOG_LEVEL_VERY_VERBOSE';
        default:
            return 'UNKNOWN';
    }
}

/** ==================== USER-DEFINES SERVICES ==================== */
export enum ServiceArgType {
    SERVICE_ARG_TYPE_BOOL = 0,
    SERVICE_ARG_TYPE_INT = 1,
    SERVICE_ARG_TYPE_FLOAT = 2,
    SERVICE_ARG_TYPE_STRING = 3,
    SERVICE_ARG_TYPE_BOOL_ARRAY = 4,
    SERVICE_ARG_TYPE_INT_ARRAY = 5,
    SERVICE_ARG_TYPE_FLOAT_ARRAY = 6,
    SERVICE_ARG_TYPE_STRING_ARRAY = 7,
    UNRECOGNIZED = -1,
}

export function serviceArgTypeFromJSON(object: any): ServiceArgType {
    switch (object) {
        case 0:
        case 'SERVICE_ARG_TYPE_BOOL':
            return ServiceArgType.SERVICE_ARG_TYPE_BOOL;
        case 1:
        case 'SERVICE_ARG_TYPE_INT':
            return ServiceArgType.SERVICE_ARG_TYPE_INT;
        case 2:
        case 'SERVICE_ARG_TYPE_FLOAT':
            return ServiceArgType.SERVICE_ARG_TYPE_FLOAT;
        case 3:
        case 'SERVICE_ARG_TYPE_STRING':
            return ServiceArgType.SERVICE_ARG_TYPE_STRING;
        case 4:
        case 'SERVICE_ARG_TYPE_BOOL_ARRAY':
            return ServiceArgType.SERVICE_ARG_TYPE_BOOL_ARRAY;
        case 5:
        case 'SERVICE_ARG_TYPE_INT_ARRAY':
            return ServiceArgType.SERVICE_ARG_TYPE_INT_ARRAY;
        case 6:
        case 'SERVICE_ARG_TYPE_FLOAT_ARRAY':
            return ServiceArgType.SERVICE_ARG_TYPE_FLOAT_ARRAY;
        case 7:
        case 'SERVICE_ARG_TYPE_STRING_ARRAY':
            return ServiceArgType.SERVICE_ARG_TYPE_STRING_ARRAY;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return ServiceArgType.UNRECOGNIZED;
    }
}

export function serviceArgTypeToJSON(object: ServiceArgType): string {
    switch (object) {
        case ServiceArgType.SERVICE_ARG_TYPE_BOOL:
            return 'SERVICE_ARG_TYPE_BOOL';
        case ServiceArgType.SERVICE_ARG_TYPE_INT:
            return 'SERVICE_ARG_TYPE_INT';
        case ServiceArgType.SERVICE_ARG_TYPE_FLOAT:
            return 'SERVICE_ARG_TYPE_FLOAT';
        case ServiceArgType.SERVICE_ARG_TYPE_STRING:
            return 'SERVICE_ARG_TYPE_STRING';
        case ServiceArgType.SERVICE_ARG_TYPE_BOOL_ARRAY:
            return 'SERVICE_ARG_TYPE_BOOL_ARRAY';
        case ServiceArgType.SERVICE_ARG_TYPE_INT_ARRAY:
            return 'SERVICE_ARG_TYPE_INT_ARRAY';
        case ServiceArgType.SERVICE_ARG_TYPE_FLOAT_ARRAY:
            return 'SERVICE_ARG_TYPE_FLOAT_ARRAY';
        case ServiceArgType.SERVICE_ARG_TYPE_STRING_ARRAY:
            return 'SERVICE_ARG_TYPE_STRING_ARRAY';
        default:
            return 'UNKNOWN';
    }
}

/** ==================== CLIMATE ==================== */
export enum ClimateMode {
    CLIMATE_MODE_OFF = 0,
    CLIMATE_MODE_AUTO = 1,
    CLIMATE_MODE_COOL = 2,
    CLIMATE_MODE_HEAT = 3,
    CLIMATE_MODE_FAN_ONLY = 4,
    CLIMATE_MODE_DRY = 5,
    UNRECOGNIZED = -1,
}

export function climateModeFromJSON(object: any): ClimateMode {
    switch (object) {
        case 0:
        case 'CLIMATE_MODE_OFF':
            return ClimateMode.CLIMATE_MODE_OFF;
        case 1:
        case 'CLIMATE_MODE_AUTO':
            return ClimateMode.CLIMATE_MODE_AUTO;
        case 2:
        case 'CLIMATE_MODE_COOL':
            return ClimateMode.CLIMATE_MODE_COOL;
        case 3:
        case 'CLIMATE_MODE_HEAT':
            return ClimateMode.CLIMATE_MODE_HEAT;
        case 4:
        case 'CLIMATE_MODE_FAN_ONLY':
            return ClimateMode.CLIMATE_MODE_FAN_ONLY;
        case 5:
        case 'CLIMATE_MODE_DRY':
            return ClimateMode.CLIMATE_MODE_DRY;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return ClimateMode.UNRECOGNIZED;
    }
}

export function climateModeToJSON(object: ClimateMode): string {
    switch (object) {
        case ClimateMode.CLIMATE_MODE_OFF:
            return 'CLIMATE_MODE_OFF';
        case ClimateMode.CLIMATE_MODE_AUTO:
            return 'CLIMATE_MODE_AUTO';
        case ClimateMode.CLIMATE_MODE_COOL:
            return 'CLIMATE_MODE_COOL';
        case ClimateMode.CLIMATE_MODE_HEAT:
            return 'CLIMATE_MODE_HEAT';
        case ClimateMode.CLIMATE_MODE_FAN_ONLY:
            return 'CLIMATE_MODE_FAN_ONLY';
        case ClimateMode.CLIMATE_MODE_DRY:
            return 'CLIMATE_MODE_DRY';
        default:
            return 'UNKNOWN';
    }
}

export enum ClimateFanMode {
    CLIMATE_FAN_ON = 0,
    CLIMATE_FAN_OFF = 1,
    CLIMATE_FAN_AUTO = 2,
    CLIMATE_FAN_LOW = 3,
    CLIMATE_FAN_MEDIUM = 4,
    CLIMATE_FAN_HIGH = 5,
    CLIMATE_FAN_MIDDLE = 6,
    CLIMATE_FAN_FOCUS = 7,
    CLIMATE_FAN_DIFFUSE = 8,
    UNRECOGNIZED = -1,
}

export function climateFanModeFromJSON(object: any): ClimateFanMode {
    switch (object) {
        case 0:
        case 'CLIMATE_FAN_ON':
            return ClimateFanMode.CLIMATE_FAN_ON;
        case 1:
        case 'CLIMATE_FAN_OFF':
            return ClimateFanMode.CLIMATE_FAN_OFF;
        case 2:
        case 'CLIMATE_FAN_AUTO':
            return ClimateFanMode.CLIMATE_FAN_AUTO;
        case 3:
        case 'CLIMATE_FAN_LOW':
            return ClimateFanMode.CLIMATE_FAN_LOW;
        case 4:
        case 'CLIMATE_FAN_MEDIUM':
            return ClimateFanMode.CLIMATE_FAN_MEDIUM;
        case 5:
        case 'CLIMATE_FAN_HIGH':
            return ClimateFanMode.CLIMATE_FAN_HIGH;
        case 6:
        case 'CLIMATE_FAN_MIDDLE':
            return ClimateFanMode.CLIMATE_FAN_MIDDLE;
        case 7:
        case 'CLIMATE_FAN_FOCUS':
            return ClimateFanMode.CLIMATE_FAN_FOCUS;
        case 8:
        case 'CLIMATE_FAN_DIFFUSE':
            return ClimateFanMode.CLIMATE_FAN_DIFFUSE;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return ClimateFanMode.UNRECOGNIZED;
    }
}

export function climateFanModeToJSON(object: ClimateFanMode): string {
    switch (object) {
        case ClimateFanMode.CLIMATE_FAN_ON:
            return 'CLIMATE_FAN_ON';
        case ClimateFanMode.CLIMATE_FAN_OFF:
            return 'CLIMATE_FAN_OFF';
        case ClimateFanMode.CLIMATE_FAN_AUTO:
            return 'CLIMATE_FAN_AUTO';
        case ClimateFanMode.CLIMATE_FAN_LOW:
            return 'CLIMATE_FAN_LOW';
        case ClimateFanMode.CLIMATE_FAN_MEDIUM:
            return 'CLIMATE_FAN_MEDIUM';
        case ClimateFanMode.CLIMATE_FAN_HIGH:
            return 'CLIMATE_FAN_HIGH';
        case ClimateFanMode.CLIMATE_FAN_MIDDLE:
            return 'CLIMATE_FAN_MIDDLE';
        case ClimateFanMode.CLIMATE_FAN_FOCUS:
            return 'CLIMATE_FAN_FOCUS';
        case ClimateFanMode.CLIMATE_FAN_DIFFUSE:
            return 'CLIMATE_FAN_DIFFUSE';
        default:
            return 'UNKNOWN';
    }
}

export enum ClimateSwingMode {
    CLIMATE_SWING_OFF = 0,
    CLIMATE_SWING_BOTH = 1,
    CLIMATE_SWING_VERTICAL = 2,
    CLIMATE_SWING_HORIZONTAL = 3,
    UNRECOGNIZED = -1,
}

export function climateSwingModeFromJSON(object: any): ClimateSwingMode {
    switch (object) {
        case 0:
        case 'CLIMATE_SWING_OFF':
            return ClimateSwingMode.CLIMATE_SWING_OFF;
        case 1:
        case 'CLIMATE_SWING_BOTH':
            return ClimateSwingMode.CLIMATE_SWING_BOTH;
        case 2:
        case 'CLIMATE_SWING_VERTICAL':
            return ClimateSwingMode.CLIMATE_SWING_VERTICAL;
        case 3:
        case 'CLIMATE_SWING_HORIZONTAL':
            return ClimateSwingMode.CLIMATE_SWING_HORIZONTAL;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return ClimateSwingMode.UNRECOGNIZED;
    }
}

export function climateSwingModeToJSON(object: ClimateSwingMode): string {
    switch (object) {
        case ClimateSwingMode.CLIMATE_SWING_OFF:
            return 'CLIMATE_SWING_OFF';
        case ClimateSwingMode.CLIMATE_SWING_BOTH:
            return 'CLIMATE_SWING_BOTH';
        case ClimateSwingMode.CLIMATE_SWING_VERTICAL:
            return 'CLIMATE_SWING_VERTICAL';
        case ClimateSwingMode.CLIMATE_SWING_HORIZONTAL:
            return 'CLIMATE_SWING_HORIZONTAL';
        default:
            return 'UNKNOWN';
    }
}

export enum ClimateAction {
    CLIMATE_ACTION_OFF = 0,
    /** CLIMATE_ACTION_COOLING - values same as mode for readability */
    CLIMATE_ACTION_COOLING = 2,
    CLIMATE_ACTION_HEATING = 3,
    CLIMATE_ACTION_IDLE = 4,
    CLIMATE_ACTION_DRYING = 5,
    CLIMATE_ACTION_FAN = 6,
    UNRECOGNIZED = -1,
}

export function climateActionFromJSON(object: any): ClimateAction {
    switch (object) {
        case 0:
        case 'CLIMATE_ACTION_OFF':
            return ClimateAction.CLIMATE_ACTION_OFF;
        case 2:
        case 'CLIMATE_ACTION_COOLING':
            return ClimateAction.CLIMATE_ACTION_COOLING;
        case 3:
        case 'CLIMATE_ACTION_HEATING':
            return ClimateAction.CLIMATE_ACTION_HEATING;
        case 4:
        case 'CLIMATE_ACTION_IDLE':
            return ClimateAction.CLIMATE_ACTION_IDLE;
        case 5:
        case 'CLIMATE_ACTION_DRYING':
            return ClimateAction.CLIMATE_ACTION_DRYING;
        case 6:
        case 'CLIMATE_ACTION_FAN':
            return ClimateAction.CLIMATE_ACTION_FAN;
        case -1:
        case 'UNRECOGNIZED':
        default:
            return ClimateAction.UNRECOGNIZED;
    }
}

export function climateActionToJSON(object: ClimateAction): string {
    switch (object) {
        case ClimateAction.CLIMATE_ACTION_OFF:
            return 'CLIMATE_ACTION_OFF';
        case ClimateAction.CLIMATE_ACTION_COOLING:
            return 'CLIMATE_ACTION_COOLING';
        case ClimateAction.CLIMATE_ACTION_HEATING:
            return 'CLIMATE_ACTION_HEATING';
        case ClimateAction.CLIMATE_ACTION_IDLE:
            return 'CLIMATE_ACTION_IDLE';
        case ClimateAction.CLIMATE_ACTION_DRYING:
            return 'CLIMATE_ACTION_DRYING';
        case ClimateAction.CLIMATE_ACTION_FAN:
            return 'CLIMATE_ACTION_FAN';
        default:
            return 'UNKNOWN';
    }
}

/**
 * Message sent at the beginning of each connection
 * Can only be sent by the client and only at the beginning of the connection
 */
export interface HelloRequest {
    /**
     * Description of client (like User Agent)
     * For example "Home Assistant"
     * Not strictly necessary to send but nice for debugging
     * purposes.
     */
    clientInfo: string;
}

/**
 * Confirmation of successful connection request.
 * Can only be sent by the server and only at the beginning of the connection
 */
export interface HelloResponse {
    /**
     * The version of the API to use. The _client_ (for example Home Assistant) needs to check
     * for compatibility and if necessary adopt to an older API.
     * Major is for breaking changes in the base protocol - a mismatch will lead to immediate disconnect_client_
     * Minor is for breaking changes in individual messages - a mismatch will lead to a warning message
     */
    apiVersionMajor: number;
    apiVersionMinor: number;
    /**
     * A string identifying the server (ESP); like client info this may be empty
     * and only exists for debugging/logging purposes.
     * For example "ESPHome v1.10.0 on ESP8266"
     */
    serverInfo: string;
}

/**
 * Message sent at the beginning of each connection to authenticate the client
 * Can only be sent by the client and only at the beginning of the connection
 */
export interface ConnectRequest {
    /** The password to log in with */
    password: string;
}

/**
 * Confirmation of successful connection. After this the connection is available for all traffic.
 * Can only be sent by the server and only at the beginning of the connection
 */
export interface ConnectResponse {
    invalidPassword: boolean;
}

/**
 * Request to close the connection.
 * Can be sent by both the client and server
 */
export interface DisconnectRequest {}

export interface DisconnectResponse {}

export interface PingRequest {}

export interface PingResponse {}

export interface DeviceInfoRequest {}

export interface DeviceInfoResponse {
    usesPassword: boolean;
    /** The name of the node, given by "App.set_name()" */
    name: string;
    /** The mac address of the device. For example "AC:BC:32:89:0E:A9" */
    macAddress: string;
    /** A string describing the ESPHome version. For example "1.10.0" */
    esphomeVersion: string;
    /**
     * A string describing the date of compilation, this is generated by the compiler
     * and therefore may not be in the same format all the time.
     * If the user isn't using ESPHome, this will also not be set.
     */
    compilationTime: string;
    /** The model of the board. For example NodeMCU */
    model: string;
    hasDeepSleep: boolean;
}

export interface ListEntitiesRequest {}

export interface ListEntitiesDoneResponse {}

export interface SubscribeStatesRequest {}

/** ==================== BINARY SENSOR ==================== */
export interface ListEntitiesBinarySensorResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    deviceClass: string;
    isStatusBinarySensor: boolean;
}

export interface BinarySensorStateResponse {
    key: number;
    state: boolean;
    /**
     * If the binary sensor does not have a valid state yet.
     * Equivalent to `!obj->has_state()` - inverse logic to make state packets smaller
     */
    missingState: boolean;
}

/** ==================== COVER ==================== */
export interface ListEntitiesCoverResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    assumedState: boolean;
    supportsPosition: boolean;
    supportsTilt: boolean;
    deviceClass: string;
}

export interface CoverStateResponse {
    key: number;
    /**
     * legacy: state has been removed in 1.13
     * clients/servers must still send/accept it until the next protocol change
     */
    legacyState: LegacyCoverState;
    position: number;
    tilt: number;
    currentOperation: CoverOperation;
}

export interface CoverCommandRequest {
    key: number;
    /**
     * legacy: command has been removed in 1.13
     * clients/servers must still send/accept it until the next protocol change
     */
    hasLegacyCommand: boolean;
    legacyCommand: LegacyCoverCommand;
    hasPosition: boolean;
    position: number;
    hasTilt: boolean;
    tilt: number;
    stop: boolean;
}

/** ==================== FAN ==================== */
export interface ListEntitiesFanResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    supportsOscillation: boolean;
    supportsSpeed: boolean;
    supportsDirection: boolean;
}

export interface FanStateResponse {
    key: number;
    state: boolean;
    oscillating: boolean;
    speed: FanSpeed;
    direction: FanDirection;
}

export interface FanCommandRequest {
    key: number;
    hasState: boolean;
    state: boolean;
    hasSpeed: boolean;
    speed: FanSpeed;
    hasOscillating: boolean;
    oscillating: boolean;
    hasDirection: boolean;
    direction: FanDirection;
}

/** ==================== LIGHT ==================== */
export interface ListEntitiesLightResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    supportsBrightness: boolean;
    supportsRgb: boolean;
    supportsWhiteValue: boolean;
    supportsColorTemperature: boolean;
    minMireds: number;
    maxMireds: number;
    effects: string[];
}

export interface LightStateResponse {
    key: number;
    state: boolean;
    brightness: number;
    red: number;
    green: number;
    blue: number;
    white: number;
    colorTemperature: number;
    effect: string;
}

export interface LightCommandRequest {
    key: number;
    hasState: boolean;
    state: boolean;
    hasBrightness: boolean;
    brightness: number;
    hasRgb: boolean;
    red: number;
    green: number;
    blue: number;
    hasWhite: boolean;
    white: number;
    hasColorTemperature: boolean;
    colorTemperature: number;
    hasTransitionLength: boolean;
    transitionLength: number;
    hasFlashLength: boolean;
    flashLength: number;
    hasEffect: boolean;
    effect: string;
}

/** ==================== SENSOR ==================== */
export interface ListEntitiesSensorResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    icon: string;
    unitOfMeasurement: string;
    accuracyDecimals: number;
    forceUpdate: boolean;
    deviceClass: string;
}

export interface SensorStateResponse {
    key: number;
    state: number;
    /**
     * If the sensor does not have a valid state yet.
     * Equivalent to `!obj->has_state()` - inverse logic to make state packets smaller
     */
    missingState: boolean;
}

/** ==================== SWITCH ==================== */
export interface ListEntitiesSwitchResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    icon: string;
    assumedState: boolean;
}

export interface SwitchStateResponse {
    key: number;
    state: boolean;
}

export interface SwitchCommandRequest {
    key: number;
    state: boolean;
}

/** ==================== TEXT SENSOR ==================== */
export interface ListEntitiesTextSensorResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    icon: string;
}

export interface TextSensorStateResponse {
    key: number;
    state: string;
    /**
     * If the text sensor does not have a valid state yet.
     * Equivalent to `!obj->has_state()` - inverse logic to make state packets smaller
     */
    missingState: boolean;
}

export interface SubscribeLogsRequest {
    level: LogLevel;
    dumpConfig: boolean;
}

export interface SubscribeLogsResponse {
    level: LogLevel;
    tag: string;
    message: string;
    sendFailed: boolean;
}

/** ==================== HOMEASSISTANT.SERVICE ==================== */
export interface SubscribeHomeassistantServicesRequest {}

export interface HomeassistantServiceMap {
    key: string;
    value: string;
}

export interface HomeassistantServiceResponse {
    service: string;
    data: HomeassistantServiceMap[];
    dataTemplate: HomeassistantServiceMap[];
    variables: HomeassistantServiceMap[];
    isEvent: boolean;
}

/**
 * ==================== IMPORT HOME ASSISTANT STATES ====================
 * 1. Client sends SubscribeHomeAssistantStatesRequest
 * 2. Server responds with zero or more SubscribeHomeAssistantStateResponse (async)
 * 3. Client sends HomeAssistantStateResponse for state changes.
 */
export interface SubscribeHomeAssistantStatesRequest {}

export interface SubscribeHomeAssistantStateResponse {
    entityId: string;
}

export interface HomeAssistantStateResponse {
    entityId: string;
    state: string;
}

/** ==================== IMPORT TIME ==================== */
export interface GetTimeRequest {}

export interface GetTimeResponse {
    epochSeconds: number;
}

export interface ListEntitiesServicesArgument {
    name: string;
    type: ServiceArgType;
}

export interface ListEntitiesServicesResponse {
    name: string;
    key: number;
    args: ListEntitiesServicesArgument[];
}

export interface ExecuteServiceArgument {
    bool_: boolean;
    legacyInt: number;
    float_: number;
    string_: string;
    /** ESPHome 1.14 (api v1.3) make int a signed value */
    int_: number;
    boolArray: boolean[];
    intArray: number[];
    floatArray: number[];
    stringArray: string[];
}

export interface ExecuteServiceRequest {
    key: number;
    args: ExecuteServiceArgument[];
}

/** ==================== CAMERA ==================== */
export interface ListEntitiesCameraResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
}

export interface CameraImageResponse {
    key: number;
    data: Uint8Array;
    done: boolean;
}

export interface CameraImageRequest {
    single: boolean;
    stream: boolean;
}

export interface ListEntitiesClimateResponse {
    objectId: string;
    key: number;
    name: string;
    uniqueId: string;
    supportsCurrentTemperature: boolean;
    supportsTwoPointTargetTemperature: boolean;
    supportedModes: ClimateMode[];
    visualMinTemperature: number;
    visualMaxTemperature: number;
    visualTemperatureStep: number;
    supportsAway: boolean;
    supportsAction: boolean;
    supportedFanModes: ClimateFanMode[];
    supportedSwingModes: ClimateSwingMode[];
}

export interface ClimateStateResponse {
    key: number;
    mode: ClimateMode;
    currentTemperature: number;
    targetTemperature: number;
    targetTemperatureLow: number;
    targetTemperatureHigh: number;
    away: boolean;
    action: ClimateAction;
    fanMode: ClimateFanMode;
    swingMode: ClimateSwingMode;
}

export interface ClimateCommandRequest {
    key: number;
    hasMode: boolean;
    mode: ClimateMode;
    hasTargetTemperature: boolean;
    targetTemperature: number;
    hasTargetTemperatureLow: boolean;
    targetTemperatureLow: number;
    hasTargetTemperatureHigh: boolean;
    targetTemperatureHigh: number;
    hasAway: boolean;
    away: boolean;
    hasFanMode: boolean;
    fanMode: ClimateFanMode;
    hasSwingMode: boolean;
    swingMode: ClimateSwingMode;
}

const baseHelloRequest: object = { clientInfo: '' };

export const HelloRequest = {
    encode(message: HelloRequest, writer: Writer = Writer.create()): Writer {
        if (message.clientInfo !== '') {
            writer.uint32(10).string(message.clientInfo);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): HelloRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseHelloRequest } as HelloRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.clientInfo = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): HelloRequest {
        const message = { ...baseHelloRequest } as HelloRequest;
        if (object.clientInfo !== undefined && object.clientInfo !== null) {
            message.clientInfo = String(object.clientInfo);
        } else {
            message.clientInfo = '';
        }
        return message;
    },

    toJSON(message: HelloRequest): unknown {
        const obj: any = {};
        message.clientInfo !== undefined && (obj.clientInfo = message.clientInfo);
        return obj;
    },

    fromPartial(object: DeepPartial<HelloRequest>): HelloRequest {
        const message = { ...baseHelloRequest } as HelloRequest;
        if (object.clientInfo !== undefined && object.clientInfo !== null) {
            message.clientInfo = object.clientInfo;
        } else {
            message.clientInfo = '';
        }
        return message;
    },
};

const baseHelloResponse: object = { apiVersionMajor: 0, apiVersionMinor: 0, serverInfo: '' };

export const HelloResponse = {
    encode(message: HelloResponse, writer: Writer = Writer.create()): Writer {
        if (message.apiVersionMajor !== 0) {
            writer.uint32(8).uint32(message.apiVersionMajor);
        }
        if (message.apiVersionMinor !== 0) {
            writer.uint32(16).uint32(message.apiVersionMinor);
        }
        if (message.serverInfo !== '') {
            writer.uint32(26).string(message.serverInfo);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): HelloResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseHelloResponse } as HelloResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.apiVersionMajor = reader.uint32();
                    break;
                case 2:
                    message.apiVersionMinor = reader.uint32();
                    break;
                case 3:
                    message.serverInfo = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): HelloResponse {
        const message = { ...baseHelloResponse } as HelloResponse;
        if (object.apiVersionMajor !== undefined && object.apiVersionMajor !== null) {
            message.apiVersionMajor = Number(object.apiVersionMajor);
        } else {
            message.apiVersionMajor = 0;
        }
        if (object.apiVersionMinor !== undefined && object.apiVersionMinor !== null) {
            message.apiVersionMinor = Number(object.apiVersionMinor);
        } else {
            message.apiVersionMinor = 0;
        }
        if (object.serverInfo !== undefined && object.serverInfo !== null) {
            message.serverInfo = String(object.serverInfo);
        } else {
            message.serverInfo = '';
        }
        return message;
    },

    toJSON(message: HelloResponse): unknown {
        const obj: any = {};
        message.apiVersionMajor !== undefined && (obj.apiVersionMajor = message.apiVersionMajor);
        message.apiVersionMinor !== undefined && (obj.apiVersionMinor = message.apiVersionMinor);
        message.serverInfo !== undefined && (obj.serverInfo = message.serverInfo);
        return obj;
    },

    fromPartial(object: DeepPartial<HelloResponse>): HelloResponse {
        const message = { ...baseHelloResponse } as HelloResponse;
        if (object.apiVersionMajor !== undefined && object.apiVersionMajor !== null) {
            message.apiVersionMajor = object.apiVersionMajor;
        } else {
            message.apiVersionMajor = 0;
        }
        if (object.apiVersionMinor !== undefined && object.apiVersionMinor !== null) {
            message.apiVersionMinor = object.apiVersionMinor;
        } else {
            message.apiVersionMinor = 0;
        }
        if (object.serverInfo !== undefined && object.serverInfo !== null) {
            message.serverInfo = object.serverInfo;
        } else {
            message.serverInfo = '';
        }
        return message;
    },
};

const baseConnectRequest: object = { password: '' };

export const ConnectRequest = {
    encode(message: ConnectRequest, writer: Writer = Writer.create()): Writer {
        if (message.password !== '') {
            writer.uint32(10).string(message.password);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ConnectRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseConnectRequest } as ConnectRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.password = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ConnectRequest {
        const message = { ...baseConnectRequest } as ConnectRequest;
        if (object.password !== undefined && object.password !== null) {
            message.password = String(object.password);
        } else {
            message.password = '';
        }
        return message;
    },

    toJSON(message: ConnectRequest): unknown {
        const obj: any = {};
        message.password !== undefined && (obj.password = message.password);
        return obj;
    },

    fromPartial(object: DeepPartial<ConnectRequest>): ConnectRequest {
        const message = { ...baseConnectRequest } as ConnectRequest;
        if (object.password !== undefined && object.password !== null) {
            message.password = object.password;
        } else {
            message.password = '';
        }
        return message;
    },
};

const baseConnectResponse: object = { invalidPassword: false };

export const ConnectResponse = {
    encode(message: ConnectResponse, writer: Writer = Writer.create()): Writer {
        if (message.invalidPassword === true) {
            writer.uint32(8).bool(message.invalidPassword);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ConnectResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseConnectResponse } as ConnectResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.invalidPassword = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ConnectResponse {
        const message = { ...baseConnectResponse } as ConnectResponse;
        if (object.invalidPassword !== undefined && object.invalidPassword !== null) {
            message.invalidPassword = Boolean(object.invalidPassword);
        } else {
            message.invalidPassword = false;
        }
        return message;
    },

    toJSON(message: ConnectResponse): unknown {
        const obj: any = {};
        message.invalidPassword !== undefined && (obj.invalidPassword = message.invalidPassword);
        return obj;
    },

    fromPartial(object: DeepPartial<ConnectResponse>): ConnectResponse {
        const message = { ...baseConnectResponse } as ConnectResponse;
        if (object.invalidPassword !== undefined && object.invalidPassword !== null) {
            message.invalidPassword = object.invalidPassword;
        } else {
            message.invalidPassword = false;
        }
        return message;
    },
};

const baseDisconnectRequest: object = {};

export const DisconnectRequest = {
    encode(_: DisconnectRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): DisconnectRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseDisconnectRequest } as DisconnectRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): DisconnectRequest {
        const message = { ...baseDisconnectRequest } as DisconnectRequest;
        return message;
    },

    toJSON(_: DisconnectRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<DisconnectRequest>): DisconnectRequest {
        const message = { ...baseDisconnectRequest } as DisconnectRequest;
        return message;
    },
};

const baseDisconnectResponse: object = {};

export const DisconnectResponse = {
    encode(_: DisconnectResponse, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): DisconnectResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseDisconnectResponse } as DisconnectResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): DisconnectResponse {
        const message = { ...baseDisconnectResponse } as DisconnectResponse;
        return message;
    },

    toJSON(_: DisconnectResponse): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<DisconnectResponse>): DisconnectResponse {
        const message = { ...baseDisconnectResponse } as DisconnectResponse;
        return message;
    },
};

const basePingRequest: object = {};

export const PingRequest = {
    encode(_: PingRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): PingRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...basePingRequest } as PingRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): PingRequest {
        const message = { ...basePingRequest } as PingRequest;
        return message;
    },

    toJSON(_: PingRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<PingRequest>): PingRequest {
        const message = { ...basePingRequest } as PingRequest;
        return message;
    },
};

const basePingResponse: object = {};

export const PingResponse = {
    encode(_: PingResponse, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): PingResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...basePingResponse } as PingResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): PingResponse {
        const message = { ...basePingResponse } as PingResponse;
        return message;
    },

    toJSON(_: PingResponse): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<PingResponse>): PingResponse {
        const message = { ...basePingResponse } as PingResponse;
        return message;
    },
};

const baseDeviceInfoRequest: object = {};

export const DeviceInfoRequest = {
    encode(_: DeviceInfoRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): DeviceInfoRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseDeviceInfoRequest } as DeviceInfoRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): DeviceInfoRequest {
        const message = { ...baseDeviceInfoRequest } as DeviceInfoRequest;
        return message;
    },

    toJSON(_: DeviceInfoRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<DeviceInfoRequest>): DeviceInfoRequest {
        const message = { ...baseDeviceInfoRequest } as DeviceInfoRequest;
        return message;
    },
};

const baseDeviceInfoResponse: object = {
    usesPassword: false,
    name: '',
    macAddress: '',
    esphomeVersion: '',
    compilationTime: '',
    model: '',
    hasDeepSleep: false,
};

export const DeviceInfoResponse = {
    encode(message: DeviceInfoResponse, writer: Writer = Writer.create()): Writer {
        if (message.usesPassword === true) {
            writer.uint32(8).bool(message.usesPassword);
        }
        if (message.name !== '') {
            writer.uint32(18).string(message.name);
        }
        if (message.macAddress !== '') {
            writer.uint32(26).string(message.macAddress);
        }
        if (message.esphomeVersion !== '') {
            writer.uint32(34).string(message.esphomeVersion);
        }
        if (message.compilationTime !== '') {
            writer.uint32(42).string(message.compilationTime);
        }
        if (message.model !== '') {
            writer.uint32(50).string(message.model);
        }
        if (message.hasDeepSleep === true) {
            writer.uint32(56).bool(message.hasDeepSleep);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): DeviceInfoResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseDeviceInfoResponse } as DeviceInfoResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.usesPassword = reader.bool();
                    break;
                case 2:
                    message.name = reader.string();
                    break;
                case 3:
                    message.macAddress = reader.string();
                    break;
                case 4:
                    message.esphomeVersion = reader.string();
                    break;
                case 5:
                    message.compilationTime = reader.string();
                    break;
                case 6:
                    message.model = reader.string();
                    break;
                case 7:
                    message.hasDeepSleep = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): DeviceInfoResponse {
        const message = { ...baseDeviceInfoResponse } as DeviceInfoResponse;
        if (object.usesPassword !== undefined && object.usesPassword !== null) {
            message.usesPassword = Boolean(object.usesPassword);
        } else {
            message.usesPassword = false;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.macAddress !== undefined && object.macAddress !== null) {
            message.macAddress = String(object.macAddress);
        } else {
            message.macAddress = '';
        }
        if (object.esphomeVersion !== undefined && object.esphomeVersion !== null) {
            message.esphomeVersion = String(object.esphomeVersion);
        } else {
            message.esphomeVersion = '';
        }
        if (object.compilationTime !== undefined && object.compilationTime !== null) {
            message.compilationTime = String(object.compilationTime);
        } else {
            message.compilationTime = '';
        }
        if (object.model !== undefined && object.model !== null) {
            message.model = String(object.model);
        } else {
            message.model = '';
        }
        if (object.hasDeepSleep !== undefined && object.hasDeepSleep !== null) {
            message.hasDeepSleep = Boolean(object.hasDeepSleep);
        } else {
            message.hasDeepSleep = false;
        }
        return message;
    },

    toJSON(message: DeviceInfoResponse): unknown {
        const obj: any = {};
        message.usesPassword !== undefined && (obj.usesPassword = message.usesPassword);
        message.name !== undefined && (obj.name = message.name);
        message.macAddress !== undefined && (obj.macAddress = message.macAddress);
        message.esphomeVersion !== undefined && (obj.esphomeVersion = message.esphomeVersion);
        message.compilationTime !== undefined && (obj.compilationTime = message.compilationTime);
        message.model !== undefined && (obj.model = message.model);
        message.hasDeepSleep !== undefined && (obj.hasDeepSleep = message.hasDeepSleep);
        return obj;
    },

    fromPartial(object: DeepPartial<DeviceInfoResponse>): DeviceInfoResponse {
        const message = { ...baseDeviceInfoResponse } as DeviceInfoResponse;
        if (object.usesPassword !== undefined && object.usesPassword !== null) {
            message.usesPassword = object.usesPassword;
        } else {
            message.usesPassword = false;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.macAddress !== undefined && object.macAddress !== null) {
            message.macAddress = object.macAddress;
        } else {
            message.macAddress = '';
        }
        if (object.esphomeVersion !== undefined && object.esphomeVersion !== null) {
            message.esphomeVersion = object.esphomeVersion;
        } else {
            message.esphomeVersion = '';
        }
        if (object.compilationTime !== undefined && object.compilationTime !== null) {
            message.compilationTime = object.compilationTime;
        } else {
            message.compilationTime = '';
        }
        if (object.model !== undefined && object.model !== null) {
            message.model = object.model;
        } else {
            message.model = '';
        }
        if (object.hasDeepSleep !== undefined && object.hasDeepSleep !== null) {
            message.hasDeepSleep = object.hasDeepSleep;
        } else {
            message.hasDeepSleep = false;
        }
        return message;
    },
};

const baseListEntitiesRequest: object = {};

export const ListEntitiesRequest = {
    encode(_: ListEntitiesRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesRequest } as ListEntitiesRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): ListEntitiesRequest {
        const message = { ...baseListEntitiesRequest } as ListEntitiesRequest;
        return message;
    },

    toJSON(_: ListEntitiesRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<ListEntitiesRequest>): ListEntitiesRequest {
        const message = { ...baseListEntitiesRequest } as ListEntitiesRequest;
        return message;
    },
};

const baseListEntitiesDoneResponse: object = {};

export const ListEntitiesDoneResponse = {
    encode(_: ListEntitiesDoneResponse, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesDoneResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesDoneResponse } as ListEntitiesDoneResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): ListEntitiesDoneResponse {
        const message = { ...baseListEntitiesDoneResponse } as ListEntitiesDoneResponse;
        return message;
    },

    toJSON(_: ListEntitiesDoneResponse): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<ListEntitiesDoneResponse>): ListEntitiesDoneResponse {
        const message = { ...baseListEntitiesDoneResponse } as ListEntitiesDoneResponse;
        return message;
    },
};

const baseSubscribeStatesRequest: object = {};

export const SubscribeStatesRequest = {
    encode(_: SubscribeStatesRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SubscribeStatesRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSubscribeStatesRequest } as SubscribeStatesRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): SubscribeStatesRequest {
        const message = { ...baseSubscribeStatesRequest } as SubscribeStatesRequest;
        return message;
    },

    toJSON(_: SubscribeStatesRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<SubscribeStatesRequest>): SubscribeStatesRequest {
        const message = { ...baseSubscribeStatesRequest } as SubscribeStatesRequest;
        return message;
    },
};

const baseListEntitiesBinarySensorResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    deviceClass: '',
    isStatusBinarySensor: false,
};

export const ListEntitiesBinarySensorResponse = {
    encode(message: ListEntitiesBinarySensorResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.deviceClass !== '') {
            writer.uint32(42).string(message.deviceClass);
        }
        if (message.isStatusBinarySensor === true) {
            writer.uint32(48).bool(message.isStatusBinarySensor);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesBinarySensorResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesBinarySensorResponse } as ListEntitiesBinarySensorResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.deviceClass = reader.string();
                    break;
                case 6:
                    message.isStatusBinarySensor = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesBinarySensorResponse {
        const message = { ...baseListEntitiesBinarySensorResponse } as ListEntitiesBinarySensorResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.deviceClass !== undefined && object.deviceClass !== null) {
            message.deviceClass = String(object.deviceClass);
        } else {
            message.deviceClass = '';
        }
        if (object.isStatusBinarySensor !== undefined && object.isStatusBinarySensor !== null) {
            message.isStatusBinarySensor = Boolean(object.isStatusBinarySensor);
        } else {
            message.isStatusBinarySensor = false;
        }
        return message;
    },

    toJSON(message: ListEntitiesBinarySensorResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.deviceClass !== undefined && (obj.deviceClass = message.deviceClass);
        message.isStatusBinarySensor !== undefined && (obj.isStatusBinarySensor = message.isStatusBinarySensor);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesBinarySensorResponse>): ListEntitiesBinarySensorResponse {
        const message = { ...baseListEntitiesBinarySensorResponse } as ListEntitiesBinarySensorResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.deviceClass !== undefined && object.deviceClass !== null) {
            message.deviceClass = object.deviceClass;
        } else {
            message.deviceClass = '';
        }
        if (object.isStatusBinarySensor !== undefined && object.isStatusBinarySensor !== null) {
            message.isStatusBinarySensor = object.isStatusBinarySensor;
        } else {
            message.isStatusBinarySensor = false;
        }
        return message;
    },
};

const baseBinarySensorStateResponse: object = { key: 0, state: false, missingState: false };

export const BinarySensorStateResponse = {
    encode(message: BinarySensorStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state === true) {
            writer.uint32(16).bool(message.state);
        }
        if (message.missingState === true) {
            writer.uint32(24).bool(message.missingState);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): BinarySensorStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseBinarySensorStateResponse } as BinarySensorStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.bool();
                    break;
                case 3:
                    message.missingState = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): BinarySensorStateResponse {
        const message = { ...baseBinarySensorStateResponse } as BinarySensorStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        if (object.missingState !== undefined && object.missingState !== null) {
            message.missingState = Boolean(object.missingState);
        } else {
            message.missingState = false;
        }
        return message;
    },

    toJSON(message: BinarySensorStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        message.missingState !== undefined && (obj.missingState = message.missingState);
        return obj;
    },

    fromPartial(object: DeepPartial<BinarySensorStateResponse>): BinarySensorStateResponse {
        const message = { ...baseBinarySensorStateResponse } as BinarySensorStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        if (object.missingState !== undefined && object.missingState !== null) {
            message.missingState = object.missingState;
        } else {
            message.missingState = false;
        }
        return message;
    },
};

const baseListEntitiesCoverResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    assumedState: false,
    supportsPosition: false,
    supportsTilt: false,
    deviceClass: '',
};

export const ListEntitiesCoverResponse = {
    encode(message: ListEntitiesCoverResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.assumedState === true) {
            writer.uint32(40).bool(message.assumedState);
        }
        if (message.supportsPosition === true) {
            writer.uint32(48).bool(message.supportsPosition);
        }
        if (message.supportsTilt === true) {
            writer.uint32(56).bool(message.supportsTilt);
        }
        if (message.deviceClass !== '') {
            writer.uint32(66).string(message.deviceClass);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesCoverResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesCoverResponse } as ListEntitiesCoverResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.assumedState = reader.bool();
                    break;
                case 6:
                    message.supportsPosition = reader.bool();
                    break;
                case 7:
                    message.supportsTilt = reader.bool();
                    break;
                case 8:
                    message.deviceClass = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesCoverResponse {
        const message = { ...baseListEntitiesCoverResponse } as ListEntitiesCoverResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.assumedState !== undefined && object.assumedState !== null) {
            message.assumedState = Boolean(object.assumedState);
        } else {
            message.assumedState = false;
        }
        if (object.supportsPosition !== undefined && object.supportsPosition !== null) {
            message.supportsPosition = Boolean(object.supportsPosition);
        } else {
            message.supportsPosition = false;
        }
        if (object.supportsTilt !== undefined && object.supportsTilt !== null) {
            message.supportsTilt = Boolean(object.supportsTilt);
        } else {
            message.supportsTilt = false;
        }
        if (object.deviceClass !== undefined && object.deviceClass !== null) {
            message.deviceClass = String(object.deviceClass);
        } else {
            message.deviceClass = '';
        }
        return message;
    },

    toJSON(message: ListEntitiesCoverResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.assumedState !== undefined && (obj.assumedState = message.assumedState);
        message.supportsPosition !== undefined && (obj.supportsPosition = message.supportsPosition);
        message.supportsTilt !== undefined && (obj.supportsTilt = message.supportsTilt);
        message.deviceClass !== undefined && (obj.deviceClass = message.deviceClass);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesCoverResponse>): ListEntitiesCoverResponse {
        const message = { ...baseListEntitiesCoverResponse } as ListEntitiesCoverResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.assumedState !== undefined && object.assumedState !== null) {
            message.assumedState = object.assumedState;
        } else {
            message.assumedState = false;
        }
        if (object.supportsPosition !== undefined && object.supportsPosition !== null) {
            message.supportsPosition = object.supportsPosition;
        } else {
            message.supportsPosition = false;
        }
        if (object.supportsTilt !== undefined && object.supportsTilt !== null) {
            message.supportsTilt = object.supportsTilt;
        } else {
            message.supportsTilt = false;
        }
        if (object.deviceClass !== undefined && object.deviceClass !== null) {
            message.deviceClass = object.deviceClass;
        } else {
            message.deviceClass = '';
        }
        return message;
    },
};

const baseCoverStateResponse: object = { key: 0, legacyState: 0, position: 0, tilt: 0, currentOperation: 0 };

export const CoverStateResponse = {
    encode(message: CoverStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.legacyState !== 0) {
            writer.uint32(16).int32(message.legacyState);
        }
        if (message.position !== 0) {
            writer.uint32(29).float(message.position);
        }
        if (message.tilt !== 0) {
            writer.uint32(37).float(message.tilt);
        }
        if (message.currentOperation !== 0) {
            writer.uint32(40).int32(message.currentOperation);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): CoverStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseCoverStateResponse } as CoverStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.legacyState = reader.int32() as any;
                    break;
                case 3:
                    message.position = reader.float();
                    break;
                case 4:
                    message.tilt = reader.float();
                    break;
                case 5:
                    message.currentOperation = reader.int32() as any;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): CoverStateResponse {
        const message = { ...baseCoverStateResponse } as CoverStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.legacyState !== undefined && object.legacyState !== null) {
            message.legacyState = legacyCoverStateFromJSON(object.legacyState);
        } else {
            message.legacyState = 0;
        }
        if (object.position !== undefined && object.position !== null) {
            message.position = Number(object.position);
        } else {
            message.position = 0;
        }
        if (object.tilt !== undefined && object.tilt !== null) {
            message.tilt = Number(object.tilt);
        } else {
            message.tilt = 0;
        }
        if (object.currentOperation !== undefined && object.currentOperation !== null) {
            message.currentOperation = coverOperationFromJSON(object.currentOperation);
        } else {
            message.currentOperation = 0;
        }
        return message;
    },

    toJSON(message: CoverStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.legacyState !== undefined && (obj.legacyState = legacyCoverStateToJSON(message.legacyState));
        message.position !== undefined && (obj.position = message.position);
        message.tilt !== undefined && (obj.tilt = message.tilt);
        message.currentOperation !== undefined &&
            (obj.currentOperation = coverOperationToJSON(message.currentOperation));
        return obj;
    },

    fromPartial(object: DeepPartial<CoverStateResponse>): CoverStateResponse {
        const message = { ...baseCoverStateResponse } as CoverStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.legacyState !== undefined && object.legacyState !== null) {
            message.legacyState = object.legacyState;
        } else {
            message.legacyState = 0;
        }
        if (object.position !== undefined && object.position !== null) {
            message.position = object.position;
        } else {
            message.position = 0;
        }
        if (object.tilt !== undefined && object.tilt !== null) {
            message.tilt = object.tilt;
        } else {
            message.tilt = 0;
        }
        if (object.currentOperation !== undefined && object.currentOperation !== null) {
            message.currentOperation = object.currentOperation;
        } else {
            message.currentOperation = 0;
        }
        return message;
    },
};

const baseCoverCommandRequest: object = {
    key: 0,
    hasLegacyCommand: false,
    legacyCommand: 0,
    hasPosition: false,
    position: 0,
    hasTilt: false,
    tilt: 0,
    stop: false,
};

export const CoverCommandRequest = {
    encode(message: CoverCommandRequest, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.hasLegacyCommand === true) {
            writer.uint32(16).bool(message.hasLegacyCommand);
        }
        if (message.legacyCommand !== 0) {
            writer.uint32(24).int32(message.legacyCommand);
        }
        if (message.hasPosition === true) {
            writer.uint32(32).bool(message.hasPosition);
        }
        if (message.position !== 0) {
            writer.uint32(45).float(message.position);
        }
        if (message.hasTilt === true) {
            writer.uint32(48).bool(message.hasTilt);
        }
        if (message.tilt !== 0) {
            writer.uint32(61).float(message.tilt);
        }
        if (message.stop === true) {
            writer.uint32(64).bool(message.stop);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): CoverCommandRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseCoverCommandRequest } as CoverCommandRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.hasLegacyCommand = reader.bool();
                    break;
                case 3:
                    message.legacyCommand = reader.int32() as any;
                    break;
                case 4:
                    message.hasPosition = reader.bool();
                    break;
                case 5:
                    message.position = reader.float();
                    break;
                case 6:
                    message.hasTilt = reader.bool();
                    break;
                case 7:
                    message.tilt = reader.float();
                    break;
                case 8:
                    message.stop = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): CoverCommandRequest {
        const message = { ...baseCoverCommandRequest } as CoverCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.hasLegacyCommand !== undefined && object.hasLegacyCommand !== null) {
            message.hasLegacyCommand = Boolean(object.hasLegacyCommand);
        } else {
            message.hasLegacyCommand = false;
        }
        if (object.legacyCommand !== undefined && object.legacyCommand !== null) {
            message.legacyCommand = legacyCoverCommandFromJSON(object.legacyCommand);
        } else {
            message.legacyCommand = 0;
        }
        if (object.hasPosition !== undefined && object.hasPosition !== null) {
            message.hasPosition = Boolean(object.hasPosition);
        } else {
            message.hasPosition = false;
        }
        if (object.position !== undefined && object.position !== null) {
            message.position = Number(object.position);
        } else {
            message.position = 0;
        }
        if (object.hasTilt !== undefined && object.hasTilt !== null) {
            message.hasTilt = Boolean(object.hasTilt);
        } else {
            message.hasTilt = false;
        }
        if (object.tilt !== undefined && object.tilt !== null) {
            message.tilt = Number(object.tilt);
        } else {
            message.tilt = 0;
        }
        if (object.stop !== undefined && object.stop !== null) {
            message.stop = Boolean(object.stop);
        } else {
            message.stop = false;
        }
        return message;
    },

    toJSON(message: CoverCommandRequest): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.hasLegacyCommand !== undefined && (obj.hasLegacyCommand = message.hasLegacyCommand);
        message.legacyCommand !== undefined && (obj.legacyCommand = legacyCoverCommandToJSON(message.legacyCommand));
        message.hasPosition !== undefined && (obj.hasPosition = message.hasPosition);
        message.position !== undefined && (obj.position = message.position);
        message.hasTilt !== undefined && (obj.hasTilt = message.hasTilt);
        message.tilt !== undefined && (obj.tilt = message.tilt);
        message.stop !== undefined && (obj.stop = message.stop);
        return obj;
    },

    fromPartial(object: DeepPartial<CoverCommandRequest>): CoverCommandRequest {
        const message = { ...baseCoverCommandRequest } as CoverCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.hasLegacyCommand !== undefined && object.hasLegacyCommand !== null) {
            message.hasLegacyCommand = object.hasLegacyCommand;
        } else {
            message.hasLegacyCommand = false;
        }
        if (object.legacyCommand !== undefined && object.legacyCommand !== null) {
            message.legacyCommand = object.legacyCommand;
        } else {
            message.legacyCommand = 0;
        }
        if (object.hasPosition !== undefined && object.hasPosition !== null) {
            message.hasPosition = object.hasPosition;
        } else {
            message.hasPosition = false;
        }
        if (object.position !== undefined && object.position !== null) {
            message.position = object.position;
        } else {
            message.position = 0;
        }
        if (object.hasTilt !== undefined && object.hasTilt !== null) {
            message.hasTilt = object.hasTilt;
        } else {
            message.hasTilt = false;
        }
        if (object.tilt !== undefined && object.tilt !== null) {
            message.tilt = object.tilt;
        } else {
            message.tilt = 0;
        }
        if (object.stop !== undefined && object.stop !== null) {
            message.stop = object.stop;
        } else {
            message.stop = false;
        }
        return message;
    },
};

const baseListEntitiesFanResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    supportsOscillation: false,
    supportsSpeed: false,
    supportsDirection: false,
};

export const ListEntitiesFanResponse = {
    encode(message: ListEntitiesFanResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.supportsOscillation === true) {
            writer.uint32(40).bool(message.supportsOscillation);
        }
        if (message.supportsSpeed === true) {
            writer.uint32(48).bool(message.supportsSpeed);
        }
        if (message.supportsDirection === true) {
            writer.uint32(56).bool(message.supportsDirection);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesFanResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesFanResponse } as ListEntitiesFanResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.supportsOscillation = reader.bool();
                    break;
                case 6:
                    message.supportsSpeed = reader.bool();
                    break;
                case 7:
                    message.supportsDirection = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesFanResponse {
        const message = { ...baseListEntitiesFanResponse } as ListEntitiesFanResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.supportsOscillation !== undefined && object.supportsOscillation !== null) {
            message.supportsOscillation = Boolean(object.supportsOscillation);
        } else {
            message.supportsOscillation = false;
        }
        if (object.supportsSpeed !== undefined && object.supportsSpeed !== null) {
            message.supportsSpeed = Boolean(object.supportsSpeed);
        } else {
            message.supportsSpeed = false;
        }
        if (object.supportsDirection !== undefined && object.supportsDirection !== null) {
            message.supportsDirection = Boolean(object.supportsDirection);
        } else {
            message.supportsDirection = false;
        }
        return message;
    },

    toJSON(message: ListEntitiesFanResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.supportsOscillation !== undefined && (obj.supportsOscillation = message.supportsOscillation);
        message.supportsSpeed !== undefined && (obj.supportsSpeed = message.supportsSpeed);
        message.supportsDirection !== undefined && (obj.supportsDirection = message.supportsDirection);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesFanResponse>): ListEntitiesFanResponse {
        const message = { ...baseListEntitiesFanResponse } as ListEntitiesFanResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.supportsOscillation !== undefined && object.supportsOscillation !== null) {
            message.supportsOscillation = object.supportsOscillation;
        } else {
            message.supportsOscillation = false;
        }
        if (object.supportsSpeed !== undefined && object.supportsSpeed !== null) {
            message.supportsSpeed = object.supportsSpeed;
        } else {
            message.supportsSpeed = false;
        }
        if (object.supportsDirection !== undefined && object.supportsDirection !== null) {
            message.supportsDirection = object.supportsDirection;
        } else {
            message.supportsDirection = false;
        }
        return message;
    },
};

const baseFanStateResponse: object = { key: 0, state: false, oscillating: false, speed: 0, direction: 0 };

export const FanStateResponse = {
    encode(message: FanStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state === true) {
            writer.uint32(16).bool(message.state);
        }
        if (message.oscillating === true) {
            writer.uint32(24).bool(message.oscillating);
        }
        if (message.speed !== 0) {
            writer.uint32(32).int32(message.speed);
        }
        if (message.direction !== 0) {
            writer.uint32(40).int32(message.direction);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): FanStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseFanStateResponse } as FanStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.bool();
                    break;
                case 3:
                    message.oscillating = reader.bool();
                    break;
                case 4:
                    message.speed = reader.int32() as any;
                    break;
                case 5:
                    message.direction = reader.int32() as any;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): FanStateResponse {
        const message = { ...baseFanStateResponse } as FanStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        if (object.oscillating !== undefined && object.oscillating !== null) {
            message.oscillating = Boolean(object.oscillating);
        } else {
            message.oscillating = false;
        }
        if (object.speed !== undefined && object.speed !== null) {
            message.speed = fanSpeedFromJSON(object.speed);
        } else {
            message.speed = 0;
        }
        if (object.direction !== undefined && object.direction !== null) {
            message.direction = fanDirectionFromJSON(object.direction);
        } else {
            message.direction = 0;
        }
        return message;
    },

    toJSON(message: FanStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        message.oscillating !== undefined && (obj.oscillating = message.oscillating);
        message.speed !== undefined && (obj.speed = fanSpeedToJSON(message.speed));
        message.direction !== undefined && (obj.direction = fanDirectionToJSON(message.direction));
        return obj;
    },

    fromPartial(object: DeepPartial<FanStateResponse>): FanStateResponse {
        const message = { ...baseFanStateResponse } as FanStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        if (object.oscillating !== undefined && object.oscillating !== null) {
            message.oscillating = object.oscillating;
        } else {
            message.oscillating = false;
        }
        if (object.speed !== undefined && object.speed !== null) {
            message.speed = object.speed;
        } else {
            message.speed = 0;
        }
        if (object.direction !== undefined && object.direction !== null) {
            message.direction = object.direction;
        } else {
            message.direction = 0;
        }
        return message;
    },
};

const baseFanCommandRequest: object = {
    key: 0,
    hasState: false,
    state: false,
    hasSpeed: false,
    speed: 0,
    hasOscillating: false,
    oscillating: false,
    hasDirection: false,
    direction: 0,
};

export const FanCommandRequest = {
    encode(message: FanCommandRequest, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.hasState === true) {
            writer.uint32(16).bool(message.hasState);
        }
        if (message.state === true) {
            writer.uint32(24).bool(message.state);
        }
        if (message.hasSpeed === true) {
            writer.uint32(32).bool(message.hasSpeed);
        }
        if (message.speed !== 0) {
            writer.uint32(40).int32(message.speed);
        }
        if (message.hasOscillating === true) {
            writer.uint32(48).bool(message.hasOscillating);
        }
        if (message.oscillating === true) {
            writer.uint32(56).bool(message.oscillating);
        }
        if (message.hasDirection === true) {
            writer.uint32(64).bool(message.hasDirection);
        }
        if (message.direction !== 0) {
            writer.uint32(72).int32(message.direction);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): FanCommandRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseFanCommandRequest } as FanCommandRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.hasState = reader.bool();
                    break;
                case 3:
                    message.state = reader.bool();
                    break;
                case 4:
                    message.hasSpeed = reader.bool();
                    break;
                case 5:
                    message.speed = reader.int32() as any;
                    break;
                case 6:
                    message.hasOscillating = reader.bool();
                    break;
                case 7:
                    message.oscillating = reader.bool();
                    break;
                case 8:
                    message.hasDirection = reader.bool();
                    break;
                case 9:
                    message.direction = reader.int32() as any;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): FanCommandRequest {
        const message = { ...baseFanCommandRequest } as FanCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.hasState !== undefined && object.hasState !== null) {
            message.hasState = Boolean(object.hasState);
        } else {
            message.hasState = false;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        if (object.hasSpeed !== undefined && object.hasSpeed !== null) {
            message.hasSpeed = Boolean(object.hasSpeed);
        } else {
            message.hasSpeed = false;
        }
        if (object.speed !== undefined && object.speed !== null) {
            message.speed = fanSpeedFromJSON(object.speed);
        } else {
            message.speed = 0;
        }
        if (object.hasOscillating !== undefined && object.hasOscillating !== null) {
            message.hasOscillating = Boolean(object.hasOscillating);
        } else {
            message.hasOscillating = false;
        }
        if (object.oscillating !== undefined && object.oscillating !== null) {
            message.oscillating = Boolean(object.oscillating);
        } else {
            message.oscillating = false;
        }
        if (object.hasDirection !== undefined && object.hasDirection !== null) {
            message.hasDirection = Boolean(object.hasDirection);
        } else {
            message.hasDirection = false;
        }
        if (object.direction !== undefined && object.direction !== null) {
            message.direction = fanDirectionFromJSON(object.direction);
        } else {
            message.direction = 0;
        }
        return message;
    },

    toJSON(message: FanCommandRequest): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.hasState !== undefined && (obj.hasState = message.hasState);
        message.state !== undefined && (obj.state = message.state);
        message.hasSpeed !== undefined && (obj.hasSpeed = message.hasSpeed);
        message.speed !== undefined && (obj.speed = fanSpeedToJSON(message.speed));
        message.hasOscillating !== undefined && (obj.hasOscillating = message.hasOscillating);
        message.oscillating !== undefined && (obj.oscillating = message.oscillating);
        message.hasDirection !== undefined && (obj.hasDirection = message.hasDirection);
        message.direction !== undefined && (obj.direction = fanDirectionToJSON(message.direction));
        return obj;
    },

    fromPartial(object: DeepPartial<FanCommandRequest>): FanCommandRequest {
        const message = { ...baseFanCommandRequest } as FanCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.hasState !== undefined && object.hasState !== null) {
            message.hasState = object.hasState;
        } else {
            message.hasState = false;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        if (object.hasSpeed !== undefined && object.hasSpeed !== null) {
            message.hasSpeed = object.hasSpeed;
        } else {
            message.hasSpeed = false;
        }
        if (object.speed !== undefined && object.speed !== null) {
            message.speed = object.speed;
        } else {
            message.speed = 0;
        }
        if (object.hasOscillating !== undefined && object.hasOscillating !== null) {
            message.hasOscillating = object.hasOscillating;
        } else {
            message.hasOscillating = false;
        }
        if (object.oscillating !== undefined && object.oscillating !== null) {
            message.oscillating = object.oscillating;
        } else {
            message.oscillating = false;
        }
        if (object.hasDirection !== undefined && object.hasDirection !== null) {
            message.hasDirection = object.hasDirection;
        } else {
            message.hasDirection = false;
        }
        if (object.direction !== undefined && object.direction !== null) {
            message.direction = object.direction;
        } else {
            message.direction = 0;
        }
        return message;
    },
};

const baseListEntitiesLightResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    supportsBrightness: false,
    supportsRgb: false,
    supportsWhiteValue: false,
    supportsColorTemperature: false,
    minMireds: 0,
    maxMireds: 0,
    effects: '',
};

export const ListEntitiesLightResponse = {
    encode(message: ListEntitiesLightResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.supportsBrightness === true) {
            writer.uint32(40).bool(message.supportsBrightness);
        }
        if (message.supportsRgb === true) {
            writer.uint32(48).bool(message.supportsRgb);
        }
        if (message.supportsWhiteValue === true) {
            writer.uint32(56).bool(message.supportsWhiteValue);
        }
        if (message.supportsColorTemperature === true) {
            writer.uint32(64).bool(message.supportsColorTemperature);
        }
        if (message.minMireds !== 0) {
            writer.uint32(77).float(message.minMireds);
        }
        if (message.maxMireds !== 0) {
            writer.uint32(85).float(message.maxMireds);
        }
        for (const v of message.effects) {
            writer.uint32(90).string(v!);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesLightResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesLightResponse } as ListEntitiesLightResponse;
        message.effects = [];
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.supportsBrightness = reader.bool();
                    break;
                case 6:
                    message.supportsRgb = reader.bool();
                    break;
                case 7:
                    message.supportsWhiteValue = reader.bool();
                    break;
                case 8:
                    message.supportsColorTemperature = reader.bool();
                    break;
                case 9:
                    message.minMireds = reader.float();
                    break;
                case 10:
                    message.maxMireds = reader.float();
                    break;
                case 11:
                    message.effects.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesLightResponse {
        const message = { ...baseListEntitiesLightResponse } as ListEntitiesLightResponse;
        message.effects = [];
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.supportsBrightness !== undefined && object.supportsBrightness !== null) {
            message.supportsBrightness = Boolean(object.supportsBrightness);
        } else {
            message.supportsBrightness = false;
        }
        if (object.supportsRgb !== undefined && object.supportsRgb !== null) {
            message.supportsRgb = Boolean(object.supportsRgb);
        } else {
            message.supportsRgb = false;
        }
        if (object.supportsWhiteValue !== undefined && object.supportsWhiteValue !== null) {
            message.supportsWhiteValue = Boolean(object.supportsWhiteValue);
        } else {
            message.supportsWhiteValue = false;
        }
        if (object.supportsColorTemperature !== undefined && object.supportsColorTemperature !== null) {
            message.supportsColorTemperature = Boolean(object.supportsColorTemperature);
        } else {
            message.supportsColorTemperature = false;
        }
        if (object.minMireds !== undefined && object.minMireds !== null) {
            message.minMireds = Number(object.minMireds);
        } else {
            message.minMireds = 0;
        }
        if (object.maxMireds !== undefined && object.maxMireds !== null) {
            message.maxMireds = Number(object.maxMireds);
        } else {
            message.maxMireds = 0;
        }
        if (object.effects !== undefined && object.effects !== null) {
            for (const e of object.effects) {
                message.effects.push(String(e));
            }
        }
        return message;
    },

    toJSON(message: ListEntitiesLightResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.supportsBrightness !== undefined && (obj.supportsBrightness = message.supportsBrightness);
        message.supportsRgb !== undefined && (obj.supportsRgb = message.supportsRgb);
        message.supportsWhiteValue !== undefined && (obj.supportsWhiteValue = message.supportsWhiteValue);
        message.supportsColorTemperature !== undefined &&
            (obj.supportsColorTemperature = message.supportsColorTemperature);
        message.minMireds !== undefined && (obj.minMireds = message.minMireds);
        message.maxMireds !== undefined && (obj.maxMireds = message.maxMireds);
        if (message.effects) {
            obj.effects = message.effects.map((e) => e);
        } else {
            obj.effects = [];
        }
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesLightResponse>): ListEntitiesLightResponse {
        const message = { ...baseListEntitiesLightResponse } as ListEntitiesLightResponse;
        message.effects = [];
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.supportsBrightness !== undefined && object.supportsBrightness !== null) {
            message.supportsBrightness = object.supportsBrightness;
        } else {
            message.supportsBrightness = false;
        }
        if (object.supportsRgb !== undefined && object.supportsRgb !== null) {
            message.supportsRgb = object.supportsRgb;
        } else {
            message.supportsRgb = false;
        }
        if (object.supportsWhiteValue !== undefined && object.supportsWhiteValue !== null) {
            message.supportsWhiteValue = object.supportsWhiteValue;
        } else {
            message.supportsWhiteValue = false;
        }
        if (object.supportsColorTemperature !== undefined && object.supportsColorTemperature !== null) {
            message.supportsColorTemperature = object.supportsColorTemperature;
        } else {
            message.supportsColorTemperature = false;
        }
        if (object.minMireds !== undefined && object.minMireds !== null) {
            message.minMireds = object.minMireds;
        } else {
            message.minMireds = 0;
        }
        if (object.maxMireds !== undefined && object.maxMireds !== null) {
            message.maxMireds = object.maxMireds;
        } else {
            message.maxMireds = 0;
        }
        if (object.effects !== undefined && object.effects !== null) {
            for (const e of object.effects) {
                message.effects.push(e);
            }
        }
        return message;
    },
};

const baseLightStateResponse: object = {
    key: 0,
    state: false,
    brightness: 0,
    red: 0,
    green: 0,
    blue: 0,
    white: 0,
    colorTemperature: 0,
    effect: '',
};

export const LightStateResponse = {
    encode(message: LightStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state === true) {
            writer.uint32(16).bool(message.state);
        }
        if (message.brightness !== 0) {
            writer.uint32(29).float(message.brightness);
        }
        if (message.red !== 0) {
            writer.uint32(37).float(message.red);
        }
        if (message.green !== 0) {
            writer.uint32(45).float(message.green);
        }
        if (message.blue !== 0) {
            writer.uint32(53).float(message.blue);
        }
        if (message.white !== 0) {
            writer.uint32(61).float(message.white);
        }
        if (message.colorTemperature !== 0) {
            writer.uint32(69).float(message.colorTemperature);
        }
        if (message.effect !== '') {
            writer.uint32(74).string(message.effect);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): LightStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseLightStateResponse } as LightStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.bool();
                    break;
                case 3:
                    message.brightness = reader.float();
                    break;
                case 4:
                    message.red = reader.float();
                    break;
                case 5:
                    message.green = reader.float();
                    break;
                case 6:
                    message.blue = reader.float();
                    break;
                case 7:
                    message.white = reader.float();
                    break;
                case 8:
                    message.colorTemperature = reader.float();
                    break;
                case 9:
                    message.effect = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): LightStateResponse {
        const message = { ...baseLightStateResponse } as LightStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        if (object.brightness !== undefined && object.brightness !== null) {
            message.brightness = Number(object.brightness);
        } else {
            message.brightness = 0;
        }
        if (object.red !== undefined && object.red !== null) {
            message.red = Number(object.red);
        } else {
            message.red = 0;
        }
        if (object.green !== undefined && object.green !== null) {
            message.green = Number(object.green);
        } else {
            message.green = 0;
        }
        if (object.blue !== undefined && object.blue !== null) {
            message.blue = Number(object.blue);
        } else {
            message.blue = 0;
        }
        if (object.white !== undefined && object.white !== null) {
            message.white = Number(object.white);
        } else {
            message.white = 0;
        }
        if (object.colorTemperature !== undefined && object.colorTemperature !== null) {
            message.colorTemperature = Number(object.colorTemperature);
        } else {
            message.colorTemperature = 0;
        }
        if (object.effect !== undefined && object.effect !== null) {
            message.effect = String(object.effect);
        } else {
            message.effect = '';
        }
        return message;
    },

    toJSON(message: LightStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        message.brightness !== undefined && (obj.brightness = message.brightness);
        message.red !== undefined && (obj.red = message.red);
        message.green !== undefined && (obj.green = message.green);
        message.blue !== undefined && (obj.blue = message.blue);
        message.white !== undefined && (obj.white = message.white);
        message.colorTemperature !== undefined && (obj.colorTemperature = message.colorTemperature);
        message.effect !== undefined && (obj.effect = message.effect);
        return obj;
    },

    fromPartial(object: DeepPartial<LightStateResponse>): LightStateResponse {
        const message = { ...baseLightStateResponse } as LightStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        if (object.brightness !== undefined && object.brightness !== null) {
            message.brightness = object.brightness;
        } else {
            message.brightness = 0;
        }
        if (object.red !== undefined && object.red !== null) {
            message.red = object.red;
        } else {
            message.red = 0;
        }
        if (object.green !== undefined && object.green !== null) {
            message.green = object.green;
        } else {
            message.green = 0;
        }
        if (object.blue !== undefined && object.blue !== null) {
            message.blue = object.blue;
        } else {
            message.blue = 0;
        }
        if (object.white !== undefined && object.white !== null) {
            message.white = object.white;
        } else {
            message.white = 0;
        }
        if (object.colorTemperature !== undefined && object.colorTemperature !== null) {
            message.colorTemperature = object.colorTemperature;
        } else {
            message.colorTemperature = 0;
        }
        if (object.effect !== undefined && object.effect !== null) {
            message.effect = object.effect;
        } else {
            message.effect = '';
        }
        return message;
    },
};

const baseLightCommandRequest: object = {
    key: 0,
    hasState: false,
    state: false,
    hasBrightness: false,
    brightness: 0,
    hasRgb: false,
    red: 0,
    green: 0,
    blue: 0,
    hasWhite: false,
    white: 0,
    hasColorTemperature: false,
    colorTemperature: 0,
    hasTransitionLength: false,
    transitionLength: 0,
    hasFlashLength: false,
    flashLength: 0,
    hasEffect: false,
    effect: '',
};

export const LightCommandRequest = {
    encode(message: LightCommandRequest, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.hasState === true) {
            writer.uint32(16).bool(message.hasState);
        }
        if (message.state === true) {
            writer.uint32(24).bool(message.state);
        }
        if (message.hasBrightness === true) {
            writer.uint32(32).bool(message.hasBrightness);
        }
        if (message.brightness !== 0) {
            writer.uint32(45).float(message.brightness);
        }
        if (message.hasRgb === true) {
            writer.uint32(48).bool(message.hasRgb);
        }
        if (message.red !== 0) {
            writer.uint32(61).float(message.red);
        }
        if (message.green !== 0) {
            writer.uint32(69).float(message.green);
        }
        if (message.blue !== 0) {
            writer.uint32(77).float(message.blue);
        }
        if (message.hasWhite === true) {
            writer.uint32(80).bool(message.hasWhite);
        }
        if (message.white !== 0) {
            writer.uint32(93).float(message.white);
        }
        if (message.hasColorTemperature === true) {
            writer.uint32(96).bool(message.hasColorTemperature);
        }
        if (message.colorTemperature !== 0) {
            writer.uint32(109).float(message.colorTemperature);
        }
        if (message.hasTransitionLength === true) {
            writer.uint32(112).bool(message.hasTransitionLength);
        }
        if (message.transitionLength !== 0) {
            writer.uint32(120).uint32(message.transitionLength);
        }
        if (message.hasFlashLength === true) {
            writer.uint32(128).bool(message.hasFlashLength);
        }
        if (message.flashLength !== 0) {
            writer.uint32(136).uint32(message.flashLength);
        }
        if (message.hasEffect === true) {
            writer.uint32(144).bool(message.hasEffect);
        }
        if (message.effect !== '') {
            writer.uint32(154).string(message.effect);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): LightCommandRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseLightCommandRequest } as LightCommandRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.hasState = reader.bool();
                    break;
                case 3:
                    message.state = reader.bool();
                    break;
                case 4:
                    message.hasBrightness = reader.bool();
                    break;
                case 5:
                    message.brightness = reader.float();
                    break;
                case 6:
                    message.hasRgb = reader.bool();
                    break;
                case 7:
                    message.red = reader.float();
                    break;
                case 8:
                    message.green = reader.float();
                    break;
                case 9:
                    message.blue = reader.float();
                    break;
                case 10:
                    message.hasWhite = reader.bool();
                    break;
                case 11:
                    message.white = reader.float();
                    break;
                case 12:
                    message.hasColorTemperature = reader.bool();
                    break;
                case 13:
                    message.colorTemperature = reader.float();
                    break;
                case 14:
                    message.hasTransitionLength = reader.bool();
                    break;
                case 15:
                    message.transitionLength = reader.uint32();
                    break;
                case 16:
                    message.hasFlashLength = reader.bool();
                    break;
                case 17:
                    message.flashLength = reader.uint32();
                    break;
                case 18:
                    message.hasEffect = reader.bool();
                    break;
                case 19:
                    message.effect = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): LightCommandRequest {
        const message = { ...baseLightCommandRequest } as LightCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.hasState !== undefined && object.hasState !== null) {
            message.hasState = Boolean(object.hasState);
        } else {
            message.hasState = false;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        if (object.hasBrightness !== undefined && object.hasBrightness !== null) {
            message.hasBrightness = Boolean(object.hasBrightness);
        } else {
            message.hasBrightness = false;
        }
        if (object.brightness !== undefined && object.brightness !== null) {
            message.brightness = Number(object.brightness);
        } else {
            message.brightness = 0;
        }
        if (object.hasRgb !== undefined && object.hasRgb !== null) {
            message.hasRgb = Boolean(object.hasRgb);
        } else {
            message.hasRgb = false;
        }
        if (object.red !== undefined && object.red !== null) {
            message.red = Number(object.red);
        } else {
            message.red = 0;
        }
        if (object.green !== undefined && object.green !== null) {
            message.green = Number(object.green);
        } else {
            message.green = 0;
        }
        if (object.blue !== undefined && object.blue !== null) {
            message.blue = Number(object.blue);
        } else {
            message.blue = 0;
        }
        if (object.hasWhite !== undefined && object.hasWhite !== null) {
            message.hasWhite = Boolean(object.hasWhite);
        } else {
            message.hasWhite = false;
        }
        if (object.white !== undefined && object.white !== null) {
            message.white = Number(object.white);
        } else {
            message.white = 0;
        }
        if (object.hasColorTemperature !== undefined && object.hasColorTemperature !== null) {
            message.hasColorTemperature = Boolean(object.hasColorTemperature);
        } else {
            message.hasColorTemperature = false;
        }
        if (object.colorTemperature !== undefined && object.colorTemperature !== null) {
            message.colorTemperature = Number(object.colorTemperature);
        } else {
            message.colorTemperature = 0;
        }
        if (object.hasTransitionLength !== undefined && object.hasTransitionLength !== null) {
            message.hasTransitionLength = Boolean(object.hasTransitionLength);
        } else {
            message.hasTransitionLength = false;
        }
        if (object.transitionLength !== undefined && object.transitionLength !== null) {
            message.transitionLength = Number(object.transitionLength);
        } else {
            message.transitionLength = 0;
        }
        if (object.hasFlashLength !== undefined && object.hasFlashLength !== null) {
            message.hasFlashLength = Boolean(object.hasFlashLength);
        } else {
            message.hasFlashLength = false;
        }
        if (object.flashLength !== undefined && object.flashLength !== null) {
            message.flashLength = Number(object.flashLength);
        } else {
            message.flashLength = 0;
        }
        if (object.hasEffect !== undefined && object.hasEffect !== null) {
            message.hasEffect = Boolean(object.hasEffect);
        } else {
            message.hasEffect = false;
        }
        if (object.effect !== undefined && object.effect !== null) {
            message.effect = String(object.effect);
        } else {
            message.effect = '';
        }
        return message;
    },

    toJSON(message: LightCommandRequest): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.hasState !== undefined && (obj.hasState = message.hasState);
        message.state !== undefined && (obj.state = message.state);
        message.hasBrightness !== undefined && (obj.hasBrightness = message.hasBrightness);
        message.brightness !== undefined && (obj.brightness = message.brightness);
        message.hasRgb !== undefined && (obj.hasRgb = message.hasRgb);
        message.red !== undefined && (obj.red = message.red);
        message.green !== undefined && (obj.green = message.green);
        message.blue !== undefined && (obj.blue = message.blue);
        message.hasWhite !== undefined && (obj.hasWhite = message.hasWhite);
        message.white !== undefined && (obj.white = message.white);
        message.hasColorTemperature !== undefined && (obj.hasColorTemperature = message.hasColorTemperature);
        message.colorTemperature !== undefined && (obj.colorTemperature = message.colorTemperature);
        message.hasTransitionLength !== undefined && (obj.hasTransitionLength = message.hasTransitionLength);
        message.transitionLength !== undefined && (obj.transitionLength = message.transitionLength);
        message.hasFlashLength !== undefined && (obj.hasFlashLength = message.hasFlashLength);
        message.flashLength !== undefined && (obj.flashLength = message.flashLength);
        message.hasEffect !== undefined && (obj.hasEffect = message.hasEffect);
        message.effect !== undefined && (obj.effect = message.effect);
        return obj;
    },

    fromPartial(object: DeepPartial<LightCommandRequest>): LightCommandRequest {
        const message = { ...baseLightCommandRequest } as LightCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.hasState !== undefined && object.hasState !== null) {
            message.hasState = object.hasState;
        } else {
            message.hasState = false;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        if (object.hasBrightness !== undefined && object.hasBrightness !== null) {
            message.hasBrightness = object.hasBrightness;
        } else {
            message.hasBrightness = false;
        }
        if (object.brightness !== undefined && object.brightness !== null) {
            message.brightness = object.brightness;
        } else {
            message.brightness = 0;
        }
        if (object.hasRgb !== undefined && object.hasRgb !== null) {
            message.hasRgb = object.hasRgb;
        } else {
            message.hasRgb = false;
        }
        if (object.red !== undefined && object.red !== null) {
            message.red = object.red;
        } else {
            message.red = 0;
        }
        if (object.green !== undefined && object.green !== null) {
            message.green = object.green;
        } else {
            message.green = 0;
        }
        if (object.blue !== undefined && object.blue !== null) {
            message.blue = object.blue;
        } else {
            message.blue = 0;
        }
        if (object.hasWhite !== undefined && object.hasWhite !== null) {
            message.hasWhite = object.hasWhite;
        } else {
            message.hasWhite = false;
        }
        if (object.white !== undefined && object.white !== null) {
            message.white = object.white;
        } else {
            message.white = 0;
        }
        if (object.hasColorTemperature !== undefined && object.hasColorTemperature !== null) {
            message.hasColorTemperature = object.hasColorTemperature;
        } else {
            message.hasColorTemperature = false;
        }
        if (object.colorTemperature !== undefined && object.colorTemperature !== null) {
            message.colorTemperature = object.colorTemperature;
        } else {
            message.colorTemperature = 0;
        }
        if (object.hasTransitionLength !== undefined && object.hasTransitionLength !== null) {
            message.hasTransitionLength = object.hasTransitionLength;
        } else {
            message.hasTransitionLength = false;
        }
        if (object.transitionLength !== undefined && object.transitionLength !== null) {
            message.transitionLength = object.transitionLength;
        } else {
            message.transitionLength = 0;
        }
        if (object.hasFlashLength !== undefined && object.hasFlashLength !== null) {
            message.hasFlashLength = object.hasFlashLength;
        } else {
            message.hasFlashLength = false;
        }
        if (object.flashLength !== undefined && object.flashLength !== null) {
            message.flashLength = object.flashLength;
        } else {
            message.flashLength = 0;
        }
        if (object.hasEffect !== undefined && object.hasEffect !== null) {
            message.hasEffect = object.hasEffect;
        } else {
            message.hasEffect = false;
        }
        if (object.effect !== undefined && object.effect !== null) {
            message.effect = object.effect;
        } else {
            message.effect = '';
        }
        return message;
    },
};

const baseListEntitiesSensorResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    icon: '',
    unitOfMeasurement: '',
    accuracyDecimals: 0,
    forceUpdate: false,
    deviceClass: '',
};

export const ListEntitiesSensorResponse = {
    encode(message: ListEntitiesSensorResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.icon !== '') {
            writer.uint32(42).string(message.icon);
        }
        if (message.unitOfMeasurement !== '') {
            writer.uint32(50).string(message.unitOfMeasurement);
        }
        if (message.accuracyDecimals !== 0) {
            writer.uint32(56).int32(message.accuracyDecimals);
        }
        if (message.forceUpdate === true) {
            writer.uint32(64).bool(message.forceUpdate);
        }
        if (message.deviceClass !== '') {
            writer.uint32(74).string(message.deviceClass);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesSensorResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesSensorResponse } as ListEntitiesSensorResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.icon = reader.string();
                    break;
                case 6:
                    message.unitOfMeasurement = reader.string();
                    break;
                case 7:
                    message.accuracyDecimals = reader.int32();
                    break;
                case 8:
                    message.forceUpdate = reader.bool();
                    break;
                case 9:
                    message.deviceClass = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesSensorResponse {
        const message = { ...baseListEntitiesSensorResponse } as ListEntitiesSensorResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.icon !== undefined && object.icon !== null) {
            message.icon = String(object.icon);
        } else {
            message.icon = '';
        }
        if (object.unitOfMeasurement !== undefined && object.unitOfMeasurement !== null) {
            message.unitOfMeasurement = String(object.unitOfMeasurement);
        } else {
            message.unitOfMeasurement = '';
        }
        if (object.accuracyDecimals !== undefined && object.accuracyDecimals !== null) {
            message.accuracyDecimals = Number(object.accuracyDecimals);
        } else {
            message.accuracyDecimals = 0;
        }
        if (object.forceUpdate !== undefined && object.forceUpdate !== null) {
            message.forceUpdate = Boolean(object.forceUpdate);
        } else {
            message.forceUpdate = false;
        }
        if (object.deviceClass !== undefined && object.deviceClass !== null) {
            message.deviceClass = String(object.deviceClass);
        } else {
            message.deviceClass = '';
        }
        return message;
    },

    toJSON(message: ListEntitiesSensorResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.icon !== undefined && (obj.icon = message.icon);
        message.unitOfMeasurement !== undefined && (obj.unitOfMeasurement = message.unitOfMeasurement);
        message.accuracyDecimals !== undefined && (obj.accuracyDecimals = message.accuracyDecimals);
        message.forceUpdate !== undefined && (obj.forceUpdate = message.forceUpdate);
        message.deviceClass !== undefined && (obj.deviceClass = message.deviceClass);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesSensorResponse>): ListEntitiesSensorResponse {
        const message = { ...baseListEntitiesSensorResponse } as ListEntitiesSensorResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.icon !== undefined && object.icon !== null) {
            message.icon = object.icon;
        } else {
            message.icon = '';
        }
        if (object.unitOfMeasurement !== undefined && object.unitOfMeasurement !== null) {
            message.unitOfMeasurement = object.unitOfMeasurement;
        } else {
            message.unitOfMeasurement = '';
        }
        if (object.accuracyDecimals !== undefined && object.accuracyDecimals !== null) {
            message.accuracyDecimals = object.accuracyDecimals;
        } else {
            message.accuracyDecimals = 0;
        }
        if (object.forceUpdate !== undefined && object.forceUpdate !== null) {
            message.forceUpdate = object.forceUpdate;
        } else {
            message.forceUpdate = false;
        }
        if (object.deviceClass !== undefined && object.deviceClass !== null) {
            message.deviceClass = object.deviceClass;
        } else {
            message.deviceClass = '';
        }
        return message;
    },
};

const baseSensorStateResponse: object = { key: 0, state: 0, missingState: false };

export const SensorStateResponse = {
    encode(message: SensorStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state !== 0) {
            writer.uint32(21).float(message.state);
        }
        if (message.missingState === true) {
            writer.uint32(24).bool(message.missingState);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SensorStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSensorStateResponse } as SensorStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.float();
                    break;
                case 3:
                    message.missingState = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): SensorStateResponse {
        const message = { ...baseSensorStateResponse } as SensorStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Number(object.state);
        } else {
            message.state = 0;
        }
        if (object.missingState !== undefined && object.missingState !== null) {
            message.missingState = Boolean(object.missingState);
        } else {
            message.missingState = false;
        }
        return message;
    },

    toJSON(message: SensorStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        message.missingState !== undefined && (obj.missingState = message.missingState);
        return obj;
    },

    fromPartial(object: DeepPartial<SensorStateResponse>): SensorStateResponse {
        const message = { ...baseSensorStateResponse } as SensorStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = 0;
        }
        if (object.missingState !== undefined && object.missingState !== null) {
            message.missingState = object.missingState;
        } else {
            message.missingState = false;
        }
        return message;
    },
};

const baseListEntitiesSwitchResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    icon: '',
    assumedState: false,
};

export const ListEntitiesSwitchResponse = {
    encode(message: ListEntitiesSwitchResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.icon !== '') {
            writer.uint32(42).string(message.icon);
        }
        if (message.assumedState === true) {
            writer.uint32(48).bool(message.assumedState);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesSwitchResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesSwitchResponse } as ListEntitiesSwitchResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.icon = reader.string();
                    break;
                case 6:
                    message.assumedState = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesSwitchResponse {
        const message = { ...baseListEntitiesSwitchResponse } as ListEntitiesSwitchResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.icon !== undefined && object.icon !== null) {
            message.icon = String(object.icon);
        } else {
            message.icon = '';
        }
        if (object.assumedState !== undefined && object.assumedState !== null) {
            message.assumedState = Boolean(object.assumedState);
        } else {
            message.assumedState = false;
        }
        return message;
    },

    toJSON(message: ListEntitiesSwitchResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.icon !== undefined && (obj.icon = message.icon);
        message.assumedState !== undefined && (obj.assumedState = message.assumedState);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesSwitchResponse>): ListEntitiesSwitchResponse {
        const message = { ...baseListEntitiesSwitchResponse } as ListEntitiesSwitchResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.icon !== undefined && object.icon !== null) {
            message.icon = object.icon;
        } else {
            message.icon = '';
        }
        if (object.assumedState !== undefined && object.assumedState !== null) {
            message.assumedState = object.assumedState;
        } else {
            message.assumedState = false;
        }
        return message;
    },
};

const baseSwitchStateResponse: object = { key: 0, state: false };

export const SwitchStateResponse = {
    encode(message: SwitchStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state === true) {
            writer.uint32(16).bool(message.state);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SwitchStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSwitchStateResponse } as SwitchStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): SwitchStateResponse {
        const message = { ...baseSwitchStateResponse } as SwitchStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        return message;
    },

    toJSON(message: SwitchStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        return obj;
    },

    fromPartial(object: DeepPartial<SwitchStateResponse>): SwitchStateResponse {
        const message = { ...baseSwitchStateResponse } as SwitchStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        return message;
    },
};

const baseSwitchCommandRequest: object = { key: 0, state: false };

export const SwitchCommandRequest = {
    encode(message: SwitchCommandRequest, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state === true) {
            writer.uint32(16).bool(message.state);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SwitchCommandRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSwitchCommandRequest } as SwitchCommandRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): SwitchCommandRequest {
        const message = { ...baseSwitchCommandRequest } as SwitchCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = Boolean(object.state);
        } else {
            message.state = false;
        }
        return message;
    },

    toJSON(message: SwitchCommandRequest): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        return obj;
    },

    fromPartial(object: DeepPartial<SwitchCommandRequest>): SwitchCommandRequest {
        const message = { ...baseSwitchCommandRequest } as SwitchCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = false;
        }
        return message;
    },
};

const baseListEntitiesTextSensorResponse: object = { objectId: '', key: 0, name: '', uniqueId: '', icon: '' };

export const ListEntitiesTextSensorResponse = {
    encode(message: ListEntitiesTextSensorResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.icon !== '') {
            writer.uint32(42).string(message.icon);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesTextSensorResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesTextSensorResponse } as ListEntitiesTextSensorResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.icon = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesTextSensorResponse {
        const message = { ...baseListEntitiesTextSensorResponse } as ListEntitiesTextSensorResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.icon !== undefined && object.icon !== null) {
            message.icon = String(object.icon);
        } else {
            message.icon = '';
        }
        return message;
    },

    toJSON(message: ListEntitiesTextSensorResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.icon !== undefined && (obj.icon = message.icon);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesTextSensorResponse>): ListEntitiesTextSensorResponse {
        const message = { ...baseListEntitiesTextSensorResponse } as ListEntitiesTextSensorResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.icon !== undefined && object.icon !== null) {
            message.icon = object.icon;
        } else {
            message.icon = '';
        }
        return message;
    },
};

const baseTextSensorStateResponse: object = { key: 0, state: '', missingState: false };

export const TextSensorStateResponse = {
    encode(message: TextSensorStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.state !== '') {
            writer.uint32(18).string(message.state);
        }
        if (message.missingState === true) {
            writer.uint32(24).bool(message.missingState);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): TextSensorStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseTextSensorStateResponse } as TextSensorStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.state = reader.string();
                    break;
                case 3:
                    message.missingState = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): TextSensorStateResponse {
        const message = { ...baseTextSensorStateResponse } as TextSensorStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = String(object.state);
        } else {
            message.state = '';
        }
        if (object.missingState !== undefined && object.missingState !== null) {
            message.missingState = Boolean(object.missingState);
        } else {
            message.missingState = false;
        }
        return message;
    },

    toJSON(message: TextSensorStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.state !== undefined && (obj.state = message.state);
        message.missingState !== undefined && (obj.missingState = message.missingState);
        return obj;
    },

    fromPartial(object: DeepPartial<TextSensorStateResponse>): TextSensorStateResponse {
        const message = { ...baseTextSensorStateResponse } as TextSensorStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = '';
        }
        if (object.missingState !== undefined && object.missingState !== null) {
            message.missingState = object.missingState;
        } else {
            message.missingState = false;
        }
        return message;
    },
};

const baseSubscribeLogsRequest: object = { level: 0, dumpConfig: false };

export const SubscribeLogsRequest = {
    encode(message: SubscribeLogsRequest, writer: Writer = Writer.create()): Writer {
        if (message.level !== 0) {
            writer.uint32(8).int32(message.level);
        }
        if (message.dumpConfig === true) {
            writer.uint32(16).bool(message.dumpConfig);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SubscribeLogsRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSubscribeLogsRequest } as SubscribeLogsRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.level = reader.int32() as any;
                    break;
                case 2:
                    message.dumpConfig = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): SubscribeLogsRequest {
        const message = { ...baseSubscribeLogsRequest } as SubscribeLogsRequest;
        if (object.level !== undefined && object.level !== null) {
            message.level = logLevelFromJSON(object.level);
        } else {
            message.level = 0;
        }
        if (object.dumpConfig !== undefined && object.dumpConfig !== null) {
            message.dumpConfig = Boolean(object.dumpConfig);
        } else {
            message.dumpConfig = false;
        }
        return message;
    },

    toJSON(message: SubscribeLogsRequest): unknown {
        const obj: any = {};
        message.level !== undefined && (obj.level = logLevelToJSON(message.level));
        message.dumpConfig !== undefined && (obj.dumpConfig = message.dumpConfig);
        return obj;
    },

    fromPartial(object: DeepPartial<SubscribeLogsRequest>): SubscribeLogsRequest {
        const message = { ...baseSubscribeLogsRequest } as SubscribeLogsRequest;
        if (object.level !== undefined && object.level !== null) {
            message.level = object.level;
        } else {
            message.level = 0;
        }
        if (object.dumpConfig !== undefined && object.dumpConfig !== null) {
            message.dumpConfig = object.dumpConfig;
        } else {
            message.dumpConfig = false;
        }
        return message;
    },
};

const baseSubscribeLogsResponse: object = { level: 0, tag: '', message: '', sendFailed: false };

export const SubscribeLogsResponse = {
    encode(message: SubscribeLogsResponse, writer: Writer = Writer.create()): Writer {
        if (message.level !== 0) {
            writer.uint32(8).int32(message.level);
        }
        if (message.tag !== '') {
            writer.uint32(18).string(message.tag);
        }
        if (message.message !== '') {
            writer.uint32(26).string(message.message);
        }
        if (message.sendFailed === true) {
            writer.uint32(32).bool(message.sendFailed);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SubscribeLogsResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSubscribeLogsResponse } as SubscribeLogsResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.level = reader.int32() as any;
                    break;
                case 2:
                    message.tag = reader.string();
                    break;
                case 3:
                    message.message = reader.string();
                    break;
                case 4:
                    message.sendFailed = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): SubscribeLogsResponse {
        const message = { ...baseSubscribeLogsResponse } as SubscribeLogsResponse;
        if (object.level !== undefined && object.level !== null) {
            message.level = logLevelFromJSON(object.level);
        } else {
            message.level = 0;
        }
        if (object.tag !== undefined && object.tag !== null) {
            message.tag = String(object.tag);
        } else {
            message.tag = '';
        }
        if (object.message !== undefined && object.message !== null) {
            message.message = String(object.message);
        } else {
            message.message = '';
        }
        if (object.sendFailed !== undefined && object.sendFailed !== null) {
            message.sendFailed = Boolean(object.sendFailed);
        } else {
            message.sendFailed = false;
        }
        return message;
    },

    toJSON(message: SubscribeLogsResponse): unknown {
        const obj: any = {};
        message.level !== undefined && (obj.level = logLevelToJSON(message.level));
        message.tag !== undefined && (obj.tag = message.tag);
        message.message !== undefined && (obj.message = message.message);
        message.sendFailed !== undefined && (obj.sendFailed = message.sendFailed);
        return obj;
    },

    fromPartial(object: DeepPartial<SubscribeLogsResponse>): SubscribeLogsResponse {
        const message = { ...baseSubscribeLogsResponse } as SubscribeLogsResponse;
        if (object.level !== undefined && object.level !== null) {
            message.level = object.level;
        } else {
            message.level = 0;
        }
        if (object.tag !== undefined && object.tag !== null) {
            message.tag = object.tag;
        } else {
            message.tag = '';
        }
        if (object.message !== undefined && object.message !== null) {
            message.message = object.message;
        } else {
            message.message = '';
        }
        if (object.sendFailed !== undefined && object.sendFailed !== null) {
            message.sendFailed = object.sendFailed;
        } else {
            message.sendFailed = false;
        }
        return message;
    },
};

const baseSubscribeHomeassistantServicesRequest: object = {};

export const SubscribeHomeassistantServicesRequest = {
    encode(_: SubscribeHomeassistantServicesRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SubscribeHomeassistantServicesRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSubscribeHomeassistantServicesRequest } as SubscribeHomeassistantServicesRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): SubscribeHomeassistantServicesRequest {
        const message = { ...baseSubscribeHomeassistantServicesRequest } as SubscribeHomeassistantServicesRequest;
        return message;
    },

    toJSON(_: SubscribeHomeassistantServicesRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<SubscribeHomeassistantServicesRequest>): SubscribeHomeassistantServicesRequest {
        const message = { ...baseSubscribeHomeassistantServicesRequest } as SubscribeHomeassistantServicesRequest;
        return message;
    },
};

const baseHomeassistantServiceMap: object = { key: '', value: '' };

export const HomeassistantServiceMap = {
    encode(message: HomeassistantServiceMap, writer: Writer = Writer.create()): Writer {
        if (message.key !== '') {
            writer.uint32(10).string(message.key);
        }
        if (message.value !== '') {
            writer.uint32(18).string(message.value);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): HomeassistantServiceMap {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseHomeassistantServiceMap } as HomeassistantServiceMap;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.string();
                    break;
                case 2:
                    message.value = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): HomeassistantServiceMap {
        const message = { ...baseHomeassistantServiceMap } as HomeassistantServiceMap;
        if (object.key !== undefined && object.key !== null) {
            message.key = String(object.key);
        } else {
            message.key = '';
        }
        if (object.value !== undefined && object.value !== null) {
            message.value = String(object.value);
        } else {
            message.value = '';
        }
        return message;
    },

    toJSON(message: HomeassistantServiceMap): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.value !== undefined && (obj.value = message.value);
        return obj;
    },

    fromPartial(object: DeepPartial<HomeassistantServiceMap>): HomeassistantServiceMap {
        const message = { ...baseHomeassistantServiceMap } as HomeassistantServiceMap;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = '';
        }
        if (object.value !== undefined && object.value !== null) {
            message.value = object.value;
        } else {
            message.value = '';
        }
        return message;
    },
};

const baseHomeassistantServiceResponse: object = { service: '', isEvent: false };

export const HomeassistantServiceResponse = {
    encode(message: HomeassistantServiceResponse, writer: Writer = Writer.create()): Writer {
        if (message.service !== '') {
            writer.uint32(10).string(message.service);
        }
        for (const v of message.data) {
            HomeassistantServiceMap.encode(v!, writer.uint32(18).fork()).ldelim();
        }
        for (const v of message.dataTemplate) {
            HomeassistantServiceMap.encode(v!, writer.uint32(26).fork()).ldelim();
        }
        for (const v of message.variables) {
            HomeassistantServiceMap.encode(v!, writer.uint32(34).fork()).ldelim();
        }
        if (message.isEvent === true) {
            writer.uint32(40).bool(message.isEvent);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): HomeassistantServiceResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseHomeassistantServiceResponse } as HomeassistantServiceResponse;
        message.data = [];
        message.dataTemplate = [];
        message.variables = [];
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.service = reader.string();
                    break;
                case 2:
                    message.data.push(HomeassistantServiceMap.decode(reader, reader.uint32()));
                    break;
                case 3:
                    message.dataTemplate.push(HomeassistantServiceMap.decode(reader, reader.uint32()));
                    break;
                case 4:
                    message.variables.push(HomeassistantServiceMap.decode(reader, reader.uint32()));
                    break;
                case 5:
                    message.isEvent = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): HomeassistantServiceResponse {
        const message = { ...baseHomeassistantServiceResponse } as HomeassistantServiceResponse;
        message.data = [];
        message.dataTemplate = [];
        message.variables = [];
        if (object.service !== undefined && object.service !== null) {
            message.service = String(object.service);
        } else {
            message.service = '';
        }
        if (object.data !== undefined && object.data !== null) {
            for (const e of object.data) {
                message.data.push(HomeassistantServiceMap.fromJSON(e));
            }
        }
        if (object.dataTemplate !== undefined && object.dataTemplate !== null) {
            for (const e of object.dataTemplate) {
                message.dataTemplate.push(HomeassistantServiceMap.fromJSON(e));
            }
        }
        if (object.variables !== undefined && object.variables !== null) {
            for (const e of object.variables) {
                message.variables.push(HomeassistantServiceMap.fromJSON(e));
            }
        }
        if (object.isEvent !== undefined && object.isEvent !== null) {
            message.isEvent = Boolean(object.isEvent);
        } else {
            message.isEvent = false;
        }
        return message;
    },

    toJSON(message: HomeassistantServiceResponse): unknown {
        const obj: any = {};
        message.service !== undefined && (obj.service = message.service);
        if (message.data) {
            obj.data = message.data.map((e) => (e ? HomeassistantServiceMap.toJSON(e) : undefined));
        } else {
            obj.data = [];
        }
        if (message.dataTemplate) {
            obj.dataTemplate = message.dataTemplate.map((e) => (e ? HomeassistantServiceMap.toJSON(e) : undefined));
        } else {
            obj.dataTemplate = [];
        }
        if (message.variables) {
            obj.variables = message.variables.map((e) => (e ? HomeassistantServiceMap.toJSON(e) : undefined));
        } else {
            obj.variables = [];
        }
        message.isEvent !== undefined && (obj.isEvent = message.isEvent);
        return obj;
    },

    fromPartial(object: DeepPartial<HomeassistantServiceResponse>): HomeassistantServiceResponse {
        const message = { ...baseHomeassistantServiceResponse } as HomeassistantServiceResponse;
        message.data = [];
        message.dataTemplate = [];
        message.variables = [];
        if (object.service !== undefined && object.service !== null) {
            message.service = object.service;
        } else {
            message.service = '';
        }
        if (object.data !== undefined && object.data !== null) {
            for (const e of object.data) {
                message.data.push(HomeassistantServiceMap.fromPartial(e));
            }
        }
        if (object.dataTemplate !== undefined && object.dataTemplate !== null) {
            for (const e of object.dataTemplate) {
                message.dataTemplate.push(HomeassistantServiceMap.fromPartial(e));
            }
        }
        if (object.variables !== undefined && object.variables !== null) {
            for (const e of object.variables) {
                message.variables.push(HomeassistantServiceMap.fromPartial(e));
            }
        }
        if (object.isEvent !== undefined && object.isEvent !== null) {
            message.isEvent = object.isEvent;
        } else {
            message.isEvent = false;
        }
        return message;
    },
};

const baseSubscribeHomeAssistantStatesRequest: object = {};

export const SubscribeHomeAssistantStatesRequest = {
    encode(_: SubscribeHomeAssistantStatesRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SubscribeHomeAssistantStatesRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSubscribeHomeAssistantStatesRequest } as SubscribeHomeAssistantStatesRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): SubscribeHomeAssistantStatesRequest {
        const message = { ...baseSubscribeHomeAssistantStatesRequest } as SubscribeHomeAssistantStatesRequest;
        return message;
    },

    toJSON(_: SubscribeHomeAssistantStatesRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<SubscribeHomeAssistantStatesRequest>): SubscribeHomeAssistantStatesRequest {
        const message = { ...baseSubscribeHomeAssistantStatesRequest } as SubscribeHomeAssistantStatesRequest;
        return message;
    },
};

const baseSubscribeHomeAssistantStateResponse: object = { entityId: '' };

export const SubscribeHomeAssistantStateResponse = {
    encode(message: SubscribeHomeAssistantStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.entityId !== '') {
            writer.uint32(10).string(message.entityId);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): SubscribeHomeAssistantStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseSubscribeHomeAssistantStateResponse } as SubscribeHomeAssistantStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.entityId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): SubscribeHomeAssistantStateResponse {
        const message = { ...baseSubscribeHomeAssistantStateResponse } as SubscribeHomeAssistantStateResponse;
        if (object.entityId !== undefined && object.entityId !== null) {
            message.entityId = String(object.entityId);
        } else {
            message.entityId = '';
        }
        return message;
    },

    toJSON(message: SubscribeHomeAssistantStateResponse): unknown {
        const obj: any = {};
        message.entityId !== undefined && (obj.entityId = message.entityId);
        return obj;
    },

    fromPartial(object: DeepPartial<SubscribeHomeAssistantStateResponse>): SubscribeHomeAssistantStateResponse {
        const message = { ...baseSubscribeHomeAssistantStateResponse } as SubscribeHomeAssistantStateResponse;
        if (object.entityId !== undefined && object.entityId !== null) {
            message.entityId = object.entityId;
        } else {
            message.entityId = '';
        }
        return message;
    },
};

const baseHomeAssistantStateResponse: object = { entityId: '', state: '' };

export const HomeAssistantStateResponse = {
    encode(message: HomeAssistantStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.entityId !== '') {
            writer.uint32(10).string(message.entityId);
        }
        if (message.state !== '') {
            writer.uint32(18).string(message.state);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): HomeAssistantStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseHomeAssistantStateResponse } as HomeAssistantStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.entityId = reader.string();
                    break;
                case 2:
                    message.state = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): HomeAssistantStateResponse {
        const message = { ...baseHomeAssistantStateResponse } as HomeAssistantStateResponse;
        if (object.entityId !== undefined && object.entityId !== null) {
            message.entityId = String(object.entityId);
        } else {
            message.entityId = '';
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = String(object.state);
        } else {
            message.state = '';
        }
        return message;
    },

    toJSON(message: HomeAssistantStateResponse): unknown {
        const obj: any = {};
        message.entityId !== undefined && (obj.entityId = message.entityId);
        message.state !== undefined && (obj.state = message.state);
        return obj;
    },

    fromPartial(object: DeepPartial<HomeAssistantStateResponse>): HomeAssistantStateResponse {
        const message = { ...baseHomeAssistantStateResponse } as HomeAssistantStateResponse;
        if (object.entityId !== undefined && object.entityId !== null) {
            message.entityId = object.entityId;
        } else {
            message.entityId = '';
        }
        if (object.state !== undefined && object.state !== null) {
            message.state = object.state;
        } else {
            message.state = '';
        }
        return message;
    },
};

const baseGetTimeRequest: object = {};

export const GetTimeRequest = {
    encode(_: GetTimeRequest, writer: Writer = Writer.create()): Writer {
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): GetTimeRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseGetTimeRequest } as GetTimeRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(_: any): GetTimeRequest {
        const message = { ...baseGetTimeRequest } as GetTimeRequest;
        return message;
    },

    toJSON(_: GetTimeRequest): unknown {
        const obj: any = {};
        return obj;
    },

    fromPartial(_: DeepPartial<GetTimeRequest>): GetTimeRequest {
        const message = { ...baseGetTimeRequest } as GetTimeRequest;
        return message;
    },
};

const baseGetTimeResponse: object = { epochSeconds: 0 };

export const GetTimeResponse = {
    encode(message: GetTimeResponse, writer: Writer = Writer.create()): Writer {
        if (message.epochSeconds !== 0) {
            writer.uint32(13).fixed32(message.epochSeconds);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): GetTimeResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseGetTimeResponse } as GetTimeResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.epochSeconds = reader.fixed32();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): GetTimeResponse {
        const message = { ...baseGetTimeResponse } as GetTimeResponse;
        if (object.epochSeconds !== undefined && object.epochSeconds !== null) {
            message.epochSeconds = Number(object.epochSeconds);
        } else {
            message.epochSeconds = 0;
        }
        return message;
    },

    toJSON(message: GetTimeResponse): unknown {
        const obj: any = {};
        message.epochSeconds !== undefined && (obj.epochSeconds = message.epochSeconds);
        return obj;
    },

    fromPartial(object: DeepPartial<GetTimeResponse>): GetTimeResponse {
        const message = { ...baseGetTimeResponse } as GetTimeResponse;
        if (object.epochSeconds !== undefined && object.epochSeconds !== null) {
            message.epochSeconds = object.epochSeconds;
        } else {
            message.epochSeconds = 0;
        }
        return message;
    },
};

const baseListEntitiesServicesArgument: object = { name: '', type: 0 };

export const ListEntitiesServicesArgument = {
    encode(message: ListEntitiesServicesArgument, writer: Writer = Writer.create()): Writer {
        if (message.name !== '') {
            writer.uint32(10).string(message.name);
        }
        if (message.type !== 0) {
            writer.uint32(16).int32(message.type);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesServicesArgument {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesServicesArgument } as ListEntitiesServicesArgument;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.type = reader.int32() as any;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesServicesArgument {
        const message = { ...baseListEntitiesServicesArgument } as ListEntitiesServicesArgument;
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.type !== undefined && object.type !== null) {
            message.type = serviceArgTypeFromJSON(object.type);
        } else {
            message.type = 0;
        }
        return message;
    },

    toJSON(message: ListEntitiesServicesArgument): unknown {
        const obj: any = {};
        message.name !== undefined && (obj.name = message.name);
        message.type !== undefined && (obj.type = serviceArgTypeToJSON(message.type));
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesServicesArgument>): ListEntitiesServicesArgument {
        const message = { ...baseListEntitiesServicesArgument } as ListEntitiesServicesArgument;
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.type !== undefined && object.type !== null) {
            message.type = object.type;
        } else {
            message.type = 0;
        }
        return message;
    },
};

const baseListEntitiesServicesResponse: object = { name: '', key: 0 };

export const ListEntitiesServicesResponse = {
    encode(message: ListEntitiesServicesResponse, writer: Writer = Writer.create()): Writer {
        if (message.name !== '') {
            writer.uint32(10).string(message.name);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        for (const v of message.args) {
            ListEntitiesServicesArgument.encode(v!, writer.uint32(26).fork()).ldelim();
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesServicesResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesServicesResponse } as ListEntitiesServicesResponse;
        message.args = [];
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.name = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.args.push(ListEntitiesServicesArgument.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesServicesResponse {
        const message = { ...baseListEntitiesServicesResponse } as ListEntitiesServicesResponse;
        message.args = [];
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.args !== undefined && object.args !== null) {
            for (const e of object.args) {
                message.args.push(ListEntitiesServicesArgument.fromJSON(e));
            }
        }
        return message;
    },

    toJSON(message: ListEntitiesServicesResponse): unknown {
        const obj: any = {};
        message.name !== undefined && (obj.name = message.name);
        message.key !== undefined && (obj.key = message.key);
        if (message.args) {
            obj.args = message.args.map((e) => (e ? ListEntitiesServicesArgument.toJSON(e) : undefined));
        } else {
            obj.args = [];
        }
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesServicesResponse>): ListEntitiesServicesResponse {
        const message = { ...baseListEntitiesServicesResponse } as ListEntitiesServicesResponse;
        message.args = [];
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.args !== undefined && object.args !== null) {
            for (const e of object.args) {
                message.args.push(ListEntitiesServicesArgument.fromPartial(e));
            }
        }
        return message;
    },
};

const baseExecuteServiceArgument: object = {
    bool_: false,
    legacyInt: 0,
    float_: 0,
    string_: '',
    int_: 0,
    boolArray: false,
    intArray: 0,
    floatArray: 0,
    stringArray: '',
};

export const ExecuteServiceArgument = {
    encode(message: ExecuteServiceArgument, writer: Writer = Writer.create()): Writer {
        if (message.bool_ === true) {
            writer.uint32(8).bool(message.bool_);
        }
        if (message.legacyInt !== 0) {
            writer.uint32(16).int32(message.legacyInt);
        }
        if (message.float_ !== 0) {
            writer.uint32(29).float(message.float_);
        }
        if (message.string_ !== '') {
            writer.uint32(34).string(message.string_);
        }
        if (message.int_ !== 0) {
            writer.uint32(40).sint32(message.int_);
        }
        writer.uint32(50).fork();
        for (const v of message.boolArray) {
            writer.bool(v);
        }
        writer.ldelim();
        writer.uint32(58).fork();
        for (const v of message.intArray) {
            writer.sint32(v);
        }
        writer.ldelim();
        writer.uint32(66).fork();
        for (const v of message.floatArray) {
            writer.float(v);
        }
        writer.ldelim();
        for (const v of message.stringArray) {
            writer.uint32(74).string(v!);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ExecuteServiceArgument {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseExecuteServiceArgument } as ExecuteServiceArgument;
        message.boolArray = [];
        message.intArray = [];
        message.floatArray = [];
        message.stringArray = [];
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.bool_ = reader.bool();
                    break;
                case 2:
                    message.legacyInt = reader.int32();
                    break;
                case 3:
                    message.float_ = reader.float();
                    break;
                case 4:
                    message.string_ = reader.string();
                    break;
                case 5:
                    message.int_ = reader.sint32();
                    break;
                case 6:
                    if ((tag & 7) === 2) {
                        const end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2) {
                            message.boolArray.push(reader.bool());
                        }
                    } else {
                        message.boolArray.push(reader.bool());
                    }
                    break;
                case 7:
                    if ((tag & 7) === 2) {
                        const end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2) {
                            message.intArray.push(reader.sint32());
                        }
                    } else {
                        message.intArray.push(reader.sint32());
                    }
                    break;
                case 8:
                    if ((tag & 7) === 2) {
                        const end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2) {
                            message.floatArray.push(reader.float());
                        }
                    } else {
                        message.floatArray.push(reader.float());
                    }
                    break;
                case 9:
                    message.stringArray.push(reader.string());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ExecuteServiceArgument {
        const message = { ...baseExecuteServiceArgument } as ExecuteServiceArgument;
        message.boolArray = [];
        message.intArray = [];
        message.floatArray = [];
        message.stringArray = [];
        if (object.bool_ !== undefined && object.bool_ !== null) {
            message.bool_ = Boolean(object.bool_);
        } else {
            message.bool_ = false;
        }
        if (object.legacyInt !== undefined && object.legacyInt !== null) {
            message.legacyInt = Number(object.legacyInt);
        } else {
            message.legacyInt = 0;
        }
        if (object.float_ !== undefined && object.float_ !== null) {
            message.float_ = Number(object.float_);
        } else {
            message.float_ = 0;
        }
        if (object.string_ !== undefined && object.string_ !== null) {
            message.string_ = String(object.string_);
        } else {
            message.string_ = '';
        }
        if (object.int_ !== undefined && object.int_ !== null) {
            message.int_ = Number(object.int_);
        } else {
            message.int_ = 0;
        }
        if (object.boolArray !== undefined && object.boolArray !== null) {
            for (const e of object.boolArray) {
                message.boolArray.push(Boolean(e));
            }
        }
        if (object.intArray !== undefined && object.intArray !== null) {
            for (const e of object.intArray) {
                message.intArray.push(Number(e));
            }
        }
        if (object.floatArray !== undefined && object.floatArray !== null) {
            for (const e of object.floatArray) {
                message.floatArray.push(Number(e));
            }
        }
        if (object.stringArray !== undefined && object.stringArray !== null) {
            for (const e of object.stringArray) {
                message.stringArray.push(String(e));
            }
        }
        return message;
    },

    toJSON(message: ExecuteServiceArgument): unknown {
        const obj: any = {};
        message.bool_ !== undefined && (obj.bool_ = message.bool_);
        message.legacyInt !== undefined && (obj.legacyInt = message.legacyInt);
        message.float_ !== undefined && (obj.float_ = message.float_);
        message.string_ !== undefined && (obj.string_ = message.string_);
        message.int_ !== undefined && (obj.int_ = message.int_);
        if (message.boolArray) {
            obj.boolArray = message.boolArray.map((e) => e);
        } else {
            obj.boolArray = [];
        }
        if (message.intArray) {
            obj.intArray = message.intArray.map((e) => e);
        } else {
            obj.intArray = [];
        }
        if (message.floatArray) {
            obj.floatArray = message.floatArray.map((e) => e);
        } else {
            obj.floatArray = [];
        }
        if (message.stringArray) {
            obj.stringArray = message.stringArray.map((e) => e);
        } else {
            obj.stringArray = [];
        }
        return obj;
    },

    fromPartial(object: DeepPartial<ExecuteServiceArgument>): ExecuteServiceArgument {
        const message = { ...baseExecuteServiceArgument } as ExecuteServiceArgument;
        message.boolArray = [];
        message.intArray = [];
        message.floatArray = [];
        message.stringArray = [];
        if (object.bool_ !== undefined && object.bool_ !== null) {
            message.bool_ = object.bool_;
        } else {
            message.bool_ = false;
        }
        if (object.legacyInt !== undefined && object.legacyInt !== null) {
            message.legacyInt = object.legacyInt;
        } else {
            message.legacyInt = 0;
        }
        if (object.float_ !== undefined && object.float_ !== null) {
            message.float_ = object.float_;
        } else {
            message.float_ = 0;
        }
        if (object.string_ !== undefined && object.string_ !== null) {
            message.string_ = object.string_;
        } else {
            message.string_ = '';
        }
        if (object.int_ !== undefined && object.int_ !== null) {
            message.int_ = object.int_;
        } else {
            message.int_ = 0;
        }
        if (object.boolArray !== undefined && object.boolArray !== null) {
            for (const e of object.boolArray) {
                message.boolArray.push(e);
            }
        }
        if (object.intArray !== undefined && object.intArray !== null) {
            for (const e of object.intArray) {
                message.intArray.push(e);
            }
        }
        if (object.floatArray !== undefined && object.floatArray !== null) {
            for (const e of object.floatArray) {
                message.floatArray.push(e);
            }
        }
        if (object.stringArray !== undefined && object.stringArray !== null) {
            for (const e of object.stringArray) {
                message.stringArray.push(e);
            }
        }
        return message;
    },
};

const baseExecuteServiceRequest: object = { key: 0 };

export const ExecuteServiceRequest = {
    encode(message: ExecuteServiceRequest, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        for (const v of message.args) {
            ExecuteServiceArgument.encode(v!, writer.uint32(18).fork()).ldelim();
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ExecuteServiceRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseExecuteServiceRequest } as ExecuteServiceRequest;
        message.args = [];
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.args.push(ExecuteServiceArgument.decode(reader, reader.uint32()));
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ExecuteServiceRequest {
        const message = { ...baseExecuteServiceRequest } as ExecuteServiceRequest;
        message.args = [];
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.args !== undefined && object.args !== null) {
            for (const e of object.args) {
                message.args.push(ExecuteServiceArgument.fromJSON(e));
            }
        }
        return message;
    },

    toJSON(message: ExecuteServiceRequest): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        if (message.args) {
            obj.args = message.args.map((e) => (e ? ExecuteServiceArgument.toJSON(e) : undefined));
        } else {
            obj.args = [];
        }
        return obj;
    },

    fromPartial(object: DeepPartial<ExecuteServiceRequest>): ExecuteServiceRequest {
        const message = { ...baseExecuteServiceRequest } as ExecuteServiceRequest;
        message.args = [];
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.args !== undefined && object.args !== null) {
            for (const e of object.args) {
                message.args.push(ExecuteServiceArgument.fromPartial(e));
            }
        }
        return message;
    },
};

const baseListEntitiesCameraResponse: object = { objectId: '', key: 0, name: '', uniqueId: '' };

export const ListEntitiesCameraResponse = {
    encode(message: ListEntitiesCameraResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesCameraResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesCameraResponse } as ListEntitiesCameraResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesCameraResponse {
        const message = { ...baseListEntitiesCameraResponse } as ListEntitiesCameraResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        return message;
    },

    toJSON(message: ListEntitiesCameraResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesCameraResponse>): ListEntitiesCameraResponse {
        const message = { ...baseListEntitiesCameraResponse } as ListEntitiesCameraResponse;
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        return message;
    },
};

const baseCameraImageResponse: object = { key: 0, done: false };

export const CameraImageResponse = {
    encode(message: CameraImageResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.data.length !== 0) {
            writer.uint32(18).bytes(message.data);
        }
        if (message.done === true) {
            writer.uint32(24).bool(message.done);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): CameraImageResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseCameraImageResponse } as CameraImageResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.data = reader.bytes();
                    break;
                case 3:
                    message.done = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): CameraImageResponse {
        const message = { ...baseCameraImageResponse } as CameraImageResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.data !== undefined && object.data !== null) {
            message.data = bytesFromBase64(object.data);
        }
        if (object.done !== undefined && object.done !== null) {
            message.done = Boolean(object.done);
        } else {
            message.done = false;
        }
        return message;
    },

    toJSON(message: CameraImageResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.data !== undefined &&
            (obj.data = base64FromBytes(message.data !== undefined ? message.data : new Uint8Array()));
        message.done !== undefined && (obj.done = message.done);
        return obj;
    },

    fromPartial(object: DeepPartial<CameraImageResponse>): CameraImageResponse {
        const message = { ...baseCameraImageResponse } as CameraImageResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.data !== undefined && object.data !== null) {
            message.data = object.data;
        } else {
            message.data = new Uint8Array();
        }
        if (object.done !== undefined && object.done !== null) {
            message.done = object.done;
        } else {
            message.done = false;
        }
        return message;
    },
};

const baseCameraImageRequest: object = { single: false, stream: false };

export const CameraImageRequest = {
    encode(message: CameraImageRequest, writer: Writer = Writer.create()): Writer {
        if (message.single === true) {
            writer.uint32(8).bool(message.single);
        }
        if (message.stream === true) {
            writer.uint32(16).bool(message.stream);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): CameraImageRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseCameraImageRequest } as CameraImageRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.single = reader.bool();
                    break;
                case 2:
                    message.stream = reader.bool();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): CameraImageRequest {
        const message = { ...baseCameraImageRequest } as CameraImageRequest;
        if (object.single !== undefined && object.single !== null) {
            message.single = Boolean(object.single);
        } else {
            message.single = false;
        }
        if (object.stream !== undefined && object.stream !== null) {
            message.stream = Boolean(object.stream);
        } else {
            message.stream = false;
        }
        return message;
    },

    toJSON(message: CameraImageRequest): unknown {
        const obj: any = {};
        message.single !== undefined && (obj.single = message.single);
        message.stream !== undefined && (obj.stream = message.stream);
        return obj;
    },

    fromPartial(object: DeepPartial<CameraImageRequest>): CameraImageRequest {
        const message = { ...baseCameraImageRequest } as CameraImageRequest;
        if (object.single !== undefined && object.single !== null) {
            message.single = object.single;
        } else {
            message.single = false;
        }
        if (object.stream !== undefined && object.stream !== null) {
            message.stream = object.stream;
        } else {
            message.stream = false;
        }
        return message;
    },
};

const baseListEntitiesClimateResponse: object = {
    objectId: '',
    key: 0,
    name: '',
    uniqueId: '',
    supportsCurrentTemperature: false,
    supportsTwoPointTargetTemperature: false,
    supportedModes: 0,
    visualMinTemperature: 0,
    visualMaxTemperature: 0,
    visualTemperatureStep: 0,
    supportsAway: false,
    supportsAction: false,
    supportedFanModes: 0,
    supportedSwingModes: 0,
};

export const ListEntitiesClimateResponse = {
    encode(message: ListEntitiesClimateResponse, writer: Writer = Writer.create()): Writer {
        if (message.objectId !== '') {
            writer.uint32(10).string(message.objectId);
        }
        if (message.key !== 0) {
            writer.uint32(21).fixed32(message.key);
        }
        if (message.name !== '') {
            writer.uint32(26).string(message.name);
        }
        if (message.uniqueId !== '') {
            writer.uint32(34).string(message.uniqueId);
        }
        if (message.supportsCurrentTemperature === true) {
            writer.uint32(40).bool(message.supportsCurrentTemperature);
        }
        if (message.supportsTwoPointTargetTemperature === true) {
            writer.uint32(48).bool(message.supportsTwoPointTargetTemperature);
        }
        writer.uint32(58).fork();
        for (const v of message.supportedModes) {
            writer.int32(v);
        }
        writer.ldelim();
        if (message.visualMinTemperature !== 0) {
            writer.uint32(69).float(message.visualMinTemperature);
        }
        if (message.visualMaxTemperature !== 0) {
            writer.uint32(77).float(message.visualMaxTemperature);
        }
        if (message.visualTemperatureStep !== 0) {
            writer.uint32(85).float(message.visualTemperatureStep);
        }
        if (message.supportsAway === true) {
            writer.uint32(88).bool(message.supportsAway);
        }
        if (message.supportsAction === true) {
            writer.uint32(96).bool(message.supportsAction);
        }
        writer.uint32(106).fork();
        for (const v of message.supportedFanModes) {
            writer.int32(v);
        }
        writer.ldelim();
        writer.uint32(114).fork();
        for (const v of message.supportedSwingModes) {
            writer.int32(v);
        }
        writer.ldelim();
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ListEntitiesClimateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseListEntitiesClimateResponse } as ListEntitiesClimateResponse;
        message.supportedModes = [];
        message.supportedFanModes = [];
        message.supportedSwingModes = [];
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.objectId = reader.string();
                    break;
                case 2:
                    message.key = reader.fixed32();
                    break;
                case 3:
                    message.name = reader.string();
                    break;
                case 4:
                    message.uniqueId = reader.string();
                    break;
                case 5:
                    message.supportsCurrentTemperature = reader.bool();
                    break;
                case 6:
                    message.supportsTwoPointTargetTemperature = reader.bool();
                    break;
                case 7:
                    if ((tag & 7) === 2) {
                        const end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2) {
                            message.supportedModes.push(reader.int32() as any);
                        }
                    } else {
                        message.supportedModes.push(reader.int32() as any);
                    }
                    break;
                case 8:
                    message.visualMinTemperature = reader.float();
                    break;
                case 9:
                    message.visualMaxTemperature = reader.float();
                    break;
                case 10:
                    message.visualTemperatureStep = reader.float();
                    break;
                case 11:
                    message.supportsAway = reader.bool();
                    break;
                case 12:
                    message.supportsAction = reader.bool();
                    break;
                case 13:
                    if ((tag & 7) === 2) {
                        const end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2) {
                            message.supportedFanModes.push(reader.int32() as any);
                        }
                    } else {
                        message.supportedFanModes.push(reader.int32() as any);
                    }
                    break;
                case 14:
                    if ((tag & 7) === 2) {
                        const end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2) {
                            message.supportedSwingModes.push(reader.int32() as any);
                        }
                    } else {
                        message.supportedSwingModes.push(reader.int32() as any);
                    }
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ListEntitiesClimateResponse {
        const message = { ...baseListEntitiesClimateResponse } as ListEntitiesClimateResponse;
        message.supportedModes = [];
        message.supportedFanModes = [];
        message.supportedSwingModes = [];
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = String(object.objectId);
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = String(object.name);
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = String(object.uniqueId);
        } else {
            message.uniqueId = '';
        }
        if (object.supportsCurrentTemperature !== undefined && object.supportsCurrentTemperature !== null) {
            message.supportsCurrentTemperature = Boolean(object.supportsCurrentTemperature);
        } else {
            message.supportsCurrentTemperature = false;
        }
        if (
            object.supportsTwoPointTargetTemperature !== undefined &&
            object.supportsTwoPointTargetTemperature !== null
        ) {
            message.supportsTwoPointTargetTemperature = Boolean(object.supportsTwoPointTargetTemperature);
        } else {
            message.supportsTwoPointTargetTemperature = false;
        }
        if (object.supportedModes !== undefined && object.supportedModes !== null) {
            for (const e of object.supportedModes) {
                message.supportedModes.push(climateModeFromJSON(e));
            }
        }
        if (object.visualMinTemperature !== undefined && object.visualMinTemperature !== null) {
            message.visualMinTemperature = Number(object.visualMinTemperature);
        } else {
            message.visualMinTemperature = 0;
        }
        if (object.visualMaxTemperature !== undefined && object.visualMaxTemperature !== null) {
            message.visualMaxTemperature = Number(object.visualMaxTemperature);
        } else {
            message.visualMaxTemperature = 0;
        }
        if (object.visualTemperatureStep !== undefined && object.visualTemperatureStep !== null) {
            message.visualTemperatureStep = Number(object.visualTemperatureStep);
        } else {
            message.visualTemperatureStep = 0;
        }
        if (object.supportsAway !== undefined && object.supportsAway !== null) {
            message.supportsAway = Boolean(object.supportsAway);
        } else {
            message.supportsAway = false;
        }
        if (object.supportsAction !== undefined && object.supportsAction !== null) {
            message.supportsAction = Boolean(object.supportsAction);
        } else {
            message.supportsAction = false;
        }
        if (object.supportedFanModes !== undefined && object.supportedFanModes !== null) {
            for (const e of object.supportedFanModes) {
                message.supportedFanModes.push(climateFanModeFromJSON(e));
            }
        }
        if (object.supportedSwingModes !== undefined && object.supportedSwingModes !== null) {
            for (const e of object.supportedSwingModes) {
                message.supportedSwingModes.push(climateSwingModeFromJSON(e));
            }
        }
        return message;
    },

    toJSON(message: ListEntitiesClimateResponse): unknown {
        const obj: any = {};
        message.objectId !== undefined && (obj.objectId = message.objectId);
        message.key !== undefined && (obj.key = message.key);
        message.name !== undefined && (obj.name = message.name);
        message.uniqueId !== undefined && (obj.uniqueId = message.uniqueId);
        message.supportsCurrentTemperature !== undefined &&
            (obj.supportsCurrentTemperature = message.supportsCurrentTemperature);
        message.supportsTwoPointTargetTemperature !== undefined &&
            (obj.supportsTwoPointTargetTemperature = message.supportsTwoPointTargetTemperature);
        if (message.supportedModes) {
            obj.supportedModes = message.supportedModes.map((e) => climateModeToJSON(e));
        } else {
            obj.supportedModes = [];
        }
        message.visualMinTemperature !== undefined && (obj.visualMinTemperature = message.visualMinTemperature);
        message.visualMaxTemperature !== undefined && (obj.visualMaxTemperature = message.visualMaxTemperature);
        message.visualTemperatureStep !== undefined && (obj.visualTemperatureStep = message.visualTemperatureStep);
        message.supportsAway !== undefined && (obj.supportsAway = message.supportsAway);
        message.supportsAction !== undefined && (obj.supportsAction = message.supportsAction);
        if (message.supportedFanModes) {
            obj.supportedFanModes = message.supportedFanModes.map((e) => climateFanModeToJSON(e));
        } else {
            obj.supportedFanModes = [];
        }
        if (message.supportedSwingModes) {
            obj.supportedSwingModes = message.supportedSwingModes.map((e) => climateSwingModeToJSON(e));
        } else {
            obj.supportedSwingModes = [];
        }
        return obj;
    },

    fromPartial(object: DeepPartial<ListEntitiesClimateResponse>): ListEntitiesClimateResponse {
        const message = { ...baseListEntitiesClimateResponse } as ListEntitiesClimateResponse;
        message.supportedModes = [];
        message.supportedFanModes = [];
        message.supportedSwingModes = [];
        if (object.objectId !== undefined && object.objectId !== null) {
            message.objectId = object.objectId;
        } else {
            message.objectId = '';
        }
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.name !== undefined && object.name !== null) {
            message.name = object.name;
        } else {
            message.name = '';
        }
        if (object.uniqueId !== undefined && object.uniqueId !== null) {
            message.uniqueId = object.uniqueId;
        } else {
            message.uniqueId = '';
        }
        if (object.supportsCurrentTemperature !== undefined && object.supportsCurrentTemperature !== null) {
            message.supportsCurrentTemperature = object.supportsCurrentTemperature;
        } else {
            message.supportsCurrentTemperature = false;
        }
        if (
            object.supportsTwoPointTargetTemperature !== undefined &&
            object.supportsTwoPointTargetTemperature !== null
        ) {
            message.supportsTwoPointTargetTemperature = object.supportsTwoPointTargetTemperature;
        } else {
            message.supportsTwoPointTargetTemperature = false;
        }
        if (object.supportedModes !== undefined && object.supportedModes !== null) {
            for (const e of object.supportedModes) {
                message.supportedModes.push(e);
            }
        }
        if (object.visualMinTemperature !== undefined && object.visualMinTemperature !== null) {
            message.visualMinTemperature = object.visualMinTemperature;
        } else {
            message.visualMinTemperature = 0;
        }
        if (object.visualMaxTemperature !== undefined && object.visualMaxTemperature !== null) {
            message.visualMaxTemperature = object.visualMaxTemperature;
        } else {
            message.visualMaxTemperature = 0;
        }
        if (object.visualTemperatureStep !== undefined && object.visualTemperatureStep !== null) {
            message.visualTemperatureStep = object.visualTemperatureStep;
        } else {
            message.visualTemperatureStep = 0;
        }
        if (object.supportsAway !== undefined && object.supportsAway !== null) {
            message.supportsAway = object.supportsAway;
        } else {
            message.supportsAway = false;
        }
        if (object.supportsAction !== undefined && object.supportsAction !== null) {
            message.supportsAction = object.supportsAction;
        } else {
            message.supportsAction = false;
        }
        if (object.supportedFanModes !== undefined && object.supportedFanModes !== null) {
            for (const e of object.supportedFanModes) {
                message.supportedFanModes.push(e);
            }
        }
        if (object.supportedSwingModes !== undefined && object.supportedSwingModes !== null) {
            for (const e of object.supportedSwingModes) {
                message.supportedSwingModes.push(e);
            }
        }
        return message;
    },
};

const baseClimateStateResponse: object = {
    key: 0,
    mode: 0,
    currentTemperature: 0,
    targetTemperature: 0,
    targetTemperatureLow: 0,
    targetTemperatureHigh: 0,
    away: false,
    action: 0,
    fanMode: 0,
    swingMode: 0,
};

export const ClimateStateResponse = {
    encode(message: ClimateStateResponse, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.mode !== 0) {
            writer.uint32(16).int32(message.mode);
        }
        if (message.currentTemperature !== 0) {
            writer.uint32(29).float(message.currentTemperature);
        }
        if (message.targetTemperature !== 0) {
            writer.uint32(37).float(message.targetTemperature);
        }
        if (message.targetTemperatureLow !== 0) {
            writer.uint32(45).float(message.targetTemperatureLow);
        }
        if (message.targetTemperatureHigh !== 0) {
            writer.uint32(53).float(message.targetTemperatureHigh);
        }
        if (message.away === true) {
            writer.uint32(56).bool(message.away);
        }
        if (message.action !== 0) {
            writer.uint32(64).int32(message.action);
        }
        if (message.fanMode !== 0) {
            writer.uint32(72).int32(message.fanMode);
        }
        if (message.swingMode !== 0) {
            writer.uint32(80).int32(message.swingMode);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ClimateStateResponse {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseClimateStateResponse } as ClimateStateResponse;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.mode = reader.int32() as any;
                    break;
                case 3:
                    message.currentTemperature = reader.float();
                    break;
                case 4:
                    message.targetTemperature = reader.float();
                    break;
                case 5:
                    message.targetTemperatureLow = reader.float();
                    break;
                case 6:
                    message.targetTemperatureHigh = reader.float();
                    break;
                case 7:
                    message.away = reader.bool();
                    break;
                case 8:
                    message.action = reader.int32() as any;
                    break;
                case 9:
                    message.fanMode = reader.int32() as any;
                    break;
                case 10:
                    message.swingMode = reader.int32() as any;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ClimateStateResponse {
        const message = { ...baseClimateStateResponse } as ClimateStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.mode !== undefined && object.mode !== null) {
            message.mode = climateModeFromJSON(object.mode);
        } else {
            message.mode = 0;
        }
        if (object.currentTemperature !== undefined && object.currentTemperature !== null) {
            message.currentTemperature = Number(object.currentTemperature);
        } else {
            message.currentTemperature = 0;
        }
        if (object.targetTemperature !== undefined && object.targetTemperature !== null) {
            message.targetTemperature = Number(object.targetTemperature);
        } else {
            message.targetTemperature = 0;
        }
        if (object.targetTemperatureLow !== undefined && object.targetTemperatureLow !== null) {
            message.targetTemperatureLow = Number(object.targetTemperatureLow);
        } else {
            message.targetTemperatureLow = 0;
        }
        if (object.targetTemperatureHigh !== undefined && object.targetTemperatureHigh !== null) {
            message.targetTemperatureHigh = Number(object.targetTemperatureHigh);
        } else {
            message.targetTemperatureHigh = 0;
        }
        if (object.away !== undefined && object.away !== null) {
            message.away = Boolean(object.away);
        } else {
            message.away = false;
        }
        if (object.action !== undefined && object.action !== null) {
            message.action = climateActionFromJSON(object.action);
        } else {
            message.action = 0;
        }
        if (object.fanMode !== undefined && object.fanMode !== null) {
            message.fanMode = climateFanModeFromJSON(object.fanMode);
        } else {
            message.fanMode = 0;
        }
        if (object.swingMode !== undefined && object.swingMode !== null) {
            message.swingMode = climateSwingModeFromJSON(object.swingMode);
        } else {
            message.swingMode = 0;
        }
        return message;
    },

    toJSON(message: ClimateStateResponse): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.mode !== undefined && (obj.mode = climateModeToJSON(message.mode));
        message.currentTemperature !== undefined && (obj.currentTemperature = message.currentTemperature);
        message.targetTemperature !== undefined && (obj.targetTemperature = message.targetTemperature);
        message.targetTemperatureLow !== undefined && (obj.targetTemperatureLow = message.targetTemperatureLow);
        message.targetTemperatureHigh !== undefined && (obj.targetTemperatureHigh = message.targetTemperatureHigh);
        message.away !== undefined && (obj.away = message.away);
        message.action !== undefined && (obj.action = climateActionToJSON(message.action));
        message.fanMode !== undefined && (obj.fanMode = climateFanModeToJSON(message.fanMode));
        message.swingMode !== undefined && (obj.swingMode = climateSwingModeToJSON(message.swingMode));
        return obj;
    },

    fromPartial(object: DeepPartial<ClimateStateResponse>): ClimateStateResponse {
        const message = { ...baseClimateStateResponse } as ClimateStateResponse;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.mode !== undefined && object.mode !== null) {
            message.mode = object.mode;
        } else {
            message.mode = 0;
        }
        if (object.currentTemperature !== undefined && object.currentTemperature !== null) {
            message.currentTemperature = object.currentTemperature;
        } else {
            message.currentTemperature = 0;
        }
        if (object.targetTemperature !== undefined && object.targetTemperature !== null) {
            message.targetTemperature = object.targetTemperature;
        } else {
            message.targetTemperature = 0;
        }
        if (object.targetTemperatureLow !== undefined && object.targetTemperatureLow !== null) {
            message.targetTemperatureLow = object.targetTemperatureLow;
        } else {
            message.targetTemperatureLow = 0;
        }
        if (object.targetTemperatureHigh !== undefined && object.targetTemperatureHigh !== null) {
            message.targetTemperatureHigh = object.targetTemperatureHigh;
        } else {
            message.targetTemperatureHigh = 0;
        }
        if (object.away !== undefined && object.away !== null) {
            message.away = object.away;
        } else {
            message.away = false;
        }
        if (object.action !== undefined && object.action !== null) {
            message.action = object.action;
        } else {
            message.action = 0;
        }
        if (object.fanMode !== undefined && object.fanMode !== null) {
            message.fanMode = object.fanMode;
        } else {
            message.fanMode = 0;
        }
        if (object.swingMode !== undefined && object.swingMode !== null) {
            message.swingMode = object.swingMode;
        } else {
            message.swingMode = 0;
        }
        return message;
    },
};

const baseClimateCommandRequest: object = {
    key: 0,
    hasMode: false,
    mode: 0,
    hasTargetTemperature: false,
    targetTemperature: 0,
    hasTargetTemperatureLow: false,
    targetTemperatureLow: 0,
    hasTargetTemperatureHigh: false,
    targetTemperatureHigh: 0,
    hasAway: false,
    away: false,
    hasFanMode: false,
    fanMode: 0,
    hasSwingMode: false,
    swingMode: 0,
};

export const ClimateCommandRequest = {
    encode(message: ClimateCommandRequest, writer: Writer = Writer.create()): Writer {
        if (message.key !== 0) {
            writer.uint32(13).fixed32(message.key);
        }
        if (message.hasMode === true) {
            writer.uint32(16).bool(message.hasMode);
        }
        if (message.mode !== 0) {
            writer.uint32(24).int32(message.mode);
        }
        if (message.hasTargetTemperature === true) {
            writer.uint32(32).bool(message.hasTargetTemperature);
        }
        if (message.targetTemperature !== 0) {
            writer.uint32(45).float(message.targetTemperature);
        }
        if (message.hasTargetTemperatureLow === true) {
            writer.uint32(48).bool(message.hasTargetTemperatureLow);
        }
        if (message.targetTemperatureLow !== 0) {
            writer.uint32(61).float(message.targetTemperatureLow);
        }
        if (message.hasTargetTemperatureHigh === true) {
            writer.uint32(64).bool(message.hasTargetTemperatureHigh);
        }
        if (message.targetTemperatureHigh !== 0) {
            writer.uint32(77).float(message.targetTemperatureHigh);
        }
        if (message.hasAway === true) {
            writer.uint32(80).bool(message.hasAway);
        }
        if (message.away === true) {
            writer.uint32(88).bool(message.away);
        }
        if (message.hasFanMode === true) {
            writer.uint32(96).bool(message.hasFanMode);
        }
        if (message.fanMode !== 0) {
            writer.uint32(104).int32(message.fanMode);
        }
        if (message.hasSwingMode === true) {
            writer.uint32(112).bool(message.hasSwingMode);
        }
        if (message.swingMode !== 0) {
            writer.uint32(120).int32(message.swingMode);
        }
        return writer;
    },

    decode(input: Reader | Uint8Array, length?: number): ClimateCommandRequest {
        const reader = input instanceof Uint8Array ? new Reader(input) : input;
        let end = length === undefined ? reader.len : reader.pos + length;
        const message = { ...baseClimateCommandRequest } as ClimateCommandRequest;
        while (reader.pos < end) {
            const tag = reader.uint32();
            switch (tag >>> 3) {
                case 1:
                    message.key = reader.fixed32();
                    break;
                case 2:
                    message.hasMode = reader.bool();
                    break;
                case 3:
                    message.mode = reader.int32() as any;
                    break;
                case 4:
                    message.hasTargetTemperature = reader.bool();
                    break;
                case 5:
                    message.targetTemperature = reader.float();
                    break;
                case 6:
                    message.hasTargetTemperatureLow = reader.bool();
                    break;
                case 7:
                    message.targetTemperatureLow = reader.float();
                    break;
                case 8:
                    message.hasTargetTemperatureHigh = reader.bool();
                    break;
                case 9:
                    message.targetTemperatureHigh = reader.float();
                    break;
                case 10:
                    message.hasAway = reader.bool();
                    break;
                case 11:
                    message.away = reader.bool();
                    break;
                case 12:
                    message.hasFanMode = reader.bool();
                    break;
                case 13:
                    message.fanMode = reader.int32() as any;
                    break;
                case 14:
                    message.hasSwingMode = reader.bool();
                    break;
                case 15:
                    message.swingMode = reader.int32() as any;
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
            }
        }
        return message;
    },

    fromJSON(object: any): ClimateCommandRequest {
        const message = { ...baseClimateCommandRequest } as ClimateCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = Number(object.key);
        } else {
            message.key = 0;
        }
        if (object.hasMode !== undefined && object.hasMode !== null) {
            message.hasMode = Boolean(object.hasMode);
        } else {
            message.hasMode = false;
        }
        if (object.mode !== undefined && object.mode !== null) {
            message.mode = climateModeFromJSON(object.mode);
        } else {
            message.mode = 0;
        }
        if (object.hasTargetTemperature !== undefined && object.hasTargetTemperature !== null) {
            message.hasTargetTemperature = Boolean(object.hasTargetTemperature);
        } else {
            message.hasTargetTemperature = false;
        }
        if (object.targetTemperature !== undefined && object.targetTemperature !== null) {
            message.targetTemperature = Number(object.targetTemperature);
        } else {
            message.targetTemperature = 0;
        }
        if (object.hasTargetTemperatureLow !== undefined && object.hasTargetTemperatureLow !== null) {
            message.hasTargetTemperatureLow = Boolean(object.hasTargetTemperatureLow);
        } else {
            message.hasTargetTemperatureLow = false;
        }
        if (object.targetTemperatureLow !== undefined && object.targetTemperatureLow !== null) {
            message.targetTemperatureLow = Number(object.targetTemperatureLow);
        } else {
            message.targetTemperatureLow = 0;
        }
        if (object.hasTargetTemperatureHigh !== undefined && object.hasTargetTemperatureHigh !== null) {
            message.hasTargetTemperatureHigh = Boolean(object.hasTargetTemperatureHigh);
        } else {
            message.hasTargetTemperatureHigh = false;
        }
        if (object.targetTemperatureHigh !== undefined && object.targetTemperatureHigh !== null) {
            message.targetTemperatureHigh = Number(object.targetTemperatureHigh);
        } else {
            message.targetTemperatureHigh = 0;
        }
        if (object.hasAway !== undefined && object.hasAway !== null) {
            message.hasAway = Boolean(object.hasAway);
        } else {
            message.hasAway = false;
        }
        if (object.away !== undefined && object.away !== null) {
            message.away = Boolean(object.away);
        } else {
            message.away = false;
        }
        if (object.hasFanMode !== undefined && object.hasFanMode !== null) {
            message.hasFanMode = Boolean(object.hasFanMode);
        } else {
            message.hasFanMode = false;
        }
        if (object.fanMode !== undefined && object.fanMode !== null) {
            message.fanMode = climateFanModeFromJSON(object.fanMode);
        } else {
            message.fanMode = 0;
        }
        if (object.hasSwingMode !== undefined && object.hasSwingMode !== null) {
            message.hasSwingMode = Boolean(object.hasSwingMode);
        } else {
            message.hasSwingMode = false;
        }
        if (object.swingMode !== undefined && object.swingMode !== null) {
            message.swingMode = climateSwingModeFromJSON(object.swingMode);
        } else {
            message.swingMode = 0;
        }
        return message;
    },

    toJSON(message: ClimateCommandRequest): unknown {
        const obj: any = {};
        message.key !== undefined && (obj.key = message.key);
        message.hasMode !== undefined && (obj.hasMode = message.hasMode);
        message.mode !== undefined && (obj.mode = climateModeToJSON(message.mode));
        message.hasTargetTemperature !== undefined && (obj.hasTargetTemperature = message.hasTargetTemperature);
        message.targetTemperature !== undefined && (obj.targetTemperature = message.targetTemperature);
        message.hasTargetTemperatureLow !== undefined &&
            (obj.hasTargetTemperatureLow = message.hasTargetTemperatureLow);
        message.targetTemperatureLow !== undefined && (obj.targetTemperatureLow = message.targetTemperatureLow);
        message.hasTargetTemperatureHigh !== undefined &&
            (obj.hasTargetTemperatureHigh = message.hasTargetTemperatureHigh);
        message.targetTemperatureHigh !== undefined && (obj.targetTemperatureHigh = message.targetTemperatureHigh);
        message.hasAway !== undefined && (obj.hasAway = message.hasAway);
        message.away !== undefined && (obj.away = message.away);
        message.hasFanMode !== undefined && (obj.hasFanMode = message.hasFanMode);
        message.fanMode !== undefined && (obj.fanMode = climateFanModeToJSON(message.fanMode));
        message.hasSwingMode !== undefined && (obj.hasSwingMode = message.hasSwingMode);
        message.swingMode !== undefined && (obj.swingMode = climateSwingModeToJSON(message.swingMode));
        return obj;
    },

    fromPartial(object: DeepPartial<ClimateCommandRequest>): ClimateCommandRequest {
        const message = { ...baseClimateCommandRequest } as ClimateCommandRequest;
        if (object.key !== undefined && object.key !== null) {
            message.key = object.key;
        } else {
            message.key = 0;
        }
        if (object.hasMode !== undefined && object.hasMode !== null) {
            message.hasMode = object.hasMode;
        } else {
            message.hasMode = false;
        }
        if (object.mode !== undefined && object.mode !== null) {
            message.mode = object.mode;
        } else {
            message.mode = 0;
        }
        if (object.hasTargetTemperature !== undefined && object.hasTargetTemperature !== null) {
            message.hasTargetTemperature = object.hasTargetTemperature;
        } else {
            message.hasTargetTemperature = false;
        }
        if (object.targetTemperature !== undefined && object.targetTemperature !== null) {
            message.targetTemperature = object.targetTemperature;
        } else {
            message.targetTemperature = 0;
        }
        if (object.hasTargetTemperatureLow !== undefined && object.hasTargetTemperatureLow !== null) {
            message.hasTargetTemperatureLow = object.hasTargetTemperatureLow;
        } else {
            message.hasTargetTemperatureLow = false;
        }
        if (object.targetTemperatureLow !== undefined && object.targetTemperatureLow !== null) {
            message.targetTemperatureLow = object.targetTemperatureLow;
        } else {
            message.targetTemperatureLow = 0;
        }
        if (object.hasTargetTemperatureHigh !== undefined && object.hasTargetTemperatureHigh !== null) {
            message.hasTargetTemperatureHigh = object.hasTargetTemperatureHigh;
        } else {
            message.hasTargetTemperatureHigh = false;
        }
        if (object.targetTemperatureHigh !== undefined && object.targetTemperatureHigh !== null) {
            message.targetTemperatureHigh = object.targetTemperatureHigh;
        } else {
            message.targetTemperatureHigh = 0;
        }
        if (object.hasAway !== undefined && object.hasAway !== null) {
            message.hasAway = object.hasAway;
        } else {
            message.hasAway = false;
        }
        if (object.away !== undefined && object.away !== null) {
            message.away = object.away;
        } else {
            message.away = false;
        }
        if (object.hasFanMode !== undefined && object.hasFanMode !== null) {
            message.hasFanMode = object.hasFanMode;
        } else {
            message.hasFanMode = false;
        }
        if (object.fanMode !== undefined && object.fanMode !== null) {
            message.fanMode = object.fanMode;
        } else {
            message.fanMode = 0;
        }
        if (object.hasSwingMode !== undefined && object.hasSwingMode !== null) {
            message.hasSwingMode = object.hasSwingMode;
        } else {
            message.hasSwingMode = false;
        }
        if (object.swingMode !== undefined && object.swingMode !== null) {
            message.swingMode = object.swingMode;
        } else {
            message.swingMode = 0;
        }
        return message;
    },
};

export interface APIConnection {
    hello(request: HelloRequest): Promise<HelloResponse>;
    connect(request: ConnectRequest): Promise<ConnectResponse>;
    disconnect(request: DisconnectRequest): Promise<DisconnectResponse>;
    ping(request: PingRequest): Promise<PingResponse>;
    device_info(request: DeviceInfoRequest): Promise<DeviceInfoResponse>;
    list_entities(request: ListEntitiesRequest): Promise<voidMessage>;
    subscribe_states(request: SubscribeStatesRequest): Promise<voidMessage>;
    subscribe_logs(request: SubscribeLogsRequest): Promise<voidMessage>;
    subscribe_homeassistant_services(request: SubscribeHomeassistantServicesRequest): Promise<voidMessage>;
    subscribe_home_assistant_states(request: SubscribeHomeAssistantStatesRequest): Promise<voidMessage>;
    get_time(request: GetTimeRequest): Promise<GetTimeResponse>;
    execute_service(request: ExecuteServiceRequest): Promise<voidMessage>;
    cover_command(request: CoverCommandRequest): Promise<voidMessage>;
    fan_command(request: FanCommandRequest): Promise<voidMessage>;
    light_command(request: LightCommandRequest): Promise<voidMessage>;
    switch_command(request: SwitchCommandRequest): Promise<voidMessage>;
    camera_image(request: CameraImageRequest): Promise<voidMessage>;
    climate_command(request: ClimateCommandRequest): Promise<voidMessage>;
}

export class APIConnectionClientImpl implements APIConnection {
    private readonly rpc: Rpc;
    constructor(rpc: Rpc) {
        this.rpc = rpc;
    }
    hello(request: HelloRequest): Promise<HelloResponse> {
        const data = HelloRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'hello', data);
        return promise.then((data) => HelloResponse.decode(new Reader(data)));
    }

    connect(request: ConnectRequest): Promise<ConnectResponse> {
        const data = ConnectRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'connect', data);
        return promise.then((data) => ConnectResponse.decode(new Reader(data)));
    }

    disconnect(request: DisconnectRequest): Promise<DisconnectResponse> {
        const data = DisconnectRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'disconnect', data);
        return promise.then((data) => DisconnectResponse.decode(new Reader(data)));
    }

    ping(request: PingRequest): Promise<PingResponse> {
        const data = PingRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'ping', data);
        return promise.then((data) => PingResponse.decode(new Reader(data)));
    }

    device_info(request: DeviceInfoRequest): Promise<DeviceInfoResponse> {
        const data = DeviceInfoRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'device_info', data);
        return promise.then((data) => DeviceInfoResponse.decode(new Reader(data)));
    }

    list_entities(request: ListEntitiesRequest): Promise<voidMessage> {
        const data = ListEntitiesRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'list_entities', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    subscribe_states(request: SubscribeStatesRequest): Promise<voidMessage> {
        const data = SubscribeStatesRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'subscribe_states', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    subscribe_logs(request: SubscribeLogsRequest): Promise<voidMessage> {
        const data = SubscribeLogsRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'subscribe_logs', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    subscribe_homeassistant_services(request: SubscribeHomeassistantServicesRequest): Promise<voidMessage> {
        const data = SubscribeHomeassistantServicesRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'subscribe_homeassistant_services', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    subscribe_home_assistant_states(request: SubscribeHomeAssistantStatesRequest): Promise<voidMessage> {
        const data = SubscribeHomeAssistantStatesRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'subscribe_home_assistant_states', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    get_time(request: GetTimeRequest): Promise<GetTimeResponse> {
        const data = GetTimeRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'get_time', data);
        return promise.then((data) => GetTimeResponse.decode(new Reader(data)));
    }

    execute_service(request: ExecuteServiceRequest): Promise<voidMessage> {
        const data = ExecuteServiceRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'execute_service', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    cover_command(request: CoverCommandRequest): Promise<voidMessage> {
        const data = CoverCommandRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'cover_command', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    fan_command(request: FanCommandRequest): Promise<voidMessage> {
        const data = FanCommandRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'fan_command', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    light_command(request: LightCommandRequest): Promise<voidMessage> {
        const data = LightCommandRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'light_command', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    switch_command(request: SwitchCommandRequest): Promise<voidMessage> {
        const data = SwitchCommandRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'switch_command', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    camera_image(request: CameraImageRequest): Promise<voidMessage> {
        const data = CameraImageRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'camera_image', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }

    climate_command(request: ClimateCommandRequest): Promise<voidMessage> {
        const data = ClimateCommandRequest.encode(request).finish();
        const promise = this.rpc.request('.APIConnection', 'climate_command', data);
        return promise.then((data) => voidMessage.decode(new Reader(data)));
    }
}

interface Rpc {
    request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

declare var self: any | undefined;
declare var window: any | undefined;
var globalThis: any = (() => {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    throw 'Unable to locate global object';
})();

const atob: (b64: string) => string =
    globalThis.atob || ((b64) => globalThis.Buffer.from(b64, 'base64').toString('binary'));
function bytesFromBase64(b64: string): Uint8Array {
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
        arr[i] = bin.charCodeAt(i);
    }
    return arr;
}

const btoa: (bin: string) => string =
    globalThis.btoa || ((bin) => globalThis.Buffer.from(bin, 'binary').toString('base64'));
function base64FromBytes(arr: Uint8Array): string {
    const bin: string[] = [];
    for (let i = 0; i < arr.byteLength; ++i) {
        bin.push(String.fromCharCode(arr[i]));
    }
    return btoa(bin.join(''));
}

type Builtin = Date | Function | Uint8Array | string | number | undefined;
export type DeepPartial<T> = T extends Builtin
    ? T
    : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T extends {}
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : Partial<T>;
