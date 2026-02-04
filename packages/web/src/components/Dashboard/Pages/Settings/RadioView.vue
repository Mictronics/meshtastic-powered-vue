<template>
  <Fieldset pt:legend:class="fieldset-legend" class="m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <span class="font-bold">Radio</span>
        <SaveButton type="submit" :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
      </div>
    </template>
    <Accordion value="0">
      <AccordionPanel value="0">
        <AccordionHeader>LoRa</AccordionHeader>
        <AccordionContent>
          <form class="text-sm" @submit.prevent="onSaveSettings">
            <MeshSettings :model="meshSettings" />
            <WaveformSettings :model="waveformSettings" />
            <RadioSettings :model="radioSettings" />
          </form>
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="1">
        <AccordionHeader>Channels</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="2">
        <AccordionHeader>Security</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
    </Accordion>
  </Fieldset>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SaveButton from './components/SaveButton.vue';
import MeshSettings from './subforms/MeshSettings.vue';
import WaveformSettings from './subforms/WaveformSettings.vue';
import RadioSettings from './subforms/RadioSettings.vue';

const meshSettings = ref({
  region: '',
  hopLimit: 0,
  frequencySlot: '',
  forwardMqtt: false,
  allowMqtt: false,
});

const waveformSettings = ref({
  usePreset: true,
  modemPreset: 0,
  bandwidth: '',
  spreadingFactor: '',
  codingRate: '',
});

const radioSettings = ref({
  transmitEnable: true,
  transmitPower: '',
  overrideDutyCycle: false,
  frequencyOffset: '',
  overrideFrequency: '',
  boostedGain: true,
});

const saveButtonDisable = ref(true);
const onSaveSettings = () => {};
</script>

<style lang="css" scoped>
@keyframes bounce-3s {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.bounce-once {
  animation: bounce-3s 3s ease;
}
</style>
