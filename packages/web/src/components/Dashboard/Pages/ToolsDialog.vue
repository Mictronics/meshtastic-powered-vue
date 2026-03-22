<template>
  <PanelMenu :model="toolsPanelItems" class="w-full gap-1!" pt:panel:class="dashboard-panelmenu">
    <template #item="{ item }">
      <a class="flex items-center cursor-pointer group">
        <component :is="item.myIcon" />
        <span class="ml-2">{{ item.label }}</span>
      </a>
    </template>
  </PanelMenu>
  <Dialog v-model:visible="visibleQRDialog" header="Channel QR Code">
    <QRDialog />
  </Dialog>
  <input ref="fileInputRef" type="file" accept=".zip" class="hidden" @change="handleRestoreFile" />
</template>

<script setup lang="ts">
import {
  QrCode,
  HardDriveDownload,
  RefreshCw,
  PowerOff,
  Trash,
  Factory,
  Eraser,
  Archive,
  ArchiveRestore,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import type { FunctionalComponent } from 'vue';
import type { LucideProps } from 'lucide-vue-next';
import QRDialog from './QRDialog.vue';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/stores/message/useMessageStore';
import { useIndexedDB } from '@/composables/stores/indexedDB';
import { useGlobalToast } from '@/composables/useGlobalToast';
import { useConfirm } from '@/composables/useConfirmDialog';
import { useRouter } from 'vue-router';

const router = useRouter();
const device = useDeviceStore().device;
const messages = useMessageStore().messageStore;
const indexedDB = useIndexedDB();
const toast = useGlobalToast();
const visibleQRDialog = ref(false);
const { open } = useConfirm();

const fileInputRef = ref<HTMLInputElement | null>(null);
const handleRestoreFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  if (!file.name.endsWith('.zip')) {
    toast.add({
      severity: 'warn',
      summary: 'Invalid file',
      detail: 'Please select a ZIP backup file.',
    });
    return;
  }

  try {
    await indexedDB.restoreBackup(file);

    toast.add({
      severity: 'success',
      summary: 'Restore',
      detail: 'Database restored. Reloading...',
      life: 3000,
    });

    setTimeout(async () => {
      await router.replace({ path: '/' });
      window.location.reload(); // ensures clean state
    }, 500);
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Restore failed',
      detail: err?.message || 'Unknown error',
      life: 4000,
    });
  } finally {
    input.value = '';
  }
};

type ToolPanelItem = {
  label: string;
  myIcon?: FunctionalComponent<LucideProps>;
  command?: (_event: any) => void;
};

const toolsPanelItems = computed<ToolPanelItem[]>(() => [
  {
    label: 'Channel QR Code',
    myIcon: QrCode,
    command: (_event?: any) => {
      visibleQRDialog.value = true;
    },
  },
  {
    label: 'Enter DFU',
    myIcon: HardDriveDownload,
    command: (_event?: any) => {
      device.value?.connection?.enterDfuMode().then(() => {
        toast.add({
          severity: 'info',
          summary: 'DFU Mode',
          detail: 'Device is entering DFU mode.',
          life: 3000,
        });
      });
    },
  },
  {
    label: 'Reconfiguration',
    myIcon: RefreshCw,
    command: (_event?: any) => {
      device.value?.connection?.configure().then(() => {
        toast.add({
          severity: 'info',
          summary: 'Reconfiguration',
          detail: 'Reconfiguration done.',
          life: 3000,
        });
      });
    },
  },
  {
    label: 'Reset Node Database',
    myIcon: Trash,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Reset Node Database?',
        message: 'This will delete all nodes from the device database.',
        acceptLabel: 'Reset',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        device.value?.connection?.resetNodes().then(() => {
          toast.add({
            severity: 'info',
            summary: 'Reset',
            detail: 'Node Database cleared.',
            life: 3000,
          });
        });
      }
    },
  },
  {
    label: 'Shutdown',
    myIcon: PowerOff,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Shutdown device?',
        message: 'The device will be shut down immediately.',
        acceptLabel: 'Shutdown',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        device.value?.connection?.shutdown(2).then(() => {
          toast.add({
            severity: 'info',
            summary: 'Shutdown',
            detail: 'Shutdown initiated.',
            life: 3000,
          });
        });
      }
    },
  },
  {
    label: 'Reboot',
    myIcon: RefreshCw,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Reboot device?',
        message: 'The device will immediately reboot.',
        acceptLabel: 'Reboot',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        device.value?.connection?.reboot(2).then(() => {
          toast.add({
            severity: 'info',
            summary: 'Reboot',
            detail: 'Reboot initiated.',
            life: 3000,
          });
        });
      }
    },
  },
  {
    label: 'Factory Reset Device',
    myIcon: Factory,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Factory Reset Device?',
        message: 'The device will be reset to factory defaults.',
        acceptLabel: 'Reset',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        device.value?.connection?.factoryResetDevice().then(() => {
          toast.add({
            severity: 'info',
            summary: 'Reset',
            detail: 'Factory reset initiated.',
            life: 3000,
          });
        });
      }
    },
  },
  {
    label: 'Factory Reset Configuration',
    myIcon: Factory,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Factory Reset Configuration?',
        message: 'The configuration will be reset to factory defaults.',
        acceptLabel: 'Reset',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        device.value?.connection?.factoryResetConfig().then(() => {
          toast.add({
            severity: 'info',
            summary: 'Reset',
            detail: 'Factory reset initiated.',
            life: 3000,
          });
        });
      }
    },
  },
  {
    label: 'Clear Message Store',
    myIcon: Eraser,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Clear Message Store?',
        message: 'This will clear all message from persistent browser storage!',
        acceptLabel: 'Clear',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        messages.value?.deleteAllMessages();
        toast.add({
          severity: 'info',
          summary: 'Clear',
          detail: 'All messages deleted.',
          life: 3000,
        });
      }
    },
  },
  {
    label: 'Clear All Stores',
    myIcon: Eraser,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Clear Database Stores?',
        message: 'This will clear the entire persistent browser storage!',
        acceptLabel: 'Clear',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        indexedDB.clearAllStores().then(() => {
          toast.add({
            severity: 'info',
            summary: 'Clear',
            detail: 'All stores deleted.',
            life: 3000,
          });
        });
      }
    },
  },
  {
    label: 'Backup Stores',
    myIcon: Archive,
    command: async (_event?: any) => {
      const confirmed = await open({
        header: 'Backup Database Stores?',
        message: 'This will backup and download the entire persistent browser storage!',
        acceptLabel: 'Backup',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        await indexedDB.exportBackup();
        toast.add({
          severity: 'success',
          summary: 'Backup',
          detail: 'Backup complete.',
          life: 3000,
        });
      }
    },
  },
  {
    label: 'Restore Stores',
    myIcon: ArchiveRestore,
    command: async () => {
      const confirmed = await open({
        header: 'Restore Database Stores?',
        message: 'This will overwrite all persistent browser storage with the backup file.',
        acceptLabel: 'Restore',
        cancelLabel: 'Cancel',
      });

      if (confirmed) {
        fileInputRef.value?.click();
      }
    },
  },
]);
</script>
