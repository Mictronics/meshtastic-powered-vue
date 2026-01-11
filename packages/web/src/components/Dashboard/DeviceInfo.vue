<template>
  <div class="flex flex-col gap-2 py-4 own-node-info">
    <div class="flex items-center gap-1 py-1 flex-shrink-0">
      <Avatar
        shape="circle"
        class="text-xs font-light bg-[rgb(var(--bg-r),var(--bg-g),var(--bg-b))]"
        :style="{
          '--bg-r': avatarColor.background.r,
          '--bg-g': avatarColor.background.g,
          '--bg-b': avatarColor.background.b,
          color: avatarColor.text,
        }"
      >
        {{ props.shortName }}
      </Avatar>
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
    <div
      v-for="item in deviceInfoItems"
      :key="item.id"
      class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
    >
      <component :is="item.dynamicComponent.comp" v-bind="item.dynamicComponent.props" />
      <p class="truncate" v-if="isSideBarVisible">{{ item.label }}{{ item.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from 'vue';
import { useColor } from '@/composables/core/utils/useColor';
import BatterLevel from './BatteryStatus.vue';
import { ConnectionStatus } from '@/composables/core/stores/connection/types';
import { watchImmediate } from '@vueuse/core';

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

const batteryLevel = ref();
const voltage = ref('N/A');
const batteryPercent = ref('N/A');
watch(
  () => [props.batteryLevel, props.voltage],
  ([l, v]) => {
    batteryLevel.value = l;
    voltage.value = v !== undefined ? `${v?.toPrecision(2)} V` : 'N/A';
    if (l !== undefined) {
      if (l > 100) {
        batteryPercent.value = 'Plugged in';
      } else {
        batteryPercent.value = `Battery: ${l} %`;
      }
    } else {
      batteryPercent.value = 'N/A';
    }
  }
);

const firmware = ref();
const connectionName = ref();
watchEffect(() => (firmware.value = props.firmwareVersion ?? 'N/A'));
watchEffect(() => (connectionName.value = props.connectionName ?? ''));

const deviceInfoItems = [
  {
    id: 'battery',
    label: batteryPercent,
    dynamicComponent: {
      comp: BatterLevel,
      props: { batteryLevel: batteryLevel },
    },
    value: undefined,
  },
  {
    id: 'voltage',
    label: 'Voltage: ',
    dynamicComponent: { comp: 'IconBattery', props: { size: 20 } },
    value: voltage,
  },
  {
    id: 'firmware',
    label: 'Firmware: ',
    dynamicComponent: { comp: 'IconCpu', props: { size: 20 } },
    value: firmware,
  },
];

const connectionStatus = ref({
  icon: 'IconUnlink',
  color: 'bg-gray-400',
  label: 'Disconnected',
});

const avatarColor = computed(() => {
  const bgColor = useColor().getColorFromNodeNum(props.nodeId || 0);
  const isLight = useColor().isLightColor(bgColor);
  const textColor = isLight ? '#000000' : '#FFFFFF';
  return {
    background: bgColor,
    text: textColor,
  };
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
