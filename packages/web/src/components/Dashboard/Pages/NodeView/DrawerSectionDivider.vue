<template>
  <div class="divider">
    <span class="text-nowrap text-sm text-slate-400">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>
