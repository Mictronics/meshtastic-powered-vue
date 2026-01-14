<template>
  <div class="flex flex-col gap-2 py-4 own-node-info">
    <div class="flex items-center gap-1 py-1 flex-shrink-0">
      <NodeAvatar :nodeNumber="props.nodeId" :shortName="props.shortName" />
      <p
        v-if="isSideBarVisible"
        class="text-sm font-medium logo-text truncate"
        v-tooltip.right="{
          value: props.longName,
          pt: {
            arrow: {
              style: {
                borderBottomColor: 'var(--p-secondary-color)',
              },
            },
            text: '!bg-secondary !logo-text !font-light !text-xs',
          },
        }"
      >
        {{ props.longName }}
      </p>
    </div>
    <Button
      asChild
      v-slot="slotProps"
      aria-label="Go Back"
      size="small"
      severity="secondary"
      variant="text"
    >
      <RouterLink to="/" :class="slotProps.class + ' connection-info'">
        <span
          :class="'h-2.5 w-2.5 ml-2 rounded-full flex-shrink-0 ' + connectionStatus.color"
          aria-hidden="true"
        />
        <div class="text-xs logo-text">
          <p v-if="isSideBarVisible">{{ connectionName }}</p>
          <p v-if="isSideBarVisible">{{ connectionStatus.label }}</p>
        </div>
      </RouterLink>
    </Button>
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <BatteryStatus :battery-level="batteryLevel" />
      <p v-if="isSideBarVisible" class="truncate">
        {{ batteryPercent }}
      </p>
    </div>

    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <IconBattery size="20" />
      <p v-if="isSideBarVisible" class="truncate">Voltage: {{ voltage }}</p>
    </div>

    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <IconCpu size="20" />
      <p v-if="isSideBarVisible" class="truncate">Firmware: {{ firmware }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import BatteryStatus from './BatteryStatus.vue';
import { ConnectionStatus } from '@/composables/core/stores/connection/types';
import { watchImmediate } from '@vueuse/core';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';

const props = defineProps<{
  shortName: string | undefined;
  longName: string | undefined;
  nodeId: number | undefined;
  isSideBarVisible: boolean;
  connectionName: string | undefined;
  connectionStatus: ConnectionStatus;
  firmwareVersion: string | undefined;
  batteryLevel: number | undefined;
  voltage: number | undefined;
}>();

const batteryLevel = computed(() => {
  return props.batteryLevel;
});

const voltage = computed(() => {
  return props.voltage !== undefined ? `${props.voltage?.toPrecision(2)} V` : 'N/A';
});

const batteryPercent = computed(() => {
  if (batteryLevel.value !== undefined) {
    if (batteryLevel.value > 100) {
      return 'Plugged in';
    } else {
      return `Battery: ${batteryLevel.value} %`;
    }
  } else {
    return 'N/A';
  }
});

const firmware = ref();
const connectionName = ref();
watchEffect(() => (firmware.value = props.firmwareVersion ?? 'N/A'));
watchEffect(() => (connectionName.value = props.connectionName ?? ''));

const connectionStatus = ref({
  icon: 'IconUnlink',
  color: 'bg-gray-400',
  label: 'Disconnected',
});

const getStatusAttr = (status?: ConnectionStatus) => {
  if (!status) {
    return {
      icon: 'IconUnlink',
      color: 'bg-gray-400',
      label: 'Status unknown',
    };
  }
  switch (status) {
    case ConnectionStatus.Connected:
    case ConnectionStatus.Configured:
    case ConnectionStatus.Online:
      return {
        icon: 'IconLink',
        color: 'bg-emerald-500',
        label: 'Connected',
      };
    case ConnectionStatus.Connecting:
    case ConnectionStatus.Configuring:
    case ConnectionStatus.Disconnecting:
      return {
        icon: 'IconUnlink',
        color: 'bg-amber-500',
        label: 'Configuring',
      };
    case ConnectionStatus.Error:
      return {
        icon: 'IconUnlink',
        color: 'bg-red-500',
        label: 'Error',
      };
    default:
      return {
        icon: 'IconUnlink',
        color: 'bg-gray-400',
        label: 'Disconnected',
      };
  }
};

watchImmediate(
  () => props.connectionStatus,
  (n) => {
    connectionStatus.value = getStatusAttr(n);
  }
);
</script>

<style lang="css" scoped>
.connection-info {
  display: flex;
  justify-content: flex-start;
  padding-left: unset;
}
</style>
