<template>
  <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
    <component :class="batteryStatus.class" :size="20" :is="batteryStatus.icon" />
    <p>{{ batteryStatus.text }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, type Ref } from 'vue';
const props = defineProps<{
  batteryLevel: any;
}>();

interface StatusConfig {
  icon: string;
  class: string;
  text: Ref<string, string>;
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

const getBatteryPercentage = ref('N/A');
const statusConfigMap: Record<BatteryStatus, StatusConfig> = {
  [BatteryStatus.PluggedIn]: {
    icon: 'IconBatteryCharging',
    class: 'text-sky-500',
    text: ref('Plugged in'),
  },
  [BatteryStatus.Full]: {
    icon: 'IconBatteryFull',
    class: 'text-lime-500',
    text: getBatteryPercentage,
  },
  [BatteryStatus.Medium]: {
    icon: 'IconBatteryMedium',
    class: 'text-yellow-500',
    text: getBatteryPercentage,
  },
  [BatteryStatus.Low]: {
    icon: 'IconBatteryLow',
    class: 'text-orange-500',
    text: getBatteryPercentage,
  },
  [BatteryStatus.Warning]: {
    icon: 'IconBatteryWarning',
    class: 'text-red-500',
    text: getBatteryPercentage,
  },
};

const batteryStatus = ref(statusConfigMap[getBatteryStatus(0)]);
watch(props.batteryLevel, (n) => {
  batteryStatus.value = statusConfigMap[getBatteryStatus(n)];
  getBatteryPercentage.value = n !== undefined ? `Battery: ${n} %` : 'N/A';
});
</script>

<style lang="css" scoped></style>
