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
        <AccordionContent>
          <AmbientLightModule
            v-model:blue="ambientLightConfig.blue"
            v-model:green="ambientLightConfig.green"
            v-model:red="ambientLightConfig.red"
            v-model:current="ambientLightConfig.current"
            v-model:ledState="ambientLightConfig.ledState"
            :v$="ambientLightV$"
          />
        </AccordionContent>
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
        <AccordionContent>
          <TrafficModule
            v-model:dropUnknownEnabled="trafficManagementConfig.dropUnknownEnabled"
            v-model:enabled="trafficManagementConfig.enabled"
            v-model:exhaustHopPosition="trafficManagementConfig.exhaustHopPosition"
            v-model:exhaustHopTelemetry="trafficManagementConfig.exhaustHopTelemetry"
            v-model:nodeinfoDirectResponse="trafficManagementConfig.nodeinfoDirectResponse"
            v-model:nodeinfoDirectResponseMaxHops="
              trafficManagementConfig.nodeinfoDirectResponseMaxHops
            "
            v-model:positionDedupEnabled="trafficManagementConfig.positionDedupEnabled"
            v-model:positionMinIntervalSecs="trafficManagementConfig.positionMinIntervalSecs"
            v-model:positionPrecisionBits="trafficManagementConfig.positionPrecisionBits"
            v-model:rateLimitEnabled="trafficManagementConfig.rateLimitEnabled"
            v-model:rateLimitMaxPackets="trafficManagementConfig.rateLimitMaxPackets"
            v-model:rateLimitWindowSecs="trafficManagementConfig.rateLimitWindowSecs"
            v-model:routerPreserveHops="trafficManagementConfig.routerPreserveHops"
            v-model:unknownPacketThreshold="trafficManagementConfig.unknownPacketThreshold"
            :v$="trafficManagementV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="statusMessage">
        <AccordionHeader>
          <DirtyHeader title="Status Message" :dirty="isStatusMessageDirty" />
        </AccordionHeader>
        <AccordionContent>
          <NodeStatusModule
            v-model:nodeStatus="statusMessageConfig.nodeStatus"
            :v$="statusMessageV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="tak">
        <AccordionHeader>
          <DirtyHeader title="TAK/ATAK" :dirty="isAtakDirty" />
        </AccordionHeader>
        <AccordionContent>
          <AtakModule v-model:role="atakConfig.role" v-model:team="atakConfig.team" :v$="atakV$" />
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </SettingsLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { useVuelidate } from '@vuelidate/core';
import {
  TrafficManagementRules,
  StatusMessageRules,
  AmbientLightRules,
  AtakRules,
} from '@/composables/ValidationRules';
import SettingsLayout from './components/SettingsLayout.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import TrafficModule from './subforms/TrafficModule.vue';
import NodeStatusModule from './subforms/NodeStatusModule.vue';
import AmbientLightModule from './subforms/AmbientLightModule.vue';
import AtakModule from './subforms/AtakModule.vue';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';
import { purgeUncloneableProperties } from '@/composables/stores/utils/purgeUncloneable';
import { useConfigSave } from '@/composables/useConfigSave';
import { onBeforeRouteLeave } from 'vue-router';
import { useConfirm } from '@/composables/useConfirmDialog';

const device = useDeviceStore().device;
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

const ambientLightConfig = ref<Protobuf.ModuleConfig.ModuleConfig_AmbientLightingConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_AmbientLightingConfigSchema)
);
const isAmbientLightDirty = computed(() => {
  if (!device.value?.moduleConfig.ambientLighting) return false;
  return !useDeepCompareConfig(
    ambientLightConfig.value,
    device.value?.moduleConfig.ambientLighting,
    true
  );
});
const ambientLightV$ = useVuelidate(AmbientLightRules, ambientLightConfig);

const isDetectionSensorDirty = computed(() => {
  return false;
});
const isPaxCounterDirty = computed(() => {
  return false;
});

const trafficManagementConfig = ref<Protobuf.ModuleConfig.ModuleConfig_TrafficManagementConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_TrafficManagementConfigSchema)
);
const isTrafficManagementDirty = computed(() => {
  if (!device.value?.moduleConfig.trafficManagement) return false;
  return !useDeepCompareConfig(
    trafficManagementConfig.value,
    device.value?.moduleConfig.trafficManagement,
    true
  );
});
const trafficManagementV$ = useVuelidate(TrafficManagementRules, trafficManagementConfig);

const statusMessageConfig = ref<Protobuf.ModuleConfig.ModuleConfig_StatusMessageConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_StatusMessageConfigSchema)
);
const isStatusMessageDirty = computed(() => {
  if (!device.value?.moduleConfig.statusmessage) return false;
  return !useDeepCompareConfig(
    statusMessageConfig.value,
    device.value?.moduleConfig.statusmessage,
    true
  );
});
const statusMessageV$ = useVuelidate(StatusMessageRules, statusMessageConfig);

const isRemoteHardwareDirty = computed(() => {
  return false;
});

const atakConfig = ref<Protobuf.ModuleConfig.ModuleConfig_TAKConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_TAKConfigSchema)
);
const isAtakDirty = computed(() => {
  if (!device.value?.moduleConfig.tak) return false;
  return !useDeepCompareConfig(atakConfig.value, device.value?.moduleConfig.tak, true);
});
const atakV$ = useVuelidate(AtakRules, atakConfig);

watch(
  () => device.value,
  (dev) => {
    if (!dev) return;

    let conf: any = dev.getEffectiveModuleConfig('trafficManagement');
    if (conf) {
      Object.assign(trafficManagementConfig.value, dev.moduleConfig.trafficManagement);
    }
    conf = dev.getEffectiveModuleConfig('statusmessage');
    if (conf) {
      Object.assign(statusMessageConfig.value, dev.moduleConfig.statusmessage);
    }
    conf = dev.getEffectiveModuleConfig('ambientLighting');
    if (conf) {
      Object.assign(ambientLightConfig.value, dev.moduleConfig.ambientLighting);
    }
    conf = dev.getEffectiveModuleConfig('tak');
    if (conf) {
      Object.assign(atakConfig.value, dev.moduleConfig.tak);
    }
  },
  { immediate: true, once: true }
);

const onSaveSettings = () => {};
</script>
