<template>
  <div class="flex gap-2 items-center">
    <Lock
      v-if="node.encryptionStatus === EncryptionStatus.Encrypted"
      :size="20"
      class="encryption-lock-icon"
    />
    <LockOpen
      v-else-if="node.encryptionStatus === EncryptionStatus.NotEncrypted"
      :size="20"
      class="encryption-unlock-icon"
    />
    <KeyRound v-else :size="20" class="encryption-key-icon" />
    <MessageSquareOff v-if="node.isUnmessagable" :size="20" class="unmessagable-icon" />
    <ThermometerSun v-if="!!node.environmentMetrics" :size="20" class="feature-icon" />
    <Zap v-if="!!node.powerMetrics" :size="20" class="feature-icon" />
    <Satellite v-if="!!node.position" :size="20" class="feature-icon" />
    <Network v-if="node.viaMqtt" :size="20" class="feature-icon" />
    <Server v-if="!!node.hostMetrics" :size="20" class="feature-icon" />
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
