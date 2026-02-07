<template>
  <div>
    {{ title }}
    <span v-if="dirty" class="ml-2 text-orange-500 text-sm" aria-label="unsaved changes">●</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  dirty: boolean;
}>();
</script>
