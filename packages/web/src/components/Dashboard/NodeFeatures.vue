<template>
  <div class="flex gap-2 items-center">
    <Lock
      v-if="node.encryptionStatus === EncryptionStatus.Encrypted"
      :size="20"
      class="encryption-lock-icon"
      v-tooltip.right="tooltipPreset('Encrypted')"
    />
    <LockOpen
      v-else-if="node.encryptionStatus === EncryptionStatus.NotEncrypted"
      :size="20"
      class="encryption-unlock-icon"
      v-tooltip.right="tooltipPreset('Not encrypted')"
    />
    <KeyRound
      v-else
      :size="20"
      class="encryption-key-icon"
      v-tooltip.right="tooltipPreset('Encryption key error')"
    />
    <MessageSquareOff
      v-if="node.isUnmessagable"
      :size="20"
      class="unmessagable-icon"
      v-tooltip.right="tooltipPreset('Unmessagable')"
    />
    <ThermometerSun
      v-if="!!node.environmentMetrics"
      :size="20"
      class="feature-icon"
      v-tooltip.right="tooltipPreset('Environment Metrics')"
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
  </div>
</template>

<script setup lang="ts">
import {
  Lock,
  LockOpen,
  KeyRound,
  MessageSquareOff,
  ThermometerSun,
  Zap,
  Satellite,
  Network,
  Server,
} from 'lucide-vue-next';
import type { FormattedNode } from '@/composables/core/utils/types';
import { EncryptionStatus } from '@/composables/core/utils/useFormattedNodeDatabase';

defineProps<{
  node: FormattedNode;
}>();

const tooltipPreset = (value: string) => ({
  value,
  showDelay: 300,
  hideDelay: 300,
  pt: {
    text: 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 text-sm',
  },
});
</script>

<style lang="css" scoped>
.encryption-lock-icon {
  color: oklch(76.8% 0.233 130.85);
}

.encryption-unlock-icon {
  color: oklch(79.5% 0.184 86.047);
}

.encryption-key-icon {
  color: oklch(70.4% 0.191 22.216);
}

.unmessagable-icon {
  color: oklch(70.4% 0.191 22.216);
}

.feature-icon {
  color: oklch(55.4% 0.046 257.417);
}
</style>
