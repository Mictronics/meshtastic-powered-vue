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
      >
        <h3 class="font-bold">{{ node.longName || 'Node ' + node.nodeNumber }}</h3>
        <hr class="my-1" />
        <p class="text-sm text-slate-700 dark:text-slate-400">Last position {{ timeAgo }}</p>
      </Popover>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { MglMarker } from '@indoorequal/vue-maplibre-gl';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import type { FormattedNode } from '@/composables/core/utils/types';
import { useTimeAgoIntl } from '@vueuse/core';

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
const lastSeenMs = computed(() => {
  const p = props.node.position;
  if (!p) return 0;

  return p.timestamp + p.timestampMillisAdjust;
});
const timeAgo = useTimeAgoIntl(lastSeenMs);
const scale = computed(() => Math.min(1, Math.max(0.6, props.zoom / 9)));

const popup = ref<any>();
const togglePopover = (event: MouseEvent) => {
  emit('select', props.node.nodeNumber);
  popup.value?.toggle(event);
};
</script>
