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
import { useFaviconBadge } from '@/composables/useFaviconBadge';
import { useDeviceStore } from './composables/stores/device/useDeviceStore';

const store = useDeviceStore();
const { dialogRef } = useConfirm();
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);

useFaviconBadge(() => store.device.value?.getAllUnreadCount() ?? 0);

onMounted(() => {
  dialogRef.value = confirmDialogRef.value;
});
</script>
