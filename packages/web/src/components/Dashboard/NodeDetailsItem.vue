<template>
  <div v-if="value" class="flex flex-col p-2 rounded-xl border border-slate-100 bg-slate-50/50">
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
defineProps<{
  label?: string;
  value?: string | number;
}>();
</script>
