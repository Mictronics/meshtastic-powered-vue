import type { Types } from "@meshtastic/core";

// Config type discriminators
export type ValidConfigType =
    | "device"
    | "position"
    | "power"
    | "network"
    | "display"
    | "lora"
    | "bluetooth"
    | "security";

export type ValidModuleConfigType =
    | "mqtt"
    | "serial"
    | "externalNotification"
    | "storeForward"
    | "rangeTest"
    | "telemetry"
    | "cannedMessage"
    | "audio"
    | "neighborInfo"
    | "ambientLighting"
    | "detectionSensor"
    | "paxcounter";

// Admin message types that can be queued
export type ValidAdminMessageType = "setFixedPosition" | "other";

// Unified config change key type
export type ConfigChangeKey =
    | { type: "config"; variant: ValidConfigType }
    | { type: "moduleConfig"; variant: ValidModuleConfigType }
    | { type: "channel"; index: Types.ChannelNumber }
    | { type: "user" }
    | { type: "adminMessage"; variant: ValidAdminMessageType; id: string };

// Serialized key for Map storage
export type ConfigChangeKeyString = string;

// Registry entry
export interface ChangeEntry {
    key: ConfigChangeKey;
    value: unknown;
    timestamp: number;
    originalValue?: unknown;
}

// The unified registry
export interface ChangeRegistry {
    changes: { [key: ConfigChangeKeyString]: ChangeEntry };
}

/**
 * Convert structured key to string for Map lookup
 */
export const serializeKey = (key: ConfigChangeKey): ConfigChangeKeyString => {
    switch (key.type) {
        case "config":
            return `config:${key.variant}`;
        case "moduleConfig":
            return `moduleConfig:${key.variant}`;
        case "channel":
            return `channel:${key.index}`;
        case "user":
            return "user";
        case "adminMessage":
            return `adminMessage:${key.variant}:${key.id}`;
    }
}

/**
 * Reverse operation for type-safe retrieval
 */
export const deserializeKey = (keyStr: ConfigChangeKeyString): ConfigChangeKey => {
    const parts = keyStr.split(":");
    const type = parts[0];

    switch (type) {
        case "config":
            return { type: "config", variant: parts[1] as ValidConfigType };
        case "moduleConfig":
            return {
                type: "moduleConfig",
                variant: parts[1] as ValidModuleConfigType,
            };
        case "channel":
            return {
                type: "channel",
                index: Number(parts[1]) as Types.ChannelNumber,
            };
        case "user":
            return { type: "user" };
        case "adminMessage":
            return {
                type: "adminMessage",
                variant: parts[1] as ValidAdminMessageType,
                id: parts[2] ?? "",
            };
        default:
            throw new Error(`Unknown key type: ${type}`);
    }
}

/**
 * Create an empty change registry
 */
export const createChangeRegistry = (): ChangeRegistry => {
    return {
        changes: {},
    };
}

/**
 * Check if a config variant has changes
 */
export const hasConfigChange = (
    registry: ChangeRegistry,
    variant: ValidConfigType,
): boolean => {
    return registry.changes.hasOwnProperty(serializeKey({ type: "config", variant }));
}

/**
 * Check if a module config variant has changes
 */
export const hasModuleConfigChange = (
    registry: ChangeRegistry,
    variant: ValidModuleConfigType,
): boolean => {
    return registry.changes.hasOwnProperty(serializeKey({ type: "moduleConfig", variant }));
}

/**
 * Check if a channel has changes
 */
export const hasChannelChange = (
    registry: ChangeRegistry,
    index: Types.ChannelNumber,
): boolean => {
    return registry.changes.hasOwnProperty(serializeKey({ type: "channel", index }));
}

/**
 * Check if user config has changes
 */
export const hasUserChange = (registry: ChangeRegistry): boolean => {
    return registry.changes.hasOwnProperty(serializeKey({ type: "user" }));
}

/**
 * Get count of config changes
 */
export const getConfigChangeCount = (registry: ChangeRegistry): number => {
    let count = 0;
    for (const keyStr of Object.keys(registry.changes)) {
        const key = deserializeKey(keyStr);
        if (key.type === "config") {
            count++;
        }
    }
    return count;
}

/**
 * Get count of module config changes
 */
export const getModuleConfigChangeCount = (registry: ChangeRegistry): number => {
    let count = 0;
    for (const keyStr of Object.keys(registry.changes)) {
        const key = deserializeKey(keyStr);
        if (key.type === "moduleConfig") {
            count++;
        }
    }
    return count;
}

/**
 * Get count of channel changes
 */
export const getChannelChangeCount = (registry: ChangeRegistry): number => {
    let count = 0;
    for (const keyStr of Object.keys(registry.changes)) {
        const key = deserializeKey(keyStr);
        if (key.type === "channel") {
            count++;
        }
    }
    return count;
}

/**
 * Get all config changes as an array
 */
export const getAllConfigChanges = (registry: ChangeRegistry): ChangeEntry[] => {
    const changes: ChangeEntry[] = [];
    for (const entry of Object.values(registry.changes)) {
        if (entry.key.type === "config") {
            changes.push(entry);
        }
    }
    return changes;
}

/**
 * Get all module config changes as an array
 */
export const getAllModuleConfigChanges = (
    registry: ChangeRegistry,
): ChangeEntry[] => {
    const changes: ChangeEntry[] = [];
    for (const entry of Object.values(registry.changes)) {
        if (entry.key.type === "moduleConfig") {
            changes.push(entry);
        }
    }
    return changes;
}

/**
 * Get all channel changes as an array
 */
export const getAllChannelChanges = (registry: ChangeRegistry): ChangeEntry[] => {
    const changes: ChangeEntry[] = [];
    for (const entry of Object.values(registry.changes)) {
        if (entry.key.type === "channel") {
            changes.push(entry);
        }
    }
    return changes;
}

/**
 * Get all admin message changes as an array
 */
export const getAllAdminMessages = (registry: ChangeRegistry): ChangeEntry[] => {
    const changes: ChangeEntry[] = [];
    for (const entry of Object.values(registry.changes)) {
        if (entry.key.type === "adminMessage") {
            changes.push(entry);
        }
    }
    return changes;
}

/**
 * Get count of admin message changes
 */
export const getAdminMessageChangeCount = (registry: ChangeRegistry): number => {
    let count = 0;
    for (const keyStr of Object.keys(registry.changes)) {
        const key = deserializeKey(keyStr);
        if (key.type === "adminMessage") {
            count++;
        }
    }
    return count;
}
