<template>
  <header class="flex items-start justify-between">
    <div class="flex items-stretch gap-3">
      <Button asChild v-slot="slotProps" aria-label="Go Back" variant="text" severity="secondary">
        <RouterLink to="/dashboard" :class="slotProps.class">
          <ArrowLeft :size="24" />
        </RouterLink>
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
        <Router :size="24" />
        Add Connection
      </Button>
    </div>
  </header>
  <Divider />
  <div class="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
    <ConnectionItem
      v-for="conn in sortedConnections.values()"
      :key="conn.id"
      :connection="conn"
      @event-connect="onConnect"
      @event-disconnect="onDisconnect"
      @event-reconnect="onConnect"
      @event-connection-delete="deleteConnection"
      @event-connection-default="setDefaultConnection"
    />
  </div>
  <AddConnectionDialog ref="addConnectionDialog" />
  <ConfirmDialog ref="confirmDialogRef" />
</template>

<script setup lang="ts">
import { ArrowLeft, Router } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import ConnectionItem from './ConnectionItem.vue';
import AddConnectionDialog from './AddConnectionDialog.vue';
import ConfirmDialog from './ConfirmDialog.vue';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { useConnection } from '@/composables/core/useConnection';
import { useGlobalToast } from '@/composables/useGlobalToast';

const route = useRoute();
const router = useRouter();

type AddConnectionDialogHandle = { open: () => void; close: () => void };
const addConnectionDialog = ref<AddConnectionDialogHandle | null>(null);

const connections = useConnectionStore().connections;
// Sort and show default connection first.
const sortedConnections = computed(() => {
  const sortedEntries = [...connections.value.entries()].sort((a, b) => {
    return (b[1].isDefault ? 1 : 0) - (a[1].isDefault ? 1 : 0);
  });
  return new Map(sortedEntries);
});

function showAddConnectionDialog() {
  addConnectionDialog.value?.open();
}

const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);
async function deleteConnection(id: number) {
  const confirmed = await confirmDialogRef.value?.open({
    header: 'Delete Connection?',
    message: 'All device data linked to this connection will be permanently deleted.',
    acceptLabel: 'Delete',
    cancelLabel: 'Cancel',
  });

  if (confirmed) {
    await useConnection().deleteConnection(id);
  }
}

const connectionStore = useConnectionStore();
function setDefaultConnection(id: number, isDefault: boolean) {
  connectionStore.setDefaultConnection(id, isDefault);
}

const connection = useConnection();
async function onConnect(id: number) {
  try {
    const isConnected = await connection.connect(id);
    if (isConnected) {
      useGlobalToast().add({
        severity: 'success',
        summary: 'Connection',
        detail: 'Device connected.',
        life: 2000,
      });
      const redirect = route.query.redirect as string | undefined;
      router.push(redirect ?? { name: 'dashboard.home', params: {}, query: {} });
      //router.push({ name: 'dashboard.home', params: {}, query: {} });
    } else {
      useGlobalToast().add({
        severity: 'error',
        summary: 'Connection Error',
        detail: 'Check connection.',
        life: 5000,
      });
    }
  } catch (error) {
    console.error('Connection error:', error);
    useGlobalToast().add({
      severity: 'error',
      summary: 'Connection Error',
      detail: 'An unexpected error occurred. Please try again later.',
      life: 5000,
    });
  }
}

function onDisconnect(id: number) {
  connection.disconnect(id);
}
</script>
