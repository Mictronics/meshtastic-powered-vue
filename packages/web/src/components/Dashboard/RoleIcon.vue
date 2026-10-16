<template>
  <span
    v-if="svg"
    class="inline-block size-5 [&>svg]:size-full"
    v-html="svg"
    v-tooltip.bottom="{
      value: role,
      showDelay: 50,
      hideDelay: 300,
      pt: { text: 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 text-xs' },
    }"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ role?: string }>();

const icons = import.meta.glob<string>('../../assets/roles/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

// Formatted role is the enum name with underscores replaced by spaces.
const svg = computed(() => icons[`../../assets/roles/${props.role?.replaceAll(' ', '_')}.svg`]);
</script>
