<template>
  <div class="p-2 rounded-xl! border-slate-200! dark:border-slate-600! bg-white dark:bg-slate-800">
    <h3 class="text-lg font-medium text-slate-800 dark:text-slate-400 mb-1 truncate">
      {{ node?.longName }}
    </h3>

    <hr class="my-1 text-slate-600 dark:text-slate-400" />

    <div class="flex justify-between">
      <NodeFeatures v-if="node" :node="node" />
      <MessageSquare :size="15" />
    </div>

    <div class="space-y-1">
      <div class="flex justify-between text-xs text-slate-500">
        <span>{{ node?.shortName }}</span>
        <span>{{ hexNodeNumber }}</span>
      </div>

      <div class="flex justify-between gap-3 text-xs text-slate-500">
        <span>{{ node?.hwModel }}</span>
        <span>{{ node?.snr }}</span>
      </div>

      <div class="flex justify-between gap-3 text-xs text-slate-500">
        <span>{{ node?.hopsAway }} {{ lastHeard }}</span>
        <BatteryStatus
          v-if="!!node?.deviceMetrics"
          :batteryLevel="node?.deviceMetrics.batteryLevel"
        />
      </div>
    </div>

    <hr class="my-1 text-slate-600 dark:text-slate-400" />

    <div class="space-y-1">
      <div class="flex justify-around text-xs text-slate-800 dark:text-slate-400">
        <MountainSnow v-if="!!node?.position?.altitude" />
        <span v-if="!!node?.deviceMetrics?.channelUtilization">Channel Util.</span>
        <span v-if="!!node?.deviceMetrics?.airUtilTx">Air TX</span>
      </div>

      <div class="flex justify-around text-xs text-slate-500">
        <span v-if="!!node?.position?.altitude">{{ node?.position.altitude }} m</span>
        <span v-if="!!node?.deviceMetrics?.channelUtilization">
          {{ node?.deviceMetrics.channelUtilization }}
        </span>
        <span v-if="!!node?.deviceMetrics?.airUtilTx">
          {{ node?.deviceMetrics.airUtilTx }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { MountainSnow, MessageSquare } from 'lucide-vue-next';
import { formatTimeAgoIntl } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';

import NodeFeatures from '@/components/Dashboard/Pages/NodeView/NodeFeatures.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import type { FormattedNode } from '@/composables/core/utils/types';

const props = defineProps<{
  node: FormattedNode | null;
}>();

const lastHeard = computed(() => {
  if (!props.node) return '';
  const date = new Date(0);
  date.setUTCSeconds(props.node.lastHeard);
  return formatTimeAgoIntl(date);
});

const hexNodeNumber = computed(() =>
  props.node ? '!' + numberToHexUnpadded(props.node.nodeNumber) : ''
);
</script>
