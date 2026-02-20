<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Node Status Module</h4>
      <p class="text-slate-400">Setting a node status message</p>
    </div>
    <FormGrid>
      <FormRow
        label="Status Message"
        for-id="nodeStatus"
        description="Status message for a node to periodically rebroadcast."
        :error="useGetError(v$.nodeStatus)"
      >
        <InputGroup>
          <InputText
            id="nodeStatus"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="nodeStatus"
            type="text"
            :invalid="v$.nodeStatus.$invalid"
            @blur="v$.nodeStatus.$touch()"
            @beforeinput="nodeStatusInput"
          />
          <InputGroupAddon>{{ byteLength(nodeStatus ?? '') }}/80</InputGroupAddon>
        </InputGroup>
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';

const nodeStatus = defineModel<string>('nodeStatus');

const props = defineProps<{
  v$: Validation;
}>();

function byteLength(str: string) {
  return new TextEncoder().encode(str).length;
}

const truncateByByte = (str: string, maxBytes: number) => {
  const encoder = new TextEncoder();
  let result = '';
  for (const char of str) {
    const temp = result + char;
    if (encoder.encode(temp).length > maxBytes - 1) break;
    result = temp;
  }
  return result;
};

const nodeStatusInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 80);
  nodeStatus.value = input.value;
  props.v$.nodeStatus.$touch();
};
</script>
