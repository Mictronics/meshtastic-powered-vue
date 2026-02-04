<template>
  <label v-if="label" :for="forId" class="font-medium">
    {{ label }}
  </label>

  <div>
    <slot />
  </div>

  <p v-if="description" class="text-slate-400">
    {{ description }}
  </p>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  description?: string;
  forId?: string;
}>();
</script>
