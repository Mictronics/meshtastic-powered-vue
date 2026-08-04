<template>
  <div v-if="filteredItems.length > 0" class="grid gap-2" :style="gridStyle">
    <NodeDetailsItem v-for="item in filteredItems" :key="item.label" v-bind="item" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import NodeDetailsItem from '@/components/Dashboard/Pages/NodeView/NodeDetailsItem.vue';

type MetricItem = {
  label: string;
  value: string | number | undefined;
  class?: string;
};

const props = withDefaults(
  defineProps<{
    items: MetricItem[];
    columns?: number;
  }>(),
  {
    columns: 3,
  }
);

// Tailwind's build-time scanner can't see a runtime-interpolated class name, so the column count
// is set via an inline style instead of a dynamic `grid-cols-${n}` class.
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` }));

const filteredItems = computed(() => {
  return props.items.filter(
    (item) =>
      item.value !== undefined && item.value !== null && item.value !== '—' && item.value !== ''
  );
});
</script>
