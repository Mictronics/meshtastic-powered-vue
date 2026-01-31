<template>
  <PanelMenu :model="toolsPanelItems" class="w-full gap-1!" pt:panel:class="dashboard-panelmenu">
    <template #item="{ item }">
      <a class="flex items-center cursor-pointer group">
        <component :is="item.myIcon" />
        <span class="ml-2">{{ item.label }}</span>
      </a>
    </template>
  </PanelMenu>
  <ConfirmDialog ref="confirmDialogRef" />
  <Dialog v-model:visible="visibleQRDialog" header="Channel QR Code">
    <QRDialog />
  </Dialog>
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
  Unlink,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import type { FunctionalComponent } from 'vue';
import type { LucideProps } from 'lucide-vue-next';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import QRDialog from './QRDialog.vue';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/core/stores/message/useMessageStore';
import { useIndexedDB } from '@/composables/core/stores/indexedDB';
import { useGlobalToast } from '@/composables/useGlobalToast';

const device = useDeviceStore().device;
const messages = useMessageStore().messageStore;
const indexedDB = useIndexedDB();
const toast = useGlobalToast();
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);
const visibleQRDialog = ref(false);

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
          detail: 'Reconfiguration started.',
          life: 3000,
        });
      });
    },
  },
  {
    label: 'Reset Node Database',
    myIcon: Trash,
    command: async (_event?: any) => {
      const confirmed = await confirmDialogRef.value?.open({
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
      const confirmed = await confirmDialogRef.value?.open({
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
      const confirmed = await confirmDialogRef.value?.open({
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
      const confirmed = await confirmDialogRef.value?.open({
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
      const confirmed = await confirmDialogRef.value?.open({
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
      const confirmed = await confirmDialogRef.value?.open({
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
      const confirmed = await confirmDialogRef.value?.open({
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
]);
</script>
