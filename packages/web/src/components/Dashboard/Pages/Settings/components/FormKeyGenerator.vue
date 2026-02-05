<template>
  <div class="contents">
    <div class="flex flex-row gap-1 pb-1">
      <Select
        aria-label="Select key length"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        :options="keyOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Length"
        v-model="pskSize"
      />
      <Button size="small" severity="success" @click="generatePreSharedKey">Generate</Button>
    </div>
    <InputGroup>
      <Password
        v-model="preSharedKey"
        toggleMask
        size="small"
        :feedback="false"
        :invalid="!!error"
      />
      <InputGroupAddon>
        <Button
          :disabled="!isSupported || !preSharedKey"
          size="small"
          variant="text"
          severity="secondary"
          @click="copyKey"
        >
          <CopyCheck v-if="copied" :size="15" />
          <Copy v-else :size="15" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
    <p v-if="error" class="text-red-400 dark:text-red-600 text-xs">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useClipboard, watchDebounced } from '@vueuse/core';
import { Copy, CopyCheck } from 'lucide-vue-next';
import { useConfirm } from '@/composables/useConfirmDialog';
import { fromByteArray } from 'base64-js';

type Key = 0 | 1 | 16 | 32;
export interface PreSharedKeyUpdate {
  key: string;
  length: 0 | 1 | 16 | 32 | number;
}

const props = withDefaults(
  defineProps<{
    initialKey: string;
    initialKeySize: Key | number;
    error?: string | boolean;
  }>(),
  {
    error: false,
  }
);

const emit = defineEmits<{
  (e: 'updateKey', payload: PreSharedKeyUpdate): void;
}>();

const keyOptions: { label: string; value: Key }[] = [
  { label: '256 Bit', value: 32 },
  { label: '128 Bit', value: 16 },
  { label: '8 Bit', value: 1 },
  { label: 'Empty', value: 0 },
];

const { open } = useConfirm();
const preSharedKey = ref(props.initialKey);
const pskSize = ref<Key | number>(props.initialKeySize);
const { copy, copied, isSupported } = useClipboard();

const generatePreSharedKey = async () => {
  const confirmed = await open({
    header: 'Generate pre-shared key?',
    message: 'The existing key will be overwritten.',
    acceptLabel: 'Generate',
    cancelLabel: 'Cancel',
  });

  if (!confirmed) return;

  const size = Number(pskSize.value) || 0;

  if (size === 0) {
    preSharedKey.value = '';
  } else {
    try {
      const bytes = new Uint8Array(size);
      const cryptoApi = (globalThis as any).crypto || (window as any).crypto;
      cryptoApi.getRandomValues(bytes);
      preSharedKey.value = fromByteArray(bytes);
    } catch (e) {
      preSharedKey.value = '';
    }
  }

  emitUpdate();
};

const emitUpdate = () => {
  emit('updateKey', {
    key: preSharedKey.value,
    length: pskSize.value,
  });
};

watchDebounced(
  [preSharedKey, pskSize],
  () => {
    emitUpdate();
  },
  { debounce: 300 }
);

const copyKey = async () => {
  try {
    await copy(preSharedKey.value);
  } catch {}
};
</script>
