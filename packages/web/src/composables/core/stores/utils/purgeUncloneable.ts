function isCloneable(value: unknown): boolean {
    try {
        structuredClone(value);
        return true;
    } catch {
        return false;
    }
}

export function purgeUncloneableProperties(
    target: unknown
): void {
    if (typeof target !== 'object' || target === null) {
        return;
    }
    const record = target as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        const value = record[key];
        // If this property itself is uncloneable, delete it
        if (!isCloneable(value)) {
            delete record[key];
            continue;
        }
        // Recurse into cloneable objects
        if (typeof value === 'object' && value !== null) {
            purgeUncloneableProperties(value);
        }
    }
}