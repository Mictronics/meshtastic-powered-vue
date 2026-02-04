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
        <ToggleSwitch input-id="transmitEnabled" v-model="model.transmitEnable" />
      </FormRow>

      <FormRow label="Transmit Power" for-id="transmitPower" description="Max transmit power.">
        <InputGroup>
          <InputText
            id="transmitPower"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            max="27"
            v-model="model.transmitPower"
          />
          <InputGroupAddon class="">dBm</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow label="Override Duty Cycle" for-id="dutyCycle" description="Override Duty Cycle.">
        <ToggleSwitch input-id="dutyCycle" v-model="model.overrideDutyCycle" />
      </FormRow>

      <FormRow
        label="Frequency Offset"
        for-id="frequencyOffset"
        description="Frequency offset to correct for crystal calibration errors."
      >
        <InputGroup>
          <InputText
            id="frequencyOffset"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="model.frequencyOffset"
            type="number"
          />
          <InputGroupAddon class="">Hz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Override frequency"
        for-id="overrideFrequency"
        description="Override frequency."
      >
        <InputGroup>
          <InputText
            id="overrideFrequency"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="model.overrideFrequency"
            type="number"
            step="0.001"
          />
          <InputGroupAddon class="">MHz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow label="Boosted RX Gain" for-id="boostedGain" description="Boosted RX Gain.">
        <ToggleSwitch input-id="boostedGain" v-model="model.boostedGain" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';

defineProps<{
  model: {
    transmitEnable: boolean;
    transmitPower: string;
    overrideDutyCycle: boolean;
    frequencyOffset: string;
    overrideFrequency: string;
    boostedGain: boolean;
  };
}>();
</script>
