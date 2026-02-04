<template>
  <Button
    aria-label="Save changes"
    severity="secondary"
    variant="outlined"
    class="px-2 py-2 z-50 bg-white dark:bg-slate-600"
    :disabled="disabled"
    :class="[{ ' text-sky-400 dark:text-sky-600': !disabled }, { 'bounce-once': bounce }]"
    @click="$emit('saveSettings')"
    v-tooltip.right="{
      value: 'Save settings',
      showDelay: 100,
      hideDelay: 500,
      pt: {
        text: 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 text-sm',
      },
    }"
  >
    <Save />
  </Button>
</template>

<script setup lang="ts">
import { Save } from 'lucide-vue-next';
import { ref, watch } from 'vue';

const emit = defineEmits<{
  (e: 'saveSettings'): void;
}>();

const props = defineProps<{
  disabled: boolean;
}>();

const bounce = ref(false);

watch(
  () => props.disabled,
  (disabled) => {
    if (!disabled) {
      bounce.value = true;
      setTimeout(() => {
        bounce.value = false;
      }, 3000);
    }
  }
);
</script>

<style scoped>
@keyframes bounce-3s {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.bounce-once {
  animation: bounce-3s 3s ease;
}
</style>
