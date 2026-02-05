<template>
  <div class="contents">
    <label v-if="label" :for="forId" class="font-medium">
      {{ label }}
    </label>

    <div>
      <slot />
      <p v-if="error" class="text-red-400 dark:text-red-600 text-xs">{{ error }}</p>
    </div>

    <p v-if="description" class="text-slate-400">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    forId?: string;
    error?: string | boolean;
  }>(),
  {
    error: false,
  }
);
</script>
