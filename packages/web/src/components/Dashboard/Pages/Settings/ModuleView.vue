<template>
  <Fieldset pt:legend:class="fieldset-legend" class="h-dvh m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <span class="font-bold">Modules</span>
        <SaveButton :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
      </div>
    </template>
    <Accordion value="0">
      <AccordionPanel value="0">
        <AccordionHeader>MQTT</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="1">
        <AccordionHeader>Serial</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="2">
        <AccordionHeader>External Notification</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="3">
        <AccordionHeader>Store and Forward</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="4">
        <AccordionHeader>Range Test</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="5">
        <AccordionHeader>Telemetry</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="6">
        <AccordionHeader>Canned Messages</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="7">
        <AccordionHeader>Audio</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="8">
        <AccordionHeader>Neighbor Info</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="9">
        <AccordionHeader>Ambient Light</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="10">
        <AccordionHeader>Detection Sensor</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="11">
        <AccordionHeader>Pax Counter</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
    </Accordion>
  </Fieldset>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SaveButton from './components/SaveButton.vue';

const saveButtonDisable = ref(true);

const onSaveSettings = () => {};
</script>

<style lang="css" module>
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
