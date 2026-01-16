<template>
  <header class="w-full">
    <div class="flex justify-between items-center dashboard-header px-1">
      <Button severity="secondary" rounded variant="outlined" @click="$emit('eventToggleSidebar')">
        <Menu :size="15" />
      </Button>
      <div class="flex space-x-3 items-center justify-center gap-2"></div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu } from 'lucide-vue-next';
const emit = defineEmits<{
  (e: 'eventToggleSidebar'): void;
}>();
</script>
