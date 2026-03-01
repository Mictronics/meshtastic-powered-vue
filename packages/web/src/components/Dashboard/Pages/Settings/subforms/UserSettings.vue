<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Configure your device name and identity settings</p>
    </div>
    <FormGrid>
      <FormRow label="Node ID" for-id="nodeId" description="The nodes hexadecimal identification.">
        <Message
          id="nodeId"
          class="w-full dark:bg-slate-900 dark:text-slate-400"
          size="small"
          severity="contrast"
          variant="simple"
        >
          {{ id }}
        </Message>
      </FormRow>
      <FormRow label="Hardware Model" for-id="hwModel" description="The nodes hardware model.">
        <Message
          id="hwModel"
          class="dark:bg-slate-900 dark:text-slate-400 w-full"
          size="small"
          severity="contrast"
          variant="simple"
        >
          {{ hwModelText }}
        </Message>
      </FormRow>
      <FormRow
        label="Long Name"
        for-id="longName"
        description="Full node name (1-40 characters)."
        :error="useGetError(v$.longName)"
      >
        <InputGroup>
          <InputText
            id="longName"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="text"
            v-model="longName"
            :invalid="v$.longName.$invalid"
            @beforeinput="onLongNameInput"
          />
          <InputGroupAddon>{{ byteLength(longName ?? '') }}/40</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Short Name"
        for-id="shortName"
        description="Abbreviated node name (2-4 characters)."
        :error="useGetError(v$.shortName)"
      >
        <InputGroup>
          <InputText
            id="shortName"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="text"
            v-model="shortName"
            :invalid="v$.shortName.$invalid"
            @beforeinput="onShortNameInput"
          />
          <InputGroupAddon>{{ byteLength(shortName ?? '') }}/4</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Unmessageable"
        for-id="txEnabled"
        description="Used to identify unmonitored or infrastructure nodes so that messaging is not available to nodes that will never respond."
      >
        <ToggleSwitch input-id="txEnabled" v-model="isUnmessagable" />
      </FormRow>

      <FormRow
        label="Licensed amateur radio (HAM)"
        for-id="txEnabled"
        description="Enable if you are a licensed amateur radio operator, enabling this option disables encryption and is not compatible with the default Meshtastic network."
      >
        <ToggleSwitch input-id="txEnabled" v-model="isLicensed" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Protobuf } from '@meshtastic/core';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';

const props = withDefaults(
  defineProps<{
    id?: string;
    hwModel?: Protobuf.Mesh.HardwareModel;
    v$: Validation;
  }>(),
  {
    id: '',
    hwModel: Protobuf.Mesh.HardwareModel.UNSET,
  }
);

const longName = defineModel<string>('longName');
const shortName = defineModel<string>('shortName');
const isLicensed = defineModel<boolean>('isLicensed');
const isUnmessagable = defineModel<boolean>('isUnmessagable');
const hwModelText = computed(() =>
  Protobuf.Mesh.HardwareModel[props.hwModel ?? 0]?.replaceAll('_', ' ')
);

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

const onLongNameInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 40);
  longName.value = input.value;
  props.v$.longName.$touch();
};

const onShortNameInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 4);
  shortName.value = input.value;
  props.v$.shortName.$touch();
};
</script>
