<template>
  <Card>
    <template #title>
      <div class="flex justify-between">
        {{ connection.name }}
        <div>
          <Chip v-if="connection.isDefault" class="connection-item-chip dark:text-slate-400">
            <Star fill="orange" strokeWidth="0" :size="15" />
            Default
          </Chip>
          <Chip v-if="isConnected()" class="connection-item-chip dark:text-slate-400">
            <Link :size="15" />
            Connected
          </Chip>
          <Chip
            v-else-if="connection.status === ConnectionStatus.Disconnected"
            class="connection-item-chip dark:text-slate-400"
          >
            <Unlink :size="15" />
            Disconnected
          </Chip>
          <Chip v-else class="connection-item-chip dark:text-slate-400">
            <Hourglass :size="15" />
            {{ getEnumKey(ConnectionStatus, connection.status) }}
          </Chip>
          <Button size="small" severity="secondary" variant="text" @click="toggle">
            <Ellipsis :size="15" />
          </Button>
          <Popover ref="op" id="popover" @show="setPopoverPosition">
            <div class="flex flex-col gap-2 text-sm">
              <Button
                v-if="connection.isDefault"
                class="popover-button"
                variant="text"
                severity="secondary"
                size="small"
                @click="onSetDefault(false)"
              >
                <StarOff :size="15" />
                Unset default
              </Button>
              <Button
                v-else
                class="popover-button"
                variant="text"
                severity="secondary"
                size="small"
                @click="onSetDefault(true)"
              >
                <Star :size="15" />
                Set default
              </Button>
              <Button
                class="popover-button"
                variant="text"
                severity="danger"
                size="small"
                @click="onDelete()"
              >
                <Trash2 :size="15" />
                Delete
              </Button>
            </div>
          </Popover>
        </div>
      </div>
    </template>
    <template #subtitle>
      <div>
        <Chip
          v-if="connection.type === ConnectionType.Http"
          class="connection-item-chip dark:text-slate-400"
        >
          <Globe :size="15" />
          HTTP
        </Chip>
        <Chip
          v-else-if="connection.type === ConnectionType.Serial"
          class="connection-item-chip dark:text-slate-400"
        >
          <Cable :size="15" />
          Serial
        </Chip>
        <Chip
          v-else-if="connection.type === ConnectionType.Bluetooth"
          class="connection-item-chip dark:text-slate-400"
        >
          <Bluetooth :size="15" />
          Bluetooth
        </Chip>
        {{ formatConnectionSubtext(connection) }}
      </div>
    </template>
    <template #content>
      <div class="flex justify-between gap-2 items-center">
        <p class="m-0 text-sm last-connected">
          {{
            connection.lastConnectedAt === 0
              ? 'Never connected'
              : formatDate(connection.lastConnectedAt)
          }}
        </p>
        <Message v-if="connection.error" severity="error" variant="simple" size="small">
          {{ connection.error }}
        </Message>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-4 mt-1">
        <Button
          v-if="connection.status === ConnectionStatus.Disconnected"
          severity="success"
          size="small"
          @click="$emit('eventConnect', connection.id)"
        >
          <Link :size="15" />
          Connect
        </Button>
        <Button
          v-else-if="isConnected()"
          severity="secondary"
          size="small"
          @click="$emit('eventDisconnect', connection.id)"
        >
          <Unlink :size="15" />
          Disconnect
        </Button>
        <Button
          v-else-if="connection.status === ConnectionStatus.Error"
          severity="warn"
          size="small"
          @click="$emit('eventReconnect', connection.id)"
        >
          <RotateCcw :size="15" />
          Retry
        </Button>
        <Button
          v-else
          severity="info"
          size="small"
          @click="$emit('eventDisconnect', connection.id)"
        >
          <ProgressSpinner style="width: 15px; height: 15px" strokeWidth="5" fill="transparent" />
        </Button>
      </div>
    </template>
  </Card>
</template>

<script setup lang="ts">
import {
  Star,
  Link,
  Unlink,
  Hourglass,
  Ellipsis,
  StarOff,
  Trash2,
  Globe,
  Cable,
  Bluetooth,
  RotateCcw,
} from 'lucide-vue-next';
import { ref } from 'vue';
import {
  ConnectionStatus,
  ConnectionType,
  type IConnection,
} from '@/composables/core/stores/connection/types';
import { formatTimeAgoIntl } from '@vueuse/core';

const props = defineProps<{ connection: IConnection }>();

const emit = defineEmits<{
  (e: 'eventConnect', id: number): void;
  (e: 'eventDisconnect', id: number): void;
  (e: 'eventReconnect', id: number): void;
  (e: 'eventConnectionDefault', id: number, isDefault: boolean): void;
  (e: 'eventConnectionDelete', id: number): void;
}>();

const op = ref<any>(null);
let clientX = 0;
let clientY = 0;

function toggle(event: MouseEvent) {
  clientX = event.clientX;
  clientY = event.clientY;
  op.value?.toggle(event);
}

function getEnumKey(enumObj: any, value: number): string | undefined {
  return Object.keys(enumObj).find((key) => enumObj[key] === value);
}

function isConnected(): boolean {
  const status = props.connection.status;
  return status === ConnectionStatus.Connected || status === ConnectionStatus.Configured;
}

function setPopoverPosition() {
  /* Workaround for bug in Primevue Popover.
   * https://github.com/primefaces/primevue/issues/6616
   */
  const po = document.getElementById('popover');
  if (po) {
    po.style.top = `${clientY}px`;
    po.style.insetInlineStart = `${clientX - 130}px`;
  }
}

function onSetDefault(value: boolean) {
  emit('eventConnectionDefault', props.connection.id, value);
  op.value.hide();
}

function onDelete() {
  emit('eventConnectionDelete', props.connection.id);
  op.value.hide();
}

function formatDate(epoch?: number) {
  const date = new Date(0);
  if (epoch === undefined) {
    date.setUTCSeconds(Math.ceil(Date.now() / 1000));
  } else {
    date.setUTCSeconds(epoch);
  }
  return formatTimeAgoIntl(date);
}

function formatConnectionSubtext(conn: IConnection): string {
  if (conn.type === ConnectionType.Http) {
    return conn.url;
  } else if (conn.type === ConnectionType.Bluetooth) {
    return conn.deviceName || conn.deviceId || 'No device selected';
  } else if (conn.type === ConnectionType.Serial) {
    const v = conn.usbVendorId ? conn.usbVendorId.toString(16) : '?';
    const p = conn.usbProductId ? conn.usbProductId.toString(16) : '?';
    return `USB ${v}:${p}`;
  }
  return '?';
}
</script>

<style scoped lang="css">
.connection-item-chip {
  padding-block: unset;
  font-weight: normal;
  font-size: var(--text-xs);
  line-height: var(--text-xs--line-height);
  margin-right: 0.5em;
}

.popover-button {
  padding: 0 var(--p-button-sm-padding-x);
  justify-content: start;
}

.last-connected {
  min-width: fit-content;
}
</style>
