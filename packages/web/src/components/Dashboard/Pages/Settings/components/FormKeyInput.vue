<template>
  <div class="contents">
    <InputGroup>
      <InputText
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        :feedback="false"
        :invalid="!!error"
        :disabled="disabled"
        v-model="base64Key"
      />
      <InputGroupAddon>
        <Button
          :disabled="!isSupported || !base64Key"
          size="small"
          variant="text"
          severity="secondary"
          @click="copyKey"
        >
          <CopyCheck v-if="copied" :size="15" />
          <Copy v-else :size="15" />
        </Button>
        <span class="pe-1 text-sm">256 Bit</span>
      </InputGroupAddon>
    </InputGroup>
    <p v-if="error" class="text-red-400 dark:text-red-600 text-xs">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { Copy, CopyCheck } from 'lucide-vue-next';

const base64Key = defineModel<string>('base64Key');

const props = withDefaults(
  defineProps<{
    error?: string | boolean;
    disabled?: boolean;
  }>(),
  {
    error: false,
    disabled: false,
  }
);

const { copy, copied, isSupported } = useClipboard();
const copyKey = async () => {
  try {
    await copy(base64Key.value ?? '');
  } catch {}
};
</script>
