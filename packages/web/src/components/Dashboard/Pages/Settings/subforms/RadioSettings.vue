<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Radio Settings</h4>
      <p class="text-slate-400">Settings for the LoRa radio</p>
    </div>
    <FormGrid>
      <FormRow
        label="Transmit Enabled"
        for-id="txEnabled"
        description="Enable/Disable transmit (TX) from the LoRa radio."
      >
        <ToggleSwitch input-id="txEnabled" v-model="txEnabled" />
      </FormRow>

      <FormRow
        label="Transmit Power"
        for-id="txPower"
        description="Max transmit power."
        :error="useGetError(v$.txPower)"
      >
        <InputGroup>
          <InputText
            id="txPower"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            max="50"
            v-model="txPowerInput"
            :error="useGetError(v$.txPower)"
            :invalid="v$.txPower.$invalid"
            @blur="v$.txPower.$touch()"
          />
          <InputGroupAddon>dBm</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow label="Override Duty Cycle" for-id="dutyCycle" description="Override Duty Cycle.">
        <ToggleSwitch input-id="dutyCycle" v-model="overrideDutyCycle" />
      </FormRow>

      <FormRow
        label="Frequency Offset"
        for-id="frequencyOffset"
        description="Frequency offset to correct for crystal calibration errors."
        :error="useGetError(v$.frequencyOffset)"
      >
        <InputGroup>
          <InputText
            id="frequencyOffset"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="frequencyOffsetInput"
            type="number"
            min="-1e6"
            max="1e6"
            :invalid="v$.frequencyOffset.$invalid"
            @blur="v$.frequencyOffset.$touch()"
          />
          <InputGroupAddon>Hz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Override frequency"
        for-id="overrideFrequency"
        description="Override frequency."
        :error="useGetError(v$.overrideFrequency)"
      >
        <InputGroup>
          <InputText
            id="overrideFrequency"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="overrideFrequencyInput"
            type="number"
            min="0"
            max="950"
            step="0.001"
            :invalid="v$.overrideFrequency.$invalid"
            @blur="v$.overrideFrequency.$touch()"
          />
          <InputGroupAddon>MHz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow label="Boosted RX Gain" for-id="sx126xRxBoostedGain" description="Boosted RX Gain.">
        <ToggleSwitch input-id="sx126xRxBoostedGain" v-model="sx126xRxBoostedGain" />
      </FormRow>

      <FormRow
        label="Disable PA fan"
        for-id="paFanDisabled"
        description="Disable the build-in power amplifier fan using pin define in RF95_FAN_EN."
      >
        <ToggleSwitch input-id="paFanDisabled" v-model="paFanDisabled" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import type { Validation } from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';

defineProps<{
  v$: Validation;
}>();

const txEnabled = defineModel<boolean>('txEnabled');
const txPower = defineModel<number>('txPower');
const overrideDutyCycle = defineModel<boolean>('overrideDutyCycle');
const frequencyOffset = defineModel<number>('frequencyOffset');
const overrideFrequency = defineModel<number>('overrideFrequency');
const sx126xRxBoostedGain = defineModel<boolean>('sx126xRxBoostedGain');
const paFanDisabled = defineModel<boolean>('paFanDisabled');
const txPowerInput = computed<string>({
  get() {
    return txPower.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    txPower.value = Number.isNaN(n) ? undefined : n;
  },
});
const frequencyOffsetInput = computed<string>({
  get() {
    return frequencyOffset.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    frequencyOffset.value = Number.isNaN(n) ? undefined : n;
  },
});
const overrideFrequencyInput = computed<string>({
  get() {
    return overrideFrequency.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    overrideFrequency.value = Number.isNaN(n) ? undefined : n;
  },
});
</script>
