import { isReactive, toRaw } from "vue";

export const purgeUncloneableProperties = (
    target: unknown
): void => {
    if (typeof target !== 'object' || target === null) {
        return;
    }
    const record = target as Record<string, unknown>;
    for (const key of Object.keys(record)) {
        const value = record[key];
        // If this property itself is uncloneable, inspect deeper
        try {
            //console.log(value)
            structuredClone(value);
        } catch {
            if (isReactive(value)) {
                // Found the uncloneable property, convert to raw object
                record[key] = toRaw(value);
            } else {
                purgeUncloneableProperties(value);
            }
        }
        // Recurse into cloneable objects
        if (typeof value === 'object' && value !== null) {
            purgeUncloneableProperties(value);
        }
    }
}