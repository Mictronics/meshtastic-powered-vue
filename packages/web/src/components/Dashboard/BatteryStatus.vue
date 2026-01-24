<template>
  <transition name="fade" mode="out-in">
    <component
      :class="batteryStatus.class"
      :size="20"
      :is="batteryStatus.icon"
      :key="batteryLevel"
    />
  </transition>
</template>

<script setup lang="ts">
import {
  BatteryCharging,
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
} from 'lucide-vue-next';
import { computed, type Component } from 'vue';
const props = defineProps<{
  batteryLevel?: number;
}>();

interface StatusConfig {
  icon: Component;
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
    icon: BatteryCharging,
    class: 'text-sky-500/50',
  },
  [BatteryStatus.Full]: {
    icon: BatteryFull,
    class: 'text-lime-500/50',
  },
  [BatteryStatus.Medium]: {
    icon: BatteryMedium,
    class: 'text-yellow-500',
  },
  [BatteryStatus.Low]: {
    icon: BatteryLow,
    class: 'text-orange-500',
  },
  [BatteryStatus.Warning]: {
    icon: BatteryWarning,
    class: 'text-red-500',
  },
};

const level = computed(() => props.batteryLevel ?? 0);
const batteryStatus = computed(() => statusConfigMap[getBatteryStatus(level.value)]);
</script>

<style lang="css" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
