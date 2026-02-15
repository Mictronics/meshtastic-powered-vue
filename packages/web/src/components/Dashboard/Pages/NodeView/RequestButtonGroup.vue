<template>
  <div class="grid grid-cols-2 gap-2">
    <Button severity="secondary" size="small" @click="handleNodeInfo">
      <CircleQuestionMark :size="15" />
      Node Info
    </Button>
    <Button
      v-for="item in telemetryButtons"
      :key="item.type"
      severity="secondary"
      size="small"
      @click="handleTelemetry(item.type)"
    >
      <component :is="item.icon" :size="15" />
      {{ item.label }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import {
  CircleQuestionMark,
  Cpu,
  ThermometerSun,
  Wind,
  Zap,
  ChartArea,
  Server,
  Users,
  Satellite,
} from 'lucide-vue-next';
import { useRequest, TelemetryType } from '@/composables/useRequest';

const props = defineProps<{
  nodeNumber: number;
}>();

const showDrawer = defineModel<boolean>('showDrawer');

const { requestNodeInfo, requestTelemetry } = useRequest();

const telemetryButtons = [
  { label: 'Device Metrics', type: TelemetryType.DEVICE, icon: Cpu },
  { label: 'Environment Metrics', type: TelemetryType.ENVIRONMENT, icon: ThermometerSun },
  { label: 'Air Quality Metrics', type: TelemetryType.AIR_QUALITY, icon: Wind },
  { label: 'Power Metrics', type: TelemetryType.POWER, icon: Zap },
  { label: 'Local Stats', type: TelemetryType.LOCAL_STATS, icon: ChartArea },
  { label: 'Host Metrics', type: TelemetryType.HOST, icon: Server },
  { label: 'Pax Counter', type: TelemetryType.PAX, icon: Users },
  { label: 'Position', type: TelemetryType.POSITION, icon: Satellite },
];

const handleNodeInfo = () => {
  requestNodeInfo(props.nodeNumber);
  showDrawer.value = false;
};

const handleTelemetry = (type: TelemetryType) => {
  requestTelemetry(props.nodeNumber, type);
  showDrawer.value = false;
};
</script>
