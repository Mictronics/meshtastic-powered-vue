<template>
  <SettingsLayout
    :saveButtonDisable="saveButtonDisable"
    :onSaveSettings="onSaveSettings"
    :saveConfigHandler="saveConfigHandler"
  >
    <template #title>Device</template>
    <Accordion>
      <AccordionPanel value="user">
        <AccordionHeader><DirtyHeader title="User" :dirty="isUserDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="device">
        <AccordionHeader>
          <DirtyHeader title="Device" :dirty="isDeviceDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="position">
        <AccordionHeader>
          <DirtyHeader title="Position" :dirty="isPositionDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="power">
        <AccordionHeader><DirtyHeader title="Power" :dirty="isPowerDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="network">
        <AccordionHeader><DirtyHeader title="Network" :dirty="isNetworkDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="display">
        <AccordionHeader><DirtyHeader title="Display" :dirty="isDisplayDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="bluetooth">
        <AccordionHeader>
          <DirtyHeader title="Bluetooth" :dirty="isBluetoothDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
    </Accordion>
  </SettingsLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SettingsLayout from './components/SettingsLayout.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import { useConfigSave } from '@/composables/useConfigSave';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';

const device = useDeviceStore().device;
const saveButtonDisable = ref(true);
const saveConfigHandler = useConfigSave();

const isUserDirty = computed(() => {
  return false;
});
const isDeviceDirty = computed(() => {
  return false;
});
const isPositionDirty = computed(() => {
  return false;
});
const isPowerDirty = computed(() => {
  return false;
});
const isNetworkDirty = computed(() => {
  return false;
});
const isDisplayDirty = computed(() => {
  return false;
});
const isBluetoothDirty = computed(() => {
  return false;
});

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
