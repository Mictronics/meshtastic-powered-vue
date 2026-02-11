export function useEvictOldestEntries<T>(arr: T[], maxSize: number): void;
export function useEvictOldestEntries<V>(obj: Record<string, V>, maxSize: number): void;

export function useEvictOldestEntries(
    collection: unknown[] | Record<string, unknown>,
    maxSize: number,
): void {
    if (Array.isArray(collection)) {
        while (collection.length > maxSize) {
            collection.shift();
        }
    } else if (collection && typeof collection === 'object') {
        const keys = Object.keys(collection);
        const excess = Math.max(0, keys.length - maxSize);

        for (let i = 0; i < excess; i++) {
            delete collection[keys[i]];
        }
    }
}
