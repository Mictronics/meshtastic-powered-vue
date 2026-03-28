<template>
  <SettingsLayout
    :saveButtonDisable="saveButtonDisable"
    :onSaveSettings="onSaveSettings"
    :saveConfigHandler="saveConfigHandler"
  >
    <template #title>Modules</template>
    <Accordion>
      <AccordionPanel value="mqtt">
        <AccordionHeader>
          <DirtyHeader title="MQTT" :dirty="isMqttDirty || isMapReportDirty" />
        </AccordionHeader>
        <AccordionContent>
          <MqttModule
            v-model:address="mqttConfig.address"
            v-model:enabled="mqttConfig.enabled"
            v-model:encryptionEnabled="mqttConfig.encryptionEnabled"
            v-model:jsonEnabled="mqttConfig.jsonEnabled"
            v-model:mapReportingEnabled="mqttConfig.mapReportingEnabled"
            v-model:password="mqttConfig.password"
            v-model:positionPrecision="mapReportConfig.positionPrecision"
            v-model:proxyToClientEnabled="mqttConfig.proxyToClientEnabled"
            v-model:publishIntervalSecs="mapReportConfig.publishIntervalSecs"
            v-model:root="mqttConfig.root"
            v-model:shouldReportLocation="mapReportConfig.shouldReportLocation"
            v-model:tlsEnabled="mqttConfig.tlsEnabled"
            v-model:username="mqttConfig.username"
            :mqttV$="mqttV$"
            :mapReportV$="mapReportV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="serial">
        <AccordionHeader><DirtyHeader title="Serial" :dirty="isSerialDirty" /></AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="externalNotification">
        <AccordionHeader>
          <DirtyHeader title="External Notification" :dirty="isExternalNotificationDirty" />
        </AccordionHeader>
        <AccordionContent>
          <ExtNotificationModule
            v-model:active="externalNotificationConfig.active"
            v-model:alertBell="externalNotificationConfig.alertBell"
            v-model:alertBellBuzzer="externalNotificationConfig.alertBellBuzzer"
            v-model:alertBellVibra="externalNotificationConfig.alertBellVibra"
            v-model:alertMessage="externalNotificationConfig.alertMessage"
            v-model:alertMessageBuzzer="externalNotificationConfig.alertMessageBuzzer"
            v-model:alertMessageVibra="externalNotificationConfig.alertMessageVibra"
            v-model:enabled="externalNotificationConfig.enabled"
            v-model:nagTimeout="externalNotificationConfig.nagTimeout"
            v-model:output="externalNotificationConfig.output"
            v-model:outputBuzzer="externalNotificationConfig.outputBuzzer"
            v-model:outputMs="externalNotificationConfig.outputMs"
            v-model:outputVibra="externalNotificationConfig.outputVibra"
            v-model:useI2sAsBuzzer="externalNotificationConfig.useI2sAsBuzzer"
            v-model:usePwm="externalNotificationConfig.usePwm"
            :v$="externalNotificationV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="storeForward">
        <AccordionHeader>
          <DirtyHeader title="Store and Forward" :dirty="isStoreForwardDirty" />
        </AccordionHeader>
        <AccordionContent>
          <StoreForwardModule
            v-model:enabled="storeForwardConfig.enabled"
            v-model:heartbeat="storeForwardConfig.heartbeat"
            v-model:historyReturnMax="storeForwardConfig.historyReturnMax"
            v-model:historyReturnWindow="storeForwardConfig.historyReturnWindow"
            v-model:isServer="storeForwardConfig.isServer"
            v-model:records="storeForwardConfig.records"
            :v$="storeForwardV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="rangeTest">
        <AccordionHeader>
          <DirtyHeader title="Range Test" :dirty="isRangeTestDirty" />
        </AccordionHeader>
        <AccordionContent>
          <RangeTestModule
            v-model:clearOnReboot="rangeTestConfig.clearOnReboot"
            v-model:enabled="rangeTestConfig.enabled"
            v-model:save="rangeTestConfig.save"
            v-model:sender="rangeTestConfig.sender"
            :v$="rangeTestV$"
          />
        </AccordionContent>
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
        <AccordionContent>
          <CannedMessageModule
            v-model:allowInputSource="cannedMessagesConfig.allowInputSource"
            v-model:enabled="cannedMessagesConfig.enabled"
            v-model:inputbrokerEventCcw="cannedMessagesConfig.inputbrokerEventCcw"
            v-model:inputbrokerEventCw="cannedMessagesConfig.inputbrokerEventCw"
            v-model:inputbrokerPinA="cannedMessagesConfig.inputbrokerPinA"
            v-model:inputbrokerPinB="cannedMessagesConfig.inputbrokerPinB"
            v-model:inputbrokerPinPress="cannedMessagesConfig.inputbrokerPinPress"
            v-model:rotary1Enabled="cannedMessagesConfig.rotary1Enabled"
            v-model:sendBell="cannedMessagesConfig.sendBell"
            v-model:updown1Enabled="cannedMessagesConfig.updown1Enabled"
            v-model:inputbrokerEventPress="cannedMessagesConfig.inputbrokerEventPress"
            :v$="cannedMessagesV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="audio">
        <AccordionHeader><DirtyHeader title="Audio" :dirty="isAudioDirty" /></AccordionHeader>
        <AccordionContent>
          <AudioModule
            v-model:bitrate="audioConfig.bitrate"
            v-model:codec2Enabled="audioConfig.codec2Enabled"
            v-model:i2sDin="audioConfig.i2sDin"
            v-model:i2sSck="audioConfig.i2sSck"
            v-model:i2sSd="audioConfig.i2sSd"
            v-model:i2sWs="audioConfig.i2sWs"
            v-model:pttPin="audioConfig.pttPin"
            :v$="audioV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="neighborInfo">
        <AccordionHeader>
          <DirtyHeader title="Neighbor Info" :dirty="isNeighborInfoDirty" />
        </AccordionHeader>
        <AccordionContent>
          <NeighborInfoModule
            v-model:enabled="neighborInfoConfig.enabled"
            v-model:transmitOverLora="neighborInfoConfig.transmitOverLora"
            v-model:updateInterval="neighborInfoConfig.updateInterval"
            :v$="neighborInfoV$"
          />
        </AccordionContent>
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
        <AccordionContent>
          <PaxCounterModule
            v-model:bleThreshold="paxCounterConfig.bleThreshold"
            v-model:enabled="paxCounterConfig.enabled"
            v-model:paxcounterUpdateInterval="paxCounterConfig.paxcounterUpdateInterval"
            v-model:wifiThreshold="paxCounterConfig.wifiThreshold"
            :v$="paxCounterV$"
          />
        </AccordionContent>
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
  AudioRules,
  RangeTestRules,
  NeighborInfoRules,
  PaxCounterRules,
  ExternalNotificationRules,
  CannedMessagesRules,
  StoreForwardRules,
  MqttRules,
  MapReportRules,
} from '@/composables/ValidationRules';
import SettingsLayout from './components/SettingsLayout.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import TrafficModule from './subforms/TrafficModule.vue';
import NodeStatusModule from './subforms/NodeStatusModule.vue';
import AmbientLightModule from './subforms/AmbientLightModule.vue';
import AtakModule from './subforms/AtakModule.vue';
import AudioModule from './subforms/AudioModule.vue';
import RangeTestModule from './subforms/RangeTestModule.vue';
import NeighborInfoModule from './subforms/NeighborInfoModule.vue';
import PaxCounterModule from './subforms/PaxCounterModule.vue';
import ExtNotificationModule from './subforms/ExtNotificationModule.vue';
import CannedMessageModule from './subforms/CannedMessageModule.vue';
import StoreForwardModule from './subforms/StoreForwardModule.vue';
import MqttModule from './subforms/MqttModule.vue';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';
import { purgeUncloneableProperties } from '@/composables/stores/utils/purgeUncloneable';
import { useConfigSave } from '@/composables/useConfigSave';
import { onBeforeRouteLeave } from 'vue-router';
import { useConfirm } from '@/composables/useConfirmDialog';

const device = useDeviceStore().device;
const saveButtonDisable = ref(true);
const saveConfigHandler = useConfigSave();

const isSerialDirty = computed(() => {
  return false;
});
const isTelemetryDirty = computed(() => {
  return false;
});

const mqttConfig = ref<Protobuf.ModuleConfig.ModuleConfig_MQTTConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_MQTTConfigSchema)
);
const isMqttDirty = computed(() => {
  if (!device.value?.moduleConfig.mqtt) return false;
  return !useDeepCompareConfig(mqttConfig.value, device.value?.moduleConfig.mqtt, true);
});
const mqttV$ = useVuelidate(MqttRules, mqttConfig);

const mapReportConfig = ref<Protobuf.ModuleConfig.ModuleConfig_MapReportSettings>(
  create(Protobuf.ModuleConfig.ModuleConfig_MapReportSettingsSchema)
);
const isMapReportDirty = computed(() => {
  if (!device.value?.moduleConfig.mqtt?.mapReportSettings) return false;
  return !useDeepCompareConfig(
    mapReportConfig.value,
    device.value?.moduleConfig.mqtt.mapReportSettings,
    true
  );
});
const mapReportV$ = useVuelidate(MapReportRules, mapReportConfig);

const storeForwardConfig = ref<Protobuf.ModuleConfig.ModuleConfig_StoreForwardConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_StoreForwardConfigSchema)
);
const isStoreForwardDirty = computed(() => {
  if (!device.value?.moduleConfig.storeForward) return false;
  return !useDeepCompareConfig(
    storeForwardConfig.value,
    device.value?.moduleConfig.storeForward,
    true
  );
});
const storeForwardV$ = useVuelidate(StoreForwardRules, storeForwardConfig);

const cannedMessagesConfig = ref<Protobuf.ModuleConfig.ModuleConfig_CannedMessageConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_CannedMessageConfigSchema)
);
const isCannedMessagesDirty = computed(() => {
  if (!device.value?.moduleConfig.cannedMessage) return false;
  return !useDeepCompareConfig(
    cannedMessagesConfig.value,
    device.value?.moduleConfig.cannedMessage,
    true
  );
});
const cannedMessagesV$ = useVuelidate(CannedMessagesRules, cannedMessagesConfig);

const audioConfig = ref<Protobuf.ModuleConfig.ModuleConfig_AudioConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_AudioConfigSchema)
);
const isAudioDirty = computed(() => {
  if (!device.value?.moduleConfig.audio) return false;
  return !useDeepCompareConfig(audioConfig.value, device.value?.moduleConfig.audio, true);
});
const audioV$ = useVuelidate(AudioRules, audioConfig);

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

const rangeTestConfig = ref<Protobuf.ModuleConfig.ModuleConfig_RangeTestConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_RangeTestConfigSchema)
);
const isRangeTestDirty = computed(() => {
  if (!device.value?.moduleConfig.rangeTest) return false;
  return !useDeepCompareConfig(rangeTestConfig.value, device.value?.moduleConfig.rangeTest, true);
});
const rangeTestV$ = useVuelidate(RangeTestRules, rangeTestConfig);

const neighborInfoConfig = ref<Protobuf.ModuleConfig.ModuleConfig_NeighborInfoConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_NeighborInfoConfigSchema)
);
const isNeighborInfoDirty = computed(() => {
  if (!device.value?.moduleConfig.neighborInfo) return false;
  return !useDeepCompareConfig(
    neighborInfoConfig.value,
    device.value?.moduleConfig.neighborInfo,
    true
  );
});
const neighborInfoV$ = useVuelidate(NeighborInfoRules, neighborInfoConfig);

const paxCounterConfig = ref<Protobuf.ModuleConfig.ModuleConfig_PaxcounterConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_PaxcounterConfigSchema)
);
const isPaxCounterDirty = computed(() => {
  if (!device.value?.moduleConfig.paxcounter) return false;
  return !useDeepCompareConfig(paxCounterConfig.value, device.value?.moduleConfig.paxcounter, true);
});
const paxCounterV$ = useVuelidate(PaxCounterRules, paxCounterConfig);

const externalNotificationConfig =
  ref<Protobuf.ModuleConfig.ModuleConfig_ExternalNotificationConfig>(
    create(Protobuf.ModuleConfig.ModuleConfig_ExternalNotificationConfigSchema)
  );
const isExternalNotificationDirty = computed(() => {
  if (!device.value?.moduleConfig.externalNotification) return false;
  return !useDeepCompareConfig(
    externalNotificationConfig.value,
    device.value?.moduleConfig.externalNotification,
    true
  );
});
const externalNotificationV$ = useVuelidate(ExternalNotificationRules, externalNotificationConfig);

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
    conf = dev.getEffectiveModuleConfig('audio');
    if (conf) {
      Object.assign(audioConfig.value, dev.moduleConfig.audio);
    }
    conf = dev.getEffectiveModuleConfig('rangeTest');
    if (conf) {
      Object.assign(rangeTestConfig.value, dev.moduleConfig.rangeTest);
    }
    conf = dev.getEffectiveModuleConfig('neighborInfo');
    if (conf) {
      Object.assign(neighborInfoConfig.value, dev.moduleConfig.neighborInfo);
    }
    conf = dev.getEffectiveModuleConfig('paxcounter');
    if (conf) {
      Object.assign(paxCounterConfig.value, dev.moduleConfig.paxcounter);
    }
    conf = dev.getEffectiveModuleConfig('externalNotification');
    if (conf) {
      Object.assign(externalNotificationConfig.value, dev.moduleConfig.externalNotification);
    }
    conf = dev.getEffectiveModuleConfig('cannedMessage');
    if (conf) {
      Object.assign(cannedMessagesConfig.value, dev.moduleConfig.cannedMessage);
    }
    conf = dev.getEffectiveModuleConfig('storeForward');
    if (conf) {
      Object.assign(storeForwardConfig.value, dev.moduleConfig.storeForward);
    }
    conf = dev.getEffectiveModuleConfig('mqtt');
    if (conf) {
      Object.assign(mqttConfig.value, dev.moduleConfig.mqtt);
      if (
        mqttConfig.value.mapReportSettings &&
        Object.keys(mqttConfig.value.mapReportSettings).length > 0
      ) {
        Object.assign(mapReportConfig.value, dev.moduleConfig.mqtt?.mapReportSettings);
      }
    }
  },
  { immediate: true, once: true }
);

const onSaveSettings = () => {};
</script>
