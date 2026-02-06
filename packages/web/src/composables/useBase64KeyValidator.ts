import { helpers } from '@vuelidate/validators';
import { toByteArray } from 'base64-js';
import type { Ref } from 'vue';

export type KeySize = 0 | 1 | 16 | 32;

export const tryDecodeBase64 = (value: string): Uint8Array | null => {
    try {
        return toByteArray(value);
    } catch {
        return null;
    }
};

export function useBase64KeyRules(
    size: Ref<KeySize>,
    label = 'Key'
) {
    return {
        emptyWhenZeroLength: helpers.withMessage(
            `${label} must be empty when key length is set to Empty.`,
            (value: string) => {
                return size.value === 0 ? value.length === 0 : true;
            }
        ),

        validBase64: helpers.withMessage(
            `${label} is not valid Base64.`,
            (value: string) => {
                if (!value || size.value === 0) return true;
                return tryDecodeBase64(value) !== null;
            }
        ),

        decodedLengthMatches: helpers.withMessage(
            `${label} does not match selected key length.`,
            (value: string) => {
                if (!value || size.value === 0) return true;

                const decoded = tryDecodeBase64(value);
                if (!decoded) return true;

                return decoded.length === size.value;
            }
        ),
    };
}
