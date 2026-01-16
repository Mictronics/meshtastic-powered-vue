<template>
  <div
    v-if="value"
    class="relative flex flex-col p-2 rounded-xl border border-slate-100 bg-slate-50/50"
  >
    <component
      v-if="props.isPublicKeyVerified !== undefined"
      :is="iconComponent"
      class="absolute top-2 right-2 text-slate-500"
      :size="16"
    />

    <div class="flex items-center gap-2 mb-1">
      <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
        {{ label }}:
      </span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-sm text-slate-700">
        {{ value }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { ShieldCheck, ShieldX } from 'lucide-vue-next';

const props = defineProps<{
  label?: string;
  value?: string | number;
  isPublicKeyVerified?: { type: boolean; default: undefined };
}>();

// Compute icon component only if isPublicKeyVerified is boolean
const iconComponent = computed<Component | null>(() => {
  if (props.isPublicKeyVerified === undefined) return null;
  return props.isPublicKeyVerified ? ShieldCheck : ShieldX;
});
</script>
