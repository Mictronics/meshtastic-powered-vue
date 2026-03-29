<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for serial communication</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable"
        for-id="enabled"
        description="Enable serial IO module."
      >
        <ToggleSwitch input-id="enabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Enable Local Echo"
        for-id="echo"
        description="Any serial packet send will be echoed back to the device."
      >
        <ToggleSwitch input-id="echo" v-model="echo" />
      </FormRow>

      <FormRow
        label="Override Serial Console"
        for-id="overrideConsoleSerialPort"
        description="Overrides the platform's defacto Serial port instance to use with Serial module config settings."
      >
        <ToggleSwitch input-id="overrideConsoleSerialPort" v-model="overrideConsoleSerialPort" />
      </FormRow>

      <FormRow
        label="Serial RX Pin"
        for-id="rxd"
        description="GPIO pin for reception."
        :error="useGetError(v$.rxd)"
      >
        <InputGroup>
          <InputText
            id="rxd"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="rxdInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.rxd.$invalid"
            @blur="v$.rxd.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Serial TX pin"
        for-id="txd"
        description="GPIO pin for transmission."
        :error="useGetError(v$.txd)"
      >
        <InputGroup>
          <InputText
            id="txd"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="txdInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.txd.$invalid"
            @blur="v$.txd.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Transmission Timeout"
        for-id="timeout"
        description="Seconds to wait before a packet is considered sent."
        :error="useGetError(v$.timeout)"
      >
        <InputGroup>
          <InputText
            id="timeout"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="timeoutInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.timeout.$invalid"
            @blur="v$.timeout.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Serial Baud Rate"
        for-id="baud"
        description="The serial baud rate."
        :error="useGetError(v$.baud)"
      >
        <Select
          aria-labelledby="baud"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="baud"
          :options="baudOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Baud Rate"
          :invalid="v$.baud.$invalid"
          @blur="v$.baud.$touch()"
        />
      </FormRow>

      <FormRow
        label="Serial Mode"
        for-id="mode"
        description="Mode for serial module operation."
        :error="useGetError(v$.mode)"
      >
        <Select
          aria-labelledby="mode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="mode"
          :options="modeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Mode"
          :invalid="v$.mode.$invalid"
          @blur="v$.mode.$touch()"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import { computed } from 'vue';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const enabled = defineModel<boolean>('enabled');
const echo = defineModel<boolean>('echo');
const overrideConsoleSerialPort = defineModel<boolean>('overrideConsoleSerialPort');
const baud = defineModel<number>('baud');
const mode = defineModel<number>('mode');
const rxd = defineModel<number>('rxd');
const txd = defineModel<number>('txd');
const timeout = defineModel<number>('timeout');

const rxdInput = computed<string>({
  get() {
    return rxd.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    rxd.value = Number.isNaN(n) ? 0 : n;
  },
});

const txdInput = computed<string>({
  get() {
    return txd.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    txd.value = Number.isNaN(n) ? 0 : n;
  },
});

const timeoutInput = computed<string>({
  get() {
    return timeout.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    timeout.value = Number.isNaN(n) ? 0 : n;
  },
});

const baudOptions = useEnumOptions(Protobuf.ModuleConfig.ModuleConfig_SerialConfig_Serial_Baud);
const modeOptions = useEnumOptions(Protobuf.ModuleConfig.ModuleConfig_SerialConfig_Serial_Mode);
</script>
