<template>
  <div class="flex flex-col gap-2 py-4 own-node-info">
    <div class="flex items-center gap-1 py-1 shrink-0">
      <NodeAvatar :nodeNumber="nodeId" :shortName="shortName" />
      <p
        v-if="isSideBarVisible"
        class="text-sm font-medium logo-text truncate"
        v-tooltip.right="{
          value: longName,
          showDelay: 100,
          hideDelay: 500,
          pt: {
            text: 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 text-sm',
          },
        }"
      >
        {{ longName }}
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
          :class="'h-2.5 w-2.5 ml-2 rounded-full shrink-0 ' + connectionStatus.color"
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

    <div
      v-if="isSideBarVisible"
      class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
    >
      <Battery :size="20" />
      <p class="truncate">Voltage: {{ voltage }}</p>
    </div>

    <div
      v-if="isSideBarVisible"
      class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
    >
      <Cpu :size="20" />
      <p class="truncate">Firmware: {{ firmware }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Battery, Cpu } from 'lucide-vue-next';
import { computed } from 'vue';
import BatteryStatus from './BatteryStatus.vue';
import { ConnectionStatus } from '@/composables/core/stores/connection/types';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';

const props = defineProps<{
  shortName?: string;
  longName?: string;
  nodeId?: number;
  isSideBarVisible: boolean;
  connectionName?: string;
  connectionStatus: ConnectionStatus;
  firmwareVersion?: string;
  batteryLevel?: number;
  voltage?: number;
}>();

const voltage = computed(() =>
  props.voltage !== undefined ? `${props.voltage.toPrecision(2)} V` : 'N/A'
);

const batteryPercent = computed(() => {
  const level = props.batteryLevel;
  if (level === undefined) return 'N/A';
  if (level > 100) return 'Plugged in';
  return `Battery: ${level} %`;
});

const firmware = computed(() => props.firmwareVersion ?? 'N/A');
const connectionName = computed(() => props.connectionName ?? '');

const getStatusAttr = (status?: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.Connected:
    case ConnectionStatus.Configured:
    case ConnectionStatus.Online:
      return { icon: 'IconLink', color: 'bg-emerald-500', label: 'Connected' };
    case ConnectionStatus.Connecting:
    case ConnectionStatus.Configuring:
    case ConnectionStatus.Disconnecting:
      return { icon: 'IconUnlink', color: 'bg-amber-500', label: 'Configuring' };
    case ConnectionStatus.Error:
      return { icon: 'IconUnlink', color: 'bg-red-500', label: 'Error' };
    default:
      return { icon: 'IconUnlink', color: 'bg-gray-400', label: 'Disconnected' };
  }
};

const connectionStatus = computed(() => getStatusAttr(props.connectionStatus));
</script>

<style lang="css" scoped>
.connection-info {
  display: flex;
  justify-content: flex-start;
  padding-left: unset;
}
</style>
