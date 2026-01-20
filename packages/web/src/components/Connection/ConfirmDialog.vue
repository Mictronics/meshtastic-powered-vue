<template>
  <ConfirmDialog
    group="headless"
    :transition="transitionName"
    pt:mask:class="backdrop-blur-sm"
    pt:root:class="dialogRootClass"
  >
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="flex flex-col items-center p-8 bg-surface-0 dark:bg-surface-900 rounded">
        <div
          class="rounded-full confirm-icon inline-flex justify-center items-center h-24 w-24 -mt-20"
        >
          <ShieldQuestionMark :size="64" />
        </div>
        <span class="font-bold text-2xl block mb-2 mt-6">{{ message.header }}</span>
        <p class="mb-0">{{ message.message }}</p>
        <div class="flex items-center gap-2 mt-6">
          <Button label="Delete" severity="danger" @click="acceptCallback"></Button>
          <Button
            label="Cancel"
            severity="secondary"
            variant="outlined"
            @click="rejectCallback"
          ></Button>
        </div>
      </div>
    </template>
  </ConfirmDialog>
</template>

<script setup lang="ts">
import { ShieldQuestionMark } from 'lucide-vue-next';
import { useConfirm } from 'primevue/useconfirm';

interface ConfirmOptions {
  header: string;
  message: string;
  acceptLabel?: string;
  cancelLabel?: string;
}

const confirm = useConfirm();
const transitionName = 'scale';
const open = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    confirm.require({
      group: 'headless',
      header: options.header,
      message: options.message,
      acceptLabel: options.acceptLabel,
      rejectLabel: options.cancelLabel,
      accept: () => resolve(true),
      reject: () => resolve(false),
    });
  });
};

defineExpose({ open });
</script>

<style scoped lang="css">
.confirm-icon {
  background: var(--p-button-danger-background);
  color: var(--p-button-danger-color);
}
</style>
