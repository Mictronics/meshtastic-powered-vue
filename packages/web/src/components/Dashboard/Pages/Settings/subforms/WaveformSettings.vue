<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Waveform Settings</h4>
      <p class="text-slate-400">Settings for the LoRa waveform</p>
    </div>
    <FormGrid>
      <FormRow
        label="Use Preset"
        for-id="usePreset"
        description="Use one of the predefined modem presets."
      >
        <ToggleSwitch input-id="usePreset" v-model="model.usePreset" />
      </FormRow>

      <FormRow label="Modem Preset" for-id="modemPreset" description="Modem preset to use.">
        <Select
          aria-labelledby="modemPreset"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.modemPreset"
        />
      </FormRow>

      <FormRow label="Bandwidth" for-id="bandwidth" description="Channel bandwidth in kHz.">
        <InputGroup>
          <InputText
            id="bandwidth"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="model.bandwidth"
          />
          <InputGroupAddon class="">kHz</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Spreading Factor"
        for-id="spreadingFactor"
        description="Indicates the number of chirps per symbol."
      >
        <InputGroup>
          <InputText
            id="spreadingFactor"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="model.spreadingFactor"
          />
          <InputGroupAddon class="">CPS</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Coding Rate"
        for-id="codingRate"
        description="The denominator of the coding rate."
      >
        <InputText
          id="codingRate"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.codingRate"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';

defineProps<{
  model: {
    usePreset: boolean;
    modemPreset: number;
    bandwidth: string;
    spreadingFactor: string;
    codingRate: string;
  };
}>();
</script>
