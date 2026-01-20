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
  border-bottom: 1px solid var(--color-slate-200);
}

.dark .divider::before,
.dark .divider::after {
  border-bottom: 1px solid var(--color-slate-600);
}

.divider::before {
  margin-right: 10px;
}

.divider::after {
  margin-left: 10px;
}
</style>
