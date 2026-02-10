export function useEnumOptions<
    E extends Record<string, string | number>
>(enumObject: E) {
    return Object.entries(enumObject)
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => ({
            label: key.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: value as E[keyof E],
        }))
}
