<template>
  <div class="contents">
    <Listbox
      v-model="positionFlagsArray"
      :options="flags"
      multiple
      optionLabel="name"
      class="dark:bg-slate-800 dark:text-slate-400"
      checkmark
      :highlightOnSelect="false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const positionFlags = defineModel<number>('positionFlags', {
  default: 0,
});

const positionFlagsArray = computed({
  get() {
    const value = positionFlags.value ?? 0;
    return flags.value.filter((f) => (value & f.bit) === f.bit);
  },
  set(selected) {
    positionFlags.value = selected.reduce((sum, item) => sum + item.bit, 0);
  },
});
const flags = ref([
  { name: 'Altitude', bit: 1 },
  { name: 'Altitude is Mean Sea Level', bit: 2 },
  { name: 'Geoidal Separation', bit: 4 },
  { name: 'DOP', bit: 8 },
  { name: 'HDOP & VDOP', bit: 16 },
  { name: 'Satellites in view', bit: 32 },
  { name: 'Sequence number', bit: 64 },
  { name: 'Timestamp', bit: 128 },
  { name: 'Heading', bit: 256 },
  { name: 'Speed', bit: 512 },
]);
</script>
