<template>
  <header class="flex items-start justify-between">
    <div class="flex items-stretch gap-3">
      <Button asChild v-slot="slotProps" aria-label="Go Back" variant="text" severity="secondary">
        <RouterLink to="/dashboard" :class="slotProps.class">
          <IconArrowLeft :size="24" />
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
        <IconRouter :size="24" />
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
      @event-connection-delete="onDelete"
      @event-connection-default="setDefaultConnection"
    />
  </div>
  <AddConnectionDialog ref="addConnectionDialog" />
  <DeleteConfirmDialog ref="deleteConfirmDialog" @event-on-confirm-delete="deleteConnection" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ConnectionItem from './ConnectionItem.vue';
import AddConnectionDialog from './AddConnectionDialog.vue';
import DeleteConfirmDialog from './DeleteConfirmDialog.vue';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { useConnection } from '@/composables/core/useConnection';
import { useGlobalToast } from '@/composables/useGlobalToast';

const router = useRouter();

type AddConnectionDialogHandle = { open: () => void; close: () => void };
const addConnectionDialog = ref<AddConnectionDialogHandle | null>(null);

type DeleteConfirmDialogHandle = { open: () => void };
const deleteConfirmDialog = ref<DeleteConfirmDialogHandle | null>(null);

const connections = useConnectionStore().connections;
// Sort and show default connection first.
const sortedConnections = computed(() => {
  return new Map(
    Array.from(connections.value.entries()).sort((a, b) => {
      return (b[1].isDefault === true ? 1 : 0) - (a[1].isDefault === true ? 1 : 0);
    })
  );
});

function showAddConnectionDialog() {
  addConnectionDialog.value?.open();
}

let connectionToDelete = 0;
// Called first when connection shall be deleted. Show confirmation dialog.
function onDelete(id: number) {
  connectionToDelete = id;
  deleteConfirmDialog.value?.open();
}
// Called second if confirmation is accepted. Triggers deletes connection.
async function deleteConnection() {
  await useConnection().deleteConnection(connectionToDelete);
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
    router.push({ name: 'dashboard', params: {}, query: {} });
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
