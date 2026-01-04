<template>
  <header class="flex items-start justify-between">
    <div class="flex items-stretch gap-3">
      <Button asChild v-slot="slotProps" aria-label="Go Back" variant="text" severity="secondary">
        <RouterLink to="/" :class="slotProps.class"><IconArrowLeft :size="24" /></RouterLink>
      </Button>
      <div>
        <h1 class="text-xl text-2xl md:text-3xl font-bold tracking-tight">
          Connect to a Meshtastic device
        </h1>
        <p class="lg:w-4/6 md:w-5/6 text-slate-500 dark:text-slate-400 mt-1">
          Add a device connection via HTTP. Your connections will be saved in your browser.
        </p>
      </div>
    </div>
    <div class="flex flex-col items-end gap-2">
      <Button
        size="small"
        aria-label="Add Connection"
        severity="contrast"
        @click="showAddConnectionDialog"
      >
        <IconRouter :size="24" />
        Add Connection
      </Button>
    </div>
  </header>
  <Divider />
  <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
    <ConnectionItem
      v-for="conn in connections.values()"
      :key="conn.id"
      :connection="conn"
      @event-connection-delete="deleteConnection"
      @event-connection-default="setDefaultConnection"
      @event-connect="onConnect"
      @event-disconnect="onDisconnect"
    />
  </div>
  <AddConnectionDialog ref="addConnectionDialog" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ConnectionItem from './ConnectionItem.vue';
import AddConnectionDialog from './AddConnectionDialog.vue';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { useConnection } from '@/composables/core/useConnection';
import { useGlobalToast } from '@/composables/useGlobalToast';

type AddConnectionDialogHandle = { open: () => void; close: () => void };

const addConnectionDialog = ref<AddConnectionDialogHandle | null>(null);

const connections = useConnectionStore().connections;

function showAddConnectionDialog() {
  addConnectionDialog.value?.open();
}

async function deleteConnection(id: number) {
  await useConnection().deleteConnection(id);
}

function setDefaultConnection(id: number, isDefault: boolean) {
  useConnectionStore().setDefaultConnection(id, isDefault);
}

async function onConnect(id: number) {
  const isConnected = await useConnection().connect(id);
  if (isConnected) {
    useGlobalToast().add({
      severity: 'success',
      summary: 'Connection',
      detail: 'Device connected.',
      life: 2000,
    });
  } else {
    useGlobalToast().add({
      severity: 'error',
      summary: 'Connection Error',
      detail: 'Check connection.',
      life: 5000,
    });
  }
}

function onDisconnect(id: number) {
  useConnection().disconnect(id);
}
</script>
