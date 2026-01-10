export function useEvictOldestEntries<T>(arr: T[], maxSize: number): void;
export function useEvictOldestEntries<K, V>(obj: { [K: string]: V }, maxSize: number): void;

export function useEvictOldestEntries<T, K, V>(
    collection: T[] | { [K: string]: V },
    maxSize: number,
): void {
    if (Array.isArray(collection)) {
        // Trim array from the front (assuming oldest entries are at the start)
        while (collection.length > maxSize) {
            collection.shift();
        }
    } else if (typeof collection === 'object') {
        // Trim map by insertion order
        while (Object().keys(collection).length > maxSize) {
            const firstKey = Object().keys(collection).next().value;
            if (firstKey !== undefined) {
                delete collection.firstKey;
            } else {
                break;
            }
        }
    }
}
