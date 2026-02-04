<template>
  <Fieldset pt:legend:class="fieldset-legend" class="h-dvh m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <span class="font-bold">Device</span>
        <SaveButton :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
      </div>
    </template>
    <Accordion value="0">
      <AccordionPanel value="0">
        <AccordionHeader>User</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="1">
        <AccordionHeader>Device</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="2">
        <AccordionHeader>Position</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="3">
        <AccordionHeader>Power</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="4">
        <AccordionHeader>Network</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="5">
        <AccordionHeader>Display</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="6">
        <AccordionHeader>Bluetooth</AccordionHeader>
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
