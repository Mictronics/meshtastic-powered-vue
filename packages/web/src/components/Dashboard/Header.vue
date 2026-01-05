<template>
  <header class="w-full">
    <div class="flex justify-between items-center dashboard-header px-1">
      <Button severity="secondary" rounded variant="outlined" @click="$emit('eventToggleSidebar')">
        <IconMenu :size="15" />
      </Button>
      <div class="flex space-x-3 items-center justify-center gap-2"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'eventToggleSidebar'): void;
}>();
</script>
