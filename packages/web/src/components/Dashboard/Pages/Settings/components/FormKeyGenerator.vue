<template>
  <div class="contents">
    <div class="flex flex-row gap-1 pb-1">
      <Select
        aria-label="Select key length"
        label-class="dark:bg-slate-800 dark:text-slate-400"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        :options="keyOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Length"
        v-model="pskSize"
        :disabled="fixedKey32"
      />
      <Button size="small" severity="success" @click="generatePreSharedKey">Generate</Button>
    </div>
    <InputGroup>
      <Password
        input-class="dark:bg-slate-800 dark:text-slate-400"
        v-model="privateKey"
        toggleMask
        size="small"
        :feedback="false"
        :invalid="!!error"
        @input="onPrivateKeyUpdate"
      />
      <InputGroupAddon>
        <Button
          :disabled="!isSupported || !privateKey"
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
import { getX25519PrivateKey, getX25519PublicKey } from '@/composables/useX25519';
import { tryDecodeBase64 } from '@/composables/useBase64KeyValidator';

export type Key = 0 | 1 | 16 | 32;
export interface PreSharedKeyUpdate {
  privateKey: string;
  publicKey: string;
  length: 0 | 1 | 16 | 32;
}

const props = withDefaults(
  defineProps<{
    initialKey: string;
    initialKeySize: Key;
    error?: string | boolean;
    fixedKey32?: boolean;
  }>(),
  {
    error: false,
    fixedKey32: false,
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
const privateKey = ref(props.initialKey);
const publicKey = ref('');
const pskSize = ref<Key>(props.initialKeySize);
const { copy, copied, isSupported } = useClipboard();

const generatePreSharedKey = async () => {
  const confirmed = await open({
    header: 'Generate key?',
    message: 'The existing key will be overwritten.',
    acceptLabel: 'Generate',
    cancelLabel: 'Cancel',
  });

  if (!confirmed) return;

  if (props.fixedKey32) {
    pskSize.value = 32;
  }

  const size = Number(pskSize.value) || 0;

  if (size === 0) {
    privateKey.value = '';
    publicKey.value = '';
  } else if (size === 32) {
    const pk = getX25519PrivateKey();
    privateKey.value = fromByteArray(pk);
    publicKey.value = fromByteArray(getX25519PublicKey(pk));
  } else {
    try {
      const bytes = new Uint8Array(size);
      const cryptoApi = (globalThis as any).crypto || (window as any).crypto;
      cryptoApi.getRandomValues(bytes);
      privateKey.value = fromByteArray(bytes);
    } catch {
      privateKey.value = '';
    }
    publicKey.value = '';
  }

  emitUpdate();
};

const onPrivateKeyUpdate = () => {
  if (props.fixedKey32) {
    pskSize.value = 32;
  }

  if (pskSize.value === 32) {
    const decoded = tryDecodeBase64(privateKey.value);
    if (decoded && decoded.length === 32) {
      publicKey.value = fromByteArray(getX25519PublicKey(decoded));
    } else {
      publicKey.value = '';
    }
  } else {
    publicKey.value = '';
  }
};

const emitUpdate = () => {
  emit('updateKey', {
    privateKey: privateKey.value,
    publicKey: publicKey.value,
    length: pskSize.value,
  });
};

watchDebounced(
  [privateKey, pskSize],
  () => {
    emitUpdate();
  },
  { debounce: 300 }
);

const copyKey = async () => {
  try {
    await copy(privateKey.value);
  } catch {}
};
</script>
