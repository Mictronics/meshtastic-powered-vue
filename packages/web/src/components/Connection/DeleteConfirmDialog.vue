<template>
  <ConfirmDialog group="headless" pt:mask:class="backdrop-blur-sm">
    <template #container="{ message, acceptCallback, rejectCallback }">
      <div class="flex flex-col items-center p-8 bg-surface-0 dark:bg-surface-900 rounded">
        <div
          class="rounded-full confirm-icon inline-flex justify-center items-center h-24 w-24 -mt-20"
        >
          <IconShieldQuestionMark :size="64" />
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
import { useConfirm } from 'primevue/useconfirm';

const emit = defineEmits<{
  (e: 'eventOnConfirmDelete'): void;
}>();

const confirm = useConfirm();
interface ConfirmOptions {
  header?: string;
  message?: string;
}

const open = (options?: ConfirmOptions) => {
  confirm.require({
    group: 'headless',
    header: options?.header ?? 'Are you sure?',
    message: options?.message ?? 'This will delete all device data linked to this connection.',
    accept: () => emit('eventOnConfirmDelete'),
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
