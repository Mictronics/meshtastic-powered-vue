<template>
  <div class="divider">
    <span class="text-nowrap text-sm text-slate-400">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style lang="css" scoped>
.divider {
  display: flex;
  align-items: center;
  text-align: center;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid oklch(96.8% 0.007 247.896);
}

.dark .divider::before,
.dark .divider::after {
  border-bottom: 1px solid oklch(44.6% 0.043 257.281);
}

.divider::before {
  margin-right: 10px;
}

.divider::after {
  margin-left: 10px;
}
</style>
