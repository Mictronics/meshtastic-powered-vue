const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isUint8Array = (v: unknown): v is Uint8Array => {
  return v instanceof Uint8Array;
}

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

export const useDeepCompareConfig = (
  a: unknown,
  b: unknown,
  allowUndefined = false,
): boolean => {
  if (a === b) {
    return true;
  }

  if (typeof a !== "object" || typeof b !== "object") {
    return a === b;
  }

  if (isUint8Array(a) || isUint8Array(b)) {
    return isUint8Array(a) && isUint8Array(b) && bytesEqual(a, b);
  }

  if (allowUndefined && (a === undefined || b === undefined)) {
    return true;
  }

  if (a === null || b === null) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (!allowUndefined && a.length !== b.length) {
      return false;
    }

    const maxLength = allowUndefined
      ? Math.max(a.length, b.length)
      : a.length;

    for (let i = 0; i < maxLength; i++) {
      if (!useDeepCompareConfig(a[i], b[i], allowUndefined)) {
        return false;
      }
    }
    return true;
  }

  if (isObject(a) && isObject(b)) {
    const allKeys = new Set([
      ...Object.keys(a),
      ...Object.keys(b),
    ]);

    for (const key of allKeys) {
      if (key === "$typeName") {
        continue;
      }

      if (
        !useDeepCompareConfig(
          a[key],
          b[key],
          allowUndefined
        )
      ) {
        return false;
      }
    }
    return true;
  }
  return false;
}
