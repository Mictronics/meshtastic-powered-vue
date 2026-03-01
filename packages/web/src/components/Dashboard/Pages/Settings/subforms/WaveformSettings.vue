<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the LoRa waveform</p>
    </div>
    <FormGrid>
      <FormRow
        label="Use Preset"
        for-id="usePreset"
        description="Use one of the predefined modem presets."
      >
        <ToggleSwitch input-id="usePreset" v-model="usePreset" />
      </FormRow>

      <FormRow
        label="Modem Preset"
        for-id="modemPreset"
        description="Modem preset to use."
        :error="useGetError(v$.modemPreset)"
        s
      >
        <Select
          aria-labelledby="modemPreset"
          class="dark:bg-slate-800 dark:text-slate-400"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="modemPreset"
          :disabled="!usePreset"
          :options="modemPresetOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select modem preset"
          :invalid="v$.modemPreset.$invalid"
          @blur="v$.modemPreset.$touch()"
        />
      </FormRow>

      <FormRow
        label="Bandwidth"
        for-id="bandwidth"
        description="Channel bandwidth in kHz."
        :error="useGetError(v$.bandwidth)"
      >
        <InputGroup>
          <InputText
            id="bandwidth"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="bandwidthInput"
            type="number"
            :disabled="usePreset"
            :invalid="v$.bandwidth.$invalid"
            @blur="v$.bandwidth.$touch()"
          />
          <InputGroupAddon>kHz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Spreading Factor"
        for-id="spreadFactor"
        description="Indicates the number of chirps per symbol."
        :error="useGetError(v$.spreadFactor)"
      >
        <InputGroup>
          <InputText
            id="spreadFactor"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="spreadFactorInput"
            type="number"
            min="0"
            max="12"
            :disabled="usePreset"
            :invalid="v$.spreadFactor.$invalid"
            @blur="v$.spreadFactor.$touch()"
          />
          <InputGroupAddon>CPS</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Coding Rate"
        for-id="codingRate"
        description="The denominator of the coding rate."
        :error="useGetError(v$.codingRate)"
      >
        <InputText
          id="codingRate"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="codingRateInput"
          type="number"
          min="0"
          max="10"
          :disabled="usePreset"
          :invalid="v$.codingRate.$invalid"
          @blur="v$.codingRate.$touch()"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Protobuf } from '@meshtastic/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import type { Validation } from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const usePreset = defineModel<boolean>('usePreset');
const modemPreset = defineModel<number>('modemPreset');
const bandwidth = defineModel<number>('bandwidth');
const spreadFactor = defineModel<number>('spreadFactor');
const codingRate = defineModel<number>('codingRate');
const bandwidthInput = computed<string>({
  get() {
    return bandwidth.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    bandwidth.value = Number.isNaN(n) ? undefined : n;
  },
});
const spreadFactorInput = computed<string>({
  get() {
    return spreadFactor.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    spreadFactor.value = Number.isNaN(n) ? undefined : n;
  },
});
const codingRateInput = computed<string>({
  get() {
    return codingRate.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    codingRate.value = Number.isNaN(n) ? undefined : n;
  },
});

const modemPresetOptions = useEnumOptions(Protobuf.Config.Config_LoRaConfig_ModemPreset);
</script>
