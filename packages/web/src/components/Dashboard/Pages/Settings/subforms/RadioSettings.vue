<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Radio Settings</h4>
      <p class="text-slate-400">Settings for the LoRa radio</p>
    </div>
    <FormGrid>
      <label for="transmitEnabled" class="font-medium">Transmit Enabled</label>
      <ToggleSwitch input-id="transmitEnabled" v-model="model.transmitEnable" />
      <p class="text-slate-400">Enable/Disable transmit (TX) from the LoRa radio.</p>

      <label for="transmitPower" class="font-medium">Transmit Power</label>
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
      <p class="text-slate-400">Max transmit power.</p>

      <label for="dutyCycle" class="font-medium">Override Duty Cycle</label>
      <ToggleSwitch input-id="dutyCycle" v-model="model.overrideDutyCycle" />
      <p class="text-slate-400">Override Duty Cycle</p>

      <label for="frequencyOffset" class="font-medium">Frequency Offset</label>
      <InputGroup>
        <InputText
          id="frequencyOffset"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.frequencyOffset"
        />
        <InputGroupAddon class="">Hz</InputGroupAddon>
      </InputGroup>
      <p class="text-slate-400">Frequency offset to correct for crystal calibration errors.</p>

      <label for="overrideFrequency" class="font-medium">Override frequency</label>
      <InputGroup>
        <InputText
          id="overrideFrequency"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.overrideFrequency"
        />
        <InputGroupAddon class="">MHz</InputGroupAddon>
      </InputGroup>
      <p class="text-slate-400">Override frequency.</p>

      <label for="boostedGain" class="font-medium">Boosted RX Gain</label>
      <ToggleSwitch input-id="boostedGain" v-model="model.boostedGain" />
      <p class="text-slate-400">Boosted RX Gain</p>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';

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
