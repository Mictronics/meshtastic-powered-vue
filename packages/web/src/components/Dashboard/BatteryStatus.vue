<template>
  <component :class="batteryStatus.class" :size="20" :is="batteryStatus.icon" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  batteryLevel?: number;
}>();

interface StatusConfig {
  icon: string;
  class: string;
}

enum BatteryStatus {
  Warning = 0,
  Low,
  Medium,
  Full,
  PluggedIn,
}
const getBatteryStatus = (level: number): BatteryStatus => {
  if (level > 100) {
    return BatteryStatus.PluggedIn;
  } else if (level > 75) {
    return BatteryStatus.Full;
  } else if (level > 25) {
    return BatteryStatus.Medium;
  } else if (level > 10) {
    return BatteryStatus.Low;
  }
  return BatteryStatus.Warning;
};

const statusConfigMap: Record<BatteryStatus, StatusConfig> = {
  [BatteryStatus.PluggedIn]: {
    icon: 'IconBatteryCharging',
    class: 'text-sky-500',
  },
  [BatteryStatus.Full]: {
    icon: 'IconBatteryFull',
    class: 'text-lime-500',
  },
  [BatteryStatus.Medium]: {
    icon: 'IconBatteryMedium',
    class: 'text-yellow-500',
  },
  [BatteryStatus.Low]: {
    icon: 'IconBatteryLow',
    class: 'text-orange-500',
  },
  [BatteryStatus.Warning]: {
    icon: 'IconBatteryWarning',
    class: 'text-red-500',
  },
};

const batteryStatus = computed(() => {
  return statusConfigMap[getBatteryStatus(props.batteryLevel || 0)];
});
</script>

<style lang="css" scoped></style>
