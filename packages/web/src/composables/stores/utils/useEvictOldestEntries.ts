/**
 * Evicts the oldest entries from an array or Map to ensure its size does not exceed maxSize.
 * Oldest entries are at the start of the array or the earliest inserted keys in the Map.
 */
import type { MessageLogMap } from "@/composables/stores/message/types";
import { Protobuf, Types } from "@meshtastic/core";

export function useEvictOldestEntries<T>(arr: T[], maxSize: number): void;
export function useEvictOldestEntries<K, V>(map: Map<K, V>, maxSize: number): void;

export function useEvictOldestEntries<T, K, V>(
    collection: T[] | Map<K, V>,
    maxSize: number,
): void {
    if (Array.isArray(collection)) {
        // Remove oldest elements from the start
        while (collection.length > maxSize) {
            collection.shift();
        }
    } else if (collection instanceof Map) {
        // Remove oldest entries based on insertion order
        while (collection.size > maxSize) {
            const oldestKey = collection.keys().next().value;
            if (oldestKey !== undefined) {
                collection.delete(oldestKey);
            } else {
                break;
            }
        }
    } else {
        throw new Error("Collection must be an Array or a Map");
    }
}

export function useEvictOldestMessages(obj: MessageLogMap, maxSize: number): void {
    const entries = Object.entries(obj);

    if (entries.length <= maxSize) return; // nothing to remove

    // Sort by date ascending → oldest first
    entries.sort((a, b) => a[1].date - b[1].date);

    // Determine how many oldest messages to remove
    const excess = entries.length - maxSize;

    for (let i = 0; i < excess; i++) {
        const entry = entries[i];
        if (entry) {
            const keyToDelete = entry[0];
            delete obj[keyToDelete];
        }
    }
}

type DeviceTraceRoutes = { [key: string]: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[] };
export function useEvictOldestTraceRoutes(obj: DeviceTraceRoutes, maxSize: number): void {
    for (const key in obj) {
        const arr = obj[key];
        if (!arr || arr.length <= maxSize) continue;

        // Sort array by timestamp ascending → oldest first
        arr.sort((a, b) => (a.rxTime as Date).getTime() - (b.rxTime as Date).getTime());

        // Remove excess oldest entries
        const excess = arr.length - maxSize;
        arr.splice(0, excess);
    }
}