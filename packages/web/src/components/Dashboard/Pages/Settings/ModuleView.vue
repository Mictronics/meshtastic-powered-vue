<template>
  <SettingsLayout
    :saveButtonDisable="saveButtonDisable"
    :onSaveSettings="onSaveSettings"
    :saveConfigHandler="saveConfigHandler"
  >
    <template #title>Modules</template>
    <Accordion>
      <AccordionPanel value="mqtt">
        <AccordionHeader><DirtyHeader title="MQTT" :dirty="isMqttDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="serial">
        <AccordionHeader><DirtyHeader title="Serial" :dirty="isSerialDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="externalNotification">
        <AccordionHeader>
          <DirtyHeader title="External Notification" :dirty="isExternalNotificationDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="storeForward">
        <AccordionHeader>
          <DirtyHeader title="Store and Forward" :dirty="isStoreForwardDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="rangeTest">
        <AccordionHeader>
          <DirtyHeader title="Range Test" :dirty="isRangeTestDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="telemetry">
        <AccordionHeader>
          <DirtyHeader title="Telemetry" :dirty="isTelemetryDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="cannedMessages">
        <AccordionHeader>
          <DirtyHeader title="Canned Messages" :dirty="isCannedMessagesDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="audio">
        <AccordionHeader><DirtyHeader title="Audio" :dirty="isAudioDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="neighborInfo">
        <AccordionHeader>
          <DirtyHeader title="Neighbor Info" :dirty="isNeighborInfoDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="ambientLight">
        <AccordionHeader>
          <DirtyHeader title="Ambient Light" :dirty="isAmbientLightDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="detectionSensor">
        <AccordionHeader>
          <DirtyHeader title="Detection Sensor" :dirty="isDetectionSensorDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="remoteHardware">
        <AccordionHeader>
          <DirtyHeader title="Remote Hardware" :dirty="isRemoteHardwareDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="paxCounter">
        <AccordionHeader>
          <DirtyHeader title="Pax Counter" :dirty="isPaxCounterDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="trafficManagement">
        <AccordionHeader>
          <DirtyHeader title="Traffic Management" :dirty="isTrafficManagementDirty" />
        </AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="statusMessage">
        <AccordionHeader>
          <DirtyHeader title="Status Message" :dirty="isStatusMessageDirty" />
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

const saveButtonDisable = ref(true);
const saveConfigHandler = useConfigSave();

const isMqttDirty = computed(() => {
  return false;
});
const isSerialDirty = computed(() => {
  return false;
});
const isExternalNotificationDirty = computed(() => {
  return false;
});
const isStoreForwardDirty = computed(() => {
  return false;
});
const isRangeTestDirty = computed(() => {
  return false;
});
const isTelemetryDirty = computed(() => {
  return false;
});
const isCannedMessagesDirty = computed(() => {
  return false;
});
const isAudioDirty = computed(() => {
  return false;
});
const isNeighborInfoDirty = computed(() => {
  return false;
});
const isAmbientLightDirty = computed(() => {
  return false;
});
const isDetectionSensorDirty = computed(() => {
  return false;
});
const isPaxCounterDirty = computed(() => {
  return false;
});
const isTrafficManagementDirty = computed(() => {
  return false;
});
const isStatusMessageDirty = computed(() => {
  return false;
});
const isRemoteHardwareDirty = computed(() => {
  return false;
});
const onSaveSettings = () => {};
</script>
