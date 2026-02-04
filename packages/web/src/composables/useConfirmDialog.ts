import { ref } from 'vue';
import { createSharedComposable } from '@vueuse/core';

type ConfirmOptions = {
    header: string;
    message: string;
    acceptLabel?: string;
    cancelLabel?: string;
};

const dialogRef = ref<any>(null);

export const useConfirm = createSharedComposable(() => {
    const open = (options: ConfirmOptions) => {
        return dialogRef.value?.open(options);
    };

    return { open, dialogRef };
});
