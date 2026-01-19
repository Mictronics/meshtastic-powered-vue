<template>
  <div class="flex gap-4">
    <Button
      v-for="btn in buttonState"
      :key="btn.key"
      :modelValue="btn.active"
      size="small"
      severity="success"
      class="border-slate-200! dark:border-slate-600!"
      :class="{
        'bg-slate-50/50 text-slate-700': !btn.active,
        'dark:bg-slate-900 dark:text-slate-400': !btn.active,
      }"
      @click="toggleSort(btn.key)"
      v-tooltip.bottom="{
        value: btn.toolTip,
        showDelay: 1000,
        hideDelay: 300,
        pt: {
          text: 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-400 text-sm',
        },
      }"
    >
      <component :is="btn.icon" :size="18" />
      <span v-if="btn.active" class="flex gap-1 text-xs">
        {{ btn.order + 1 }}
        <ArrowDownWideNarrow v-if="btn.dir === 'asc'" :size="15" />
        <ArrowUpWideNarrow v-else-if="btn.dir === 'desc'" :size="15" />
      </span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import {
  Star,
  Ear,
  Rabbit,
  List,
  TableOfContents,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Signal,
  Battery,
} from 'lucide-vue-next';
import { watch, computed, ref, onMounted } from 'vue';
import * as _ from 'lodash-es';
import type { SortDir, SortState, ButtonKey, ButtonsMap } from './types';
import { useAppStore } from '@/composables/core/stores/app/useAppStore';

const emit = defineEmits<{
  (e: 'sortToggle', keys: string[], dirs: SortDir[]): void;
}>();

const buttons: ButtonsMap = {
  shortName: { icon: List, toolTip: 'Short Name' },
  longName: { icon: TableOfContents, toolTip: 'Long Name' },
  isFavorite: { icon: Star, toolTip: 'Is Favorite' },
  lastHeard: { icon: Ear, toolTip: 'Last Heard' },
  numHops: { icon: Rabbit, toolTip: 'Hop Count' },
  numSnr: { icon: Signal, toolTip: 'Signal' },
  batteryLevel: { icon: Battery, toolTip: 'Battery Level' },
};

const sortState = ref<Partial<Record<ButtonKey, SortState>>>({});

const toggleSort = (key: ButtonKey) => {
  const current = sortState.value[key];
  // OFF → ASC
  if (!current) {
    sortState.value[key] = {
      dir: 'asc',
      order: Object.keys(sortState.value).length,
    };
    return;
  }
  // ASC → DESC
  if (current.dir === 'asc') {
    current.dir = 'desc';
    return;
  }
  // DESC → OFF
  delete sortState.value[key];
  // Recompute orders
  Object.values(sortState.value)
    .sort((a, b) => a.order - b.order)
    .forEach((s, i) => (s.order = i));
};

const buttonState = computed(() => {
  return (Object.keys(buttons) as ButtonKey[]).map((key) => {
    const state = sortState.value[key];
    return {
      key,
      icon: buttons[key].icon,
      toolTip: buttons[key].toolTip,
      active: !!state,
      dir: state?.dir || 'desc',
      order: state?.order || 0,
    };
  });
});

watch(
  sortState,
  () => {
    const keys = Object.entries(sortState.value)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([key]) => key);
    const dirs = keys.map((key) => sortState.value[key as ButtonKey]!.dir);
    emit('sortToggle', keys, dirs);
    saveToStorage();
  },
  { deep: true }
);

const appData = useAppStore().appData;
const saveToStorage = () => {
  appData.sortState = sortState.value;
};

const restoreFromStorage = () => {
  sortState.value = appData.sortState;
};

onMounted(restoreFromStorage);
</script>
