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

    <template v-if="isLicensed">
      <div class="pt-2">
        <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Ham Radio Mode</h4>
        <p class="text-slate-400">
          Applies your amateur radio identity to this node and reconfigures it for ham use.
        </p>
      </div>
      <FormGrid>
        <FormRow
          label="Call Sign"
          for-id="hamCallSign"
          description="Amateur radio call sign, e.g. KD2ABC (max 8 bytes)."
        >
          <InputText
            id="hamCallSign"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="text"
            v-model="hamCallSign"
            @beforeinput="onHamCallSignInput"
          />
        </FormRow>

        <FormRow
          label="TX Power"
          for-id="hamTxPower"
          description="Transmit power in dBm at the LoRa transceiver, not including any amplification."
        >
          <InputGroup>
            <InputText
              id="hamTxPower"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              v-model="hamTxPowerInput"
            />
            <InputGroupAddon>dBm</InputGroupAddon>
          </InputGroup>
        </FormRow>

        <FormRow
          label="Frequency"
          for-id="hamFrequency"
          description="LoRa operating frequency. Respect your local laws, regulations, and band plans."
        >
          <InputGroup>
            <InputText
              id="hamFrequency"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              step="0.01"
              v-model="hamFrequencyInput"
            />
            <InputGroupAddon>MHz</InputGroupAddon>
          </InputGroup>
        </FormRow>

        <FormRow
          label="Ham Short Name"
          for-id="hamShortName"
          description="Optional short name of user (max 5 bytes)."
        >
          <InputText
            id="hamShortName"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="text"
            v-model="hamShortName"
            @beforeinput="onHamShortNameInput"
          />
        </FormRow>

        <FormRow
          label="Ham Long Name"
          for-id="hamLongName"
          description="Optional long name of user, appended to callsign (max 15 bytes)."
        >
          <InputText
            id="hamLongName"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="text"
            v-model="hamLongName"
            @beforeinput="onHamLongNameInput"
          />
        </FormRow>
      </FormGrid>
    </template>
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
const hamCallSign = defineModel<string>('hamCallSign');
const hamTxPower = defineModel<number>('hamTxPower');
const hamFrequency = defineModel<number>('hamFrequency');
const hamShortName = defineModel<string>('hamShortName');
const hamLongName = defineModel<string>('hamLongName');

const hamTxPowerInput = computed<string>({
  get() {
    return hamTxPower.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    hamTxPower.value = Number.isNaN(n) ? 0 : n;
  },
});

const hamFrequencyInput = computed<string>({
  get() {
    return hamFrequency.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    hamFrequency.value = Number.isNaN(n) ? 0 : n;
  },
});
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

const onHamCallSignInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 8);
  hamCallSign.value = input.value;
};

const onHamShortNameInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 5);
  hamShortName.value = input.value;
};

const onHamLongNameInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 15);
  hamLongName.value = input.value;
};
</script>
