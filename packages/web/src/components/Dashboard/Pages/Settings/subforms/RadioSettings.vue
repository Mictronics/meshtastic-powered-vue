<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Radio Settings</h4>
      <p class="text-slate-400">Settings for the LoRa radio</p>
    </div>
    <FormGrid>
      <FormRow
        label="Transmit Enabled"
        for-id="transmitEnabled"
        description="Enable/Disable transmit (TX) from the LoRa radio."
      >
        <ToggleSwitch input-id="transmitEnabled" v-model="transmitEnabled" />
      </FormRow>

      <FormRow
        label="Transmit Power"
        for-id="transmitPower"
        description="Max transmit power."
        :error="useGetError(v$.transmitPower)"
      >
        <InputGroup>
          <InputText
            id="transmitPower"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            max="50"
            v-model="transmitPower"
            :error="useGetError(v$.transmitPower)"
            :invalid="v$.transmitPower.$invalid"
            @blur="v$.transmitPower.$touch()"
          />
          <InputGroupAddon class="">dBm</InputGroupAddon>
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
            v-model="frequencyOffset"
            type="number"
            min="-1e6"
            max="1e6"
            :invalid="v$.frequencyOffset.$invalid"
            @blur="v$.frequencyOffset.$touch()"
          />
          <InputGroupAddon class="">Hz</InputGroupAddon>
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
            v-model="overrideFrequency"
            type="number"
            min="0"
            max="950"
            step="0.001"
            :invalid="v$.overrideFrequency.$invalid"
            @blur="v$.overrideFrequency.$touch()"
          />
          <InputGroupAddon class="">MHz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow label="Boosted RX Gain" for-id="boostedGain" description="Boosted RX Gain.">
        <ToggleSwitch input-id="boostedGain" v-model="boostedGain" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import type { Validation } from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';

defineProps<{
  v$: Validation;
}>();

const transmitEnabled = defineModel<boolean>('transmitEnabled');
const transmitPower = defineModel<string>('transmitPower');
const overrideDutyCycle = defineModel<boolean>('overrideDutyCycle');
const frequencyOffset = defineModel<string>('frequencyOffset');
const overrideFrequency = defineModel<string>('overrideFrequency');
const boostedGain = defineModel<boolean>('boostedGain');
</script>
