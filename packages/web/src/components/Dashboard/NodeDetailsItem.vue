<template>
  <div
    v-if="value"
    class="relative flex flex-col p-2 rounded-xl border border-slate-100 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800"
  >
    <component
      v-if="props.isPublicKeyVerified !== undefined"
      :is="iconComponent"
      class="absolute top-2 right-2"
      :class="iconColorClass"
      :size="15"
      v-tooltip="{ value: 'Public Key Verification', showDelay: 1000, hideDelay: 300 }"
    />

    <div class="flex items-center gap-2 mb-1">
      <span
        class="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-700 tracking-wider"
      >
        {{ label }}:
      </span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-slate-700 dark:text-slate-400">
        {{ value }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { ShieldCheck, ShieldX } from 'lucide-vue-next';

const props = defineProps({
  label: String,
  value: [String, Number],
  isPublicKeyVerified: {
    type: Boolean,
    default: undefined, // Enforce tri-state variable. Otherwise false by default.
  },
});

const iconComponent = computed<Component | null>(() => {
  if (props.isPublicKeyVerified === undefined) return null;
  return props.isPublicKeyVerified ? ShieldCheck : ShieldX;
});

const iconColorClass = computed(() => {
  if (props.isPublicKeyVerified === undefined) return '';
  return props.isPublicKeyVerified ? 'text-lime-500' : 'text-red-500';
});
</script>
