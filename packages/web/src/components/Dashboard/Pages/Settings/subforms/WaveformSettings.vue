<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Waveform Settings</h4>
      <p class="text-slate-400">Settings for the LoRa waveform</p>
    </div>
    <FormGrid>
      <label for="usePreset" class="font-medium">Use Preset</label>
      <ToggleSwitch input-id="usePreset" v-model="model.usePreset" />
      <p class="text-slate-400">Use one of the predefined modem presets.</p>

      <span id="modemPreset" class="font-medium">Modem Preset</span>
      <Select
        aria-labelledby="modemPreset"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        v-model="model.modemPreset"
      />
      <p class="text-slate-400">Modem preset to use.</p>

      <label for="bandwidth" class="font-medium">Bandwidth</label>
      <InputGroup>
        <InputText
          id="bandwidth"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.bandwidth"
        />
        <InputGroupAddon class="">kHz</InputGroupAddon>
      </InputGroup>
      <p class="text-slate-400">Channel bandwidth in kHz</p>

      <label for="spreadingFactor" class="font-medium">Spreading Factor</label>
      <InputGroup>
        <InputText
          id="spreadingFactor"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.spreadingFactor"
        />
        <InputGroupAddon class="">CPS</InputGroupAddon>
      </InputGroup>
      <p class="text-slate-400">Indicates the number of chirps per symbol.</p>

      <label for="codingRate" class="font-medium">Coding Rate</label>
      <InputText
        id="codingRate"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        v-model="model.codingRate"
      />
      <p class="text-slate-400">The denominator of the coding rate.</p>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';

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
