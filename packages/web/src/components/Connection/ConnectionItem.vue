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
          <Chip
            v-if="isConnected()"
            class="connection-item-chip bg-lime-500 dark:bg-lime-700 dark:text-slate-400"
          >
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
                v-if="isActiveDevice && lockdownState === LockdownState.UNLOCKED"
                class="popover-button"
                variant="text"
                severity="danger"
                size="small"
                @click="onDisableLockdown()"
              >
                <ShieldOff :size="15" />
                Disable Lockdown
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
      <div v-if="isActiveDevice && lockdownState !== undefined && lockdownState !== LockdownState.STATE_UNSPECIFIED" class="mb-2">
        <Chip v-if="lockdownState === LockdownState.NEEDS_PROVISION" class="connection-item-chip bg-amber-500 dark:bg-amber-700 dark:text-slate-400">
          <ShieldAlert :size="15" />
          Needs lockdown passphrase
        </Chip>
        <Chip v-else-if="lockdownState === LockdownState.LOCKED" class="connection-item-chip bg-amber-500 dark:bg-amber-700 dark:text-slate-400">
          <Lock :size="15" />
          Locked
        </Chip>
        <Chip v-else-if="lockdownState === LockdownState.UNLOCK_FAILED" class="connection-item-chip bg-red-500 dark:bg-red-700 dark:text-slate-400">
          <Lock :size="15" />
          Unlock failed
        </Chip>
        <Chip v-else-if="lockdownState === LockdownState.UNLOCKED" class="connection-item-chip bg-lime-500 dark:bg-lime-700 dark:text-slate-400">
          <LockOpen :size="15" />
          Unlocked{{ unlockedSuffix }}
        </Chip>
        <Chip v-else-if="lockdownState === LockdownState.DISABLED" class="connection-item-chip dark:text-slate-400">
          <ShieldOff :size="15" />
          Lockdown disabled
        </Chip>
      </div>
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
        <Button
          v-if="isActiveDevice && (lockdownState === LockdownState.NEEDS_PROVISION || lockdownState === LockdownState.DISABLED)"
          severity="warn"
          size="small"
          @click="goToLockdown()"
        >
          <KeyRound :size="15" />
          {{ lockdownState === LockdownState.DISABLED ? 'Enable Lockdown' : 'Set Lockdown Passphrase' }}
        </Button>
        <Button
          v-else-if="isActiveDevice && (lockdownState === LockdownState.LOCKED || lockdownState === LockdownState.UNLOCK_FAILED)"
          severity="warn"
          size="small"
          @click="goToLockdown()"
        >
          <Lock :size="15" />
          Unlock
        </Button>
        <Button
          v-else-if="isActiveDevice && lockdownState === LockdownState.UNLOCKED"
          severity="warn"
          size="small"
          @click="onLockNow()"
        >
          <Lock :size="15" />
          Lock Now
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
  Lock,
  LockOpen,
  KeyRound,
  ShieldAlert,
  ShieldOff,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Protobuf } from '@meshtastic/core';
import {
  ConnectionStatus,
  ConnectionType,
  type IConnection,
} from '@/composables/stores/connection/types';
import { formatTimeAgoIntl, useIntervalFn } from '@vueuse/core';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useConfirm } from '@/composables/useConfirmDialog';
import { useLockdownSession } from '@/composables/useLockdownSession';

const LockdownState = Protobuf.Mesh.LockdownStatus_State;

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

const toggle = (event: MouseEvent) => {
  clientX = event.clientX;
  clientY = event.clientY;
  op.value?.toggle(event);
};

const getEnumKey = (enumObj: any, value: number): string | undefined => {
  return Object.keys(enumObj).find((key) => enumObj[key] === value);
};

const isConnected = (): boolean => {
  const status = props.connection.status;
  return status === ConnectionStatus.Connected || status === ConnectionStatus.Configured;
};

const router = useRouter();
const deviceStore = useDeviceStore();

// The device store only ever holds one loaded device (the app's single
// active-connection model), so lockdown UI must only render on the card
// whose connection matches it — other cards have no live data to show.
const isActiveDevice = computed(
  () =>
    props.connection.meshDeviceId !== undefined &&
    deviceStore.device.value?.id === props.connection.meshDeviceId,
);

const lockdownState = computed(() =>
  isActiveDevice.value ? deviceStore.device.value?.lockdownStatus.state : undefined,
);

const now = ref(Date.now());
useIntervalFn(() => {
  now.value = Date.now();
}, 1000, { immediate: true });

const unlockedSuffix = computed(() => {
  if (!isActiveDevice.value) return '';
  const status = deviceStore.device.value?.lockdownStatus;
  if (!status) return '';
  const bits: string[] = [];
  if (status.bootsRemaining > 0) bits.push(`${status.bootsRemaining} boots left`);
  if (status.validUntilEpoch > 0) {
    void now.value; // re-read each tick so the relative time below stays live
    bits.push(`expires ${formatTimeAgoIntl(new Date(status.validUntilEpoch * 1000))}`);
  }
  return bits.length ? ` — ${bits.join(', ')}` : '';
});

const goToLockdown = () => {
  router.push({ name: 'lockdown' });
};

const onLockNow = async () => {
  const confirmed = await useConfirm().open({
    header: 'Lock device now?',
    message: 'The device will immediately require the lockdown passphrase again and reboot.',
    acceptLabel: 'Lock now',
    cancelLabel: 'Cancel',
  });
  if (!confirmed) return;
  const dev = deviceStore.device.value;
  if (!dev?.connection) return;
  await dev.connection.lockNow();
  useLockdownSession().clearPassphrase();
};

const onDisableLockdown = () => {
  op.value?.hide();
  router.push({ name: 'lockdown', query: { action: 'disable' } });
};

const setPopoverPosition = () => {
  /* Workaround for bug in Primevue Popover.
   * https://github.com/primefaces/primevue/issues/6616
   */
  const po = document.getElementById('popover');
  if (po) {
    po.style.top = `${clientY}px`;
    po.style.insetInlineStart = `${clientX - 130}px`;
  }
};

const onSetDefault = (value: boolean) => {
  emit('eventConnectionDefault', props.connection.id, value);
  op.value.hide();
};

const onDelete = () => {
  emit('eventConnectionDelete', props.connection.id);
  op.value.hide();
};

const formatDate = (epoch?: number) => {
  const date = new Date(0);
  if (epoch === undefined) {
    date.setUTCSeconds(Math.ceil(Date.now() / 1000));
  } else {
    date.setUTCSeconds(epoch);
  }
  return formatTimeAgoIntl(date);
};

const formatConnectionSubtext = (conn: IConnection): string => {
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
};
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
