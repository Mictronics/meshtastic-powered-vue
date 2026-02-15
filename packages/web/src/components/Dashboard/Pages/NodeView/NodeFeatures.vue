<template>
  <div class="flex gap-2 items-center">
    <ThermometerSun
      v-if="!!node.environmentMetrics"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Environment Metrics')"
    />
    <AirVent
      v-if="!!node.airQualityMetrics"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Air Quality')"
    />
    <Zap
      v-if="!!node.powerMetrics"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Power Metrics')"
    />
    <Satellite
      v-if="!!node.position"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Position')"
    />
    <Network
      v-if="node.viaMqtt"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Via MQTT')"
    />
    <Server
      v-if="!!node.hostMetrics"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Host Metrics')"
    />
    <ChartArea
      v-if="!!node.localStats"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Local Stats')"
    />
    <MessageSquareOff
      v-if="node.isUnmessagable"
      :size="20"
      class="alert-icon"
      v-tooltip.right="tooltipPreset('Unmessagable')"
    />
    <Lock
      v-if="node.encryptionStatus === EncryptionStatus.Encrypted"
      :size="20"
      class="valid-icon"
      v-tooltip.right="tooltipPreset('Encrypted')"
    />
    <KeyRoundQuestionMark
      v-else-if="node.encryptionStatus === EncryptionStatus.NotEncrypted"
      :size="20"
      class="warn-icon"
      v-tooltip.right="tooltipPreset('Not encrypted')"
    />
    <KeyRound
      v-else
      :size="20"
      class="alert-icon"
      v-tooltip.right="tooltipPreset('Encryption key error')"
    />
  </div>
</template>

<script setup lang="ts">
import {
  Lock,
  KeyRound,
  MessageSquareOff,
  ThermometerSun,
  Zap,
  Satellite,
  Network,
  Server,
  AirVent,
  ChartArea,
} from 'lucide-vue-next';
import KeyRoundQuestionMark from '@/components/Icons/KeyRoundQuestionMark.vue';
import type { FormattedNode } from '@/composables/types';
import { EncryptionStatus } from '@/composables/stores/nodeDB/useFormattedNodeDatabase';

defineProps<{
  node: FormattedNode;
}>();

const tooltipPreset = (value: string) => ({
  value,
  showDelay: 300,
  hideDelay: 300,
  pt: {
    text: 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 text-sm',
  },
});
</script>

<style lang="css" scoped>
.valid-icon {
  color: var(--color-lime-500);
  opacity: 50%;
}

.warn-icon {
  color: var(--color-yellow-500);
}

.alert-icon {
  color: var(--color-red-400);
}

.feature-icon {
  color: var(--color-slate-500);
  opacity: 50%;
}
</style>
