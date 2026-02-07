<template>
  <div v-if="filteredItems.length > 0" class="grid gap-2 grid-cols-3" :class="gridClass">
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

const gridClass = computed(() => `grid-cols-${props.columns}!`);

const filteredItems = computed(() => {
  return props.items.filter(
    (item) =>
      item.value !== undefined && item.value !== null && item.value !== '—' && item.value !== ''
  );
});
</script>
