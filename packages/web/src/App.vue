<template>
  <Toast position="bottom-right" />
  <ConfirmDialog ref="confirmDialogRef" />
  <RouterView />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { RouterView } from 'vue-router';
import { useConfirm } from './composables/useConfirmDialog';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const { dialogRef } = useConfirm();
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);

onMounted(() => {
  dialogRef.value = confirmDialogRef.value;
});
</script>
