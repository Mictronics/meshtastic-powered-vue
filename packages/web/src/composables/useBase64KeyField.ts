import { ref, watch } from 'vue';
import { fromByteArray, toByteArray } from 'base64-js';

export const useBase64KeyField = (model: { value?: Uint8Array }) => {
    const input = ref('');
    watch(
        () => model.value,
        (val) => {
            input.value = fromByteArray(val ?? new Uint8Array(0));
        },
        { immediate: true }
    );
    watch(input, (val) => {
        try {
            model.value = val ? toByteArray(val) : new Uint8Array(0);
        } catch {
        }
    });
    return input;
}
