<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Bluetooth Settings</h4>
      <p class="text-slate-400">Settings for a Bluetooth module</p>
      <p class="text-slate-400 font-bold text-xs">
        Note: Some devices (ESP32) cannot use both Bluetooth and WiFi at the same time.
      </p>
    </div>
    <FormGrid>
      <FormRow label="Enabled" for-id="enabled" description="Enable or disable Bluetooth support.">
        <ToggleSwitch input-id="enabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Pairing mode"
        for-id="mode"
        description="Pairing pin behavior."
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
          placeholder="Select pairing mode"
          :invalid="v$.mode.$invalid"
          @blur="v$.mode.$touch()"
        />
      </FormRow>

      <FormRow
        label="Fixed Pin"
        for-id="pin"
        description="Fixed pin to use when pairing."
        :error="useGetError(v$.fixedPin)"
      >
        <InputMask
          v-model="fixedPinInput"
          default-value="123456"
          size="small"
          mask="999999"
          placeholder="123456"
          :unmask="true"
          :disabled="mode !== 1"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          :invalid="v$.fixedPin.$invalid"
          @blur="v$.fixedPin.$touch()"
        />
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

defineProps<{
  v$: Validation;
}>();

const enabled = defineModel<boolean>('enabled');
const fixedPin = defineModel<number>('fixedPin');
const mode = defineModel<Protobuf.Config.Config_BluetoothConfig_PairingMode>('mode');

const fixedPinInput = computed<string>({
  get() {
    return fixedPin.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    fixedPin.value = Number.isNaN(n) ? 123456 : n;
  },
});

type Mode = 0 | 1 | 2;
const modeOptions: { label: string; value: Mode }[] = [
  { label: 'Random Pin', value: 0 },
  { label: 'Fixed Pin', value: 1 },
  { label: 'No Pin', value: 2 },
];
</script>
