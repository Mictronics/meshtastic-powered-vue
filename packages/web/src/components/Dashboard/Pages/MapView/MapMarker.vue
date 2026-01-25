<template>
  <mgl-marker :coordinates="[lng, lat]" anchor="center">
    <template v-slot:marker>
      <NodeAvatar
        :nodeNumber="node.nodeNumber"
        :shortName="node.shortName"
        :isFavorite="node.isFavorite"
        @mouseenter="popup.value?.show($event)"
        @mouseleave="popup.value?.hide()"
        @click="togglePopover"
      />
      <Popover
        ref="popup"
        class="rounded-xl! border-slate-200! dark:border-slate-600! bg-white dark:bg-slate-800"
      >
        <h3 class="font-bold">{{ node.longName || 'Node ' + node.nodeNumber }}</h3>
        <hr class="my-1" />
      </Popover>
    </template>
  </mgl-marker>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { MglMarker } from '@indoorequal/vue-maplibre-gl';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import type { FormattedNode } from '@/composables/core/utils/types';

const props = defineProps<{
  node: FormattedNode;
}>();

const lat = computed(() => props.node.position?.latitudeI ?? 0);
const lng = computed(() => props.node.position?.longitudeI ?? 0);

const popup = ref<any>();
const togglePopover = (event: MouseEvent) => {
  popup.value?.toggle(event);
};
</script>
