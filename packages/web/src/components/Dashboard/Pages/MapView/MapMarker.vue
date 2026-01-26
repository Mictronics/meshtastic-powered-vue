<template>
  <mgl-marker :coordinates="[lng, lat]" anchor="center">
    <template v-slot:marker>
      <div
        class="transition-transform duration-200"
        :style="{ transform: `scale(${scale})` }"
        @click="togglePopover"
      >
        <NodeAvatar
          :nodeNumber="node.nodeNumber"
          :shortName="node.shortName"
          :isFavorite="node.isFavorite"
          :class="{ 'ring-2 ring-sky-400 dark:ring-sky-600 rounded-full': selected }"
        />
      </div>
      <Popover
        ref="popup"
        class="rounded-xl! border-slate-200! dark:border-slate-600! bg-white dark:bg-slate-800"
        pt:content:style="padding: 0.3rem !important"
      >
        <h3 class="font-medium text-slate-800 dark:text-slate-400 mb-1 truncate">
          {{ node.longName }}
        </h3>
        <hr class="my-1" />
        <div class="flex justify-between">
          <NodeFeatures :node="node" />
          <MessageSquare :size="15" />
        </div>
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-slate-500">
            <span>
              {{ node.shortName }}
            </span>
            <span>
              {{ hexNodeNumber }}
            </span>
          </div>
          <div class="flex justify-between gap-3 text-xs text-slate-500">
            <span>
              {{ node.hwModel }}
            </span>
            <span>
              {{ node.snr }}
            </span>
          </div>
          <div class="flex justify-between gap-3 text-xs text-slate-500">
            <span>{{ node.hopsAway }} {{ lastHeard }}</span>
            <BatteryStatus
              v-if="!!node.deviceMetrics"
              :batteryLevel="node.deviceMetrics.batteryLevel"
            />
          </div>
        </div>
        <hr class="my-1" />
        <div class="space-y-1">
          <div class="flex justify-around text-xs text-slate-800 dark:text-slate-400">
            <MountainSnow v-if="!!node.position?.altitude" />
            <span v-if="!!node.deviceMetrics?.channelUtilization">Channel Util.</span>
            <span v-if="!!node.deviceMetrics?.airUtilTx">Air TX</span>
          </div>
          <div class="flex justify-around text-xs text-slate-500">
            <span v-if="!!node.position?.altitude">{{ `${node.position?.altitude} m` }}</span>
            <span v-if="!!node.deviceMetrics?.channelUtilization">
              {{ node.deviceMetrics?.channelUtilization }}
            </span>
            <span v-if="!!node.deviceMetrics?.airUtilTx">
              {{ node.deviceMetrics?.airUtilTx }}
            </span>
          </div>
        </div>
      </Popover>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import { MountainSnow, MessageSquare } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { MglMarker } from '@indoorequal/vue-maplibre-gl';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import NodeFeatures from '@/components/Dashboard/Pages/NodeView/NodeFeatures.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import type { FormattedNode } from '@/composables/core/utils/types';
import { formatTimeAgoIntl } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';

const props = defineProps<{
  node: FormattedNode;
  selected?: boolean;
  zoom: number;
}>();

const emit = defineEmits<{
  (e: 'select', nodeNumber: number): void;
}>();

const lat = computed(() => props.node.position?.latitudeI ?? 0);
const lng = computed(() => props.node.position?.longitudeI ?? 0);
const lastHeard = computed(() => {
  const date = new Date(0);
  date.setUTCSeconds(props.node.lastHeard);
  return formatTimeAgoIntl(date);
});
const hexNodeNumber = computed(() => '!' + numberToHexUnpadded(props.node.nodeNumber));
const scale = computed(() => Math.min(1, Math.max(0.6, props.zoom / 9)));

const popup = ref<any>();
const togglePopover = (event: MouseEvent) => {
  emit('select', props.node.nodeNumber);
  popup.value?.toggle(event);
};
</script>

<style lang="css" scoped>
.p-popover-content {
  padding: 0.3rem !important;
}
</style>
