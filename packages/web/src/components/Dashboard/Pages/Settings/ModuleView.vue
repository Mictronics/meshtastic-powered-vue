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
        <AccordionContent>
          <SerialModule
            v-model:baud="serialConfig.baud"
            v-model:echo="serialConfig.echo"
            v-model:enabled="serialConfig.enabled"
            v-model:mode="serialConfig.mode"
            v-model:overrideConsoleSerialPort="serialConfig.overrideConsoleSerialPort"
            v-model:rxd="serialConfig.rxd"
            v-model:timeout="serialConfig.timeout"
            v-model:txd="serialConfig.txd"
            :v$="serialV$"
          />
        </AccordionContent>
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
        <AccordionContent>
          <TelemetryModule
            v-model:deviceTelemetryEnabled="telemetryConfig.deviceTelemetryEnabled"
            v-model:deviceUpdateInterval="telemetryConfig.deviceUpdateInterval"
            v-model:environmentMeasurementEnabled="telemetryConfig.environmentMeasurementEnabled"
            v-model:environmentUpdateInterval="telemetryConfig.environmentUpdateInterval"
            v-model:environmentScreenEnabled="telemetryConfig.environmentScreenEnabled"
            v-model:environmentDisplayFahrenheit="telemetryConfig.environmentDisplayFahrenheit"
            v-model:airQualityEnabled="telemetryConfig.airQualityEnabled"
            v-model:airQualityInterval="telemetryConfig.airQualityInterval"
            v-model:airQualityScreenEnabled="telemetryConfig.airQualityScreenEnabled"
            v-model:powerMeasurementEnabled="telemetryConfig.powerMeasurementEnabled"
            v-model:powerUpdateInterval="telemetryConfig.powerUpdateInterval"
            v-model:powerScreenEnabled="telemetryConfig.powerScreenEnabled"
            v-model:healthMeasurementEnabled="telemetryConfig.healthMeasurementEnabled"
            v-model:healthUpdateInterval="telemetryConfig.healthUpdateInterval"
            v-model:healthScreenEnabled="telemetryConfig.healthScreenEnabled"
            :v$="telemetryV$"
          />
        </AccordionContent>
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
            v-model:nodeinfoDirectResponseMaxHops="
              trafficManagementConfig.nodeinfoDirectResponseMaxHops
            "
            v-model:positionMinIntervalSecs="trafficManagementConfig.positionMinIntervalSecs"
            v-model:rateLimitMaxPackets="trafficManagementConfig.rateLimitMaxPackets"
            v-model:rateLimitWindowSecs="trafficManagementConfig.rateLimitWindowSecs"
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
      <AccordionPanel value="meshBeacon">
        <AccordionHeader>
          <DirtyHeader title="Mesh Beacon" :dirty="isMeshBeaconDirty" />
        </AccordionHeader>
        <AccordionContent>
          <MeshBeaconModule
            v-model:flags="meshBeaconConfig.flags"
            v-model:broadcastMessage="meshBeaconConfig.broadcastMessage"
            v-model:broadcastIntervalSecs="meshBeaconConfig.broadcastIntervalSecs"
            v-model:broadcastSendAsNode="meshBeaconConfig.broadcastSendAsNode"
            :v$="meshBeaconV$"
          />
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </SettingsLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRaw } from 'vue';
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { useVuelidate } from '@vuelidate/core';
import {
  TrafficManagementRules,
  StatusMessageRules,
  AmbientLightRules,
  AtakRules,
  MeshBeaconRules,
  AudioRules,
  RangeTestRules,
  NeighborInfoRules,
  PaxCounterRules,
  TelemetryRules,
  ExternalNotificationRules,
  CannedMessagesRules,
  StoreForwardRules,
  MqttRules,
  MapReportRules,
  SerialRules,
} from '@/composables/ValidationRules';
import SettingsLayout from './components/SettingsLayout.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import TrafficModule from './subforms/TrafficModule.vue';
import NodeStatusModule from './subforms/NodeStatusModule.vue';
import AmbientLightModule from './subforms/AmbientLightModule.vue';
import AtakModule from './subforms/AtakModule.vue';
import MeshBeaconModule from './subforms/MeshBeaconModule.vue';
import AudioModule from './subforms/AudioModule.vue';
import RangeTestModule from './subforms/RangeTestModule.vue';
import NeighborInfoModule from './subforms/NeighborInfoModule.vue';
import PaxCounterModule from './subforms/PaxCounterModule.vue';
import TelemetryModule from './subforms/TelemetryModule.vue';
import ExtNotificationModule from './subforms/ExtNotificationModule.vue';
import CannedMessageModule from './subforms/CannedMessageModule.vue';
import StoreForwardModule from './subforms/StoreForwardModule.vue';
import MqttModule from './subforms/MqttModule.vue';
import SerialModule from './subforms/SerialModule.vue';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';
import { purgeUncloneableProperties } from '@/composables/stores/utils/purgeUncloneable';
import { useConfigSave } from '@/composables/useConfigSave';
import { onBeforeRouteLeave } from 'vue-router';
import { useConfirm } from '@/composables/useConfirmDialog';
import type { ValidModuleConfigType } from '@/composables/stores/device/changeRegistry';

const device = useDeviceStore().device;
const saveConfigHandler = useConfigSave();

const serialConfig = ref<Protobuf.ModuleConfig.ModuleConfig_SerialConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_SerialConfigSchema)
);
const isSerialDirty = computed(() => {
  if (!device.value?.moduleConfig.serial) return false;
  return !useDeepCompareConfig(serialConfig.value, device.value?.moduleConfig.serial, true);
});
const serialV$ = useVuelidate(SerialRules, serialConfig);

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

const telemetryConfig = ref<Protobuf.ModuleConfig.ModuleConfig_TelemetryConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_TelemetryConfigSchema)
);
const isTelemetryDirty = computed(() => {
  if (!device.value?.moduleConfig.telemetry) return false;
  return !useDeepCompareConfig(telemetryConfig.value, device.value?.moduleConfig.telemetry, true);
});
const telemetryV$ = useVuelidate(TelemetryRules, telemetryConfig);

const meshBeaconConfig = ref<Protobuf.ModuleConfig.ModuleConfig_MeshBeaconConfig>(
  create(Protobuf.ModuleConfig.ModuleConfig_MeshBeaconConfigSchema)
);
const isMeshBeaconDirty = computed(() => {
  if (!device.value?.moduleConfig.meshBeacon) return false;
  return !useDeepCompareConfig(meshBeaconConfig.value, device.value?.moduleConfig.meshBeacon, true);
});
const meshBeaconV$ = useVuelidate(MeshBeaconRules, meshBeaconConfig);

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

    const assignIfExists = (key: ValidModuleConfigType, target: any) => {
      const conf = dev.getEffectiveModuleConfig(key);
      if (conf && dev.moduleConfig[key]) {
        Object.assign(target.value, dev.moduleConfig[key]);
      }
    };

    assignIfExists('trafficManagement', trafficManagementConfig);
    assignIfExists('statusmessage', statusMessageConfig);
    assignIfExists('ambientLighting', ambientLightConfig);
    assignIfExists('tak', atakConfig);
    assignIfExists('telemetry', telemetryConfig);
    assignIfExists('meshBeacon', meshBeaconConfig);
    assignIfExists('audio', audioConfig);
    assignIfExists('rangeTest', rangeTestConfig);
    assignIfExists('neighborInfo', neighborInfoConfig);
    assignIfExists('paxcounter', paxCounterConfig);
    assignIfExists('externalNotification', externalNotificationConfig);
    assignIfExists('cannedMessage', cannedMessagesConfig);
    assignIfExists('storeForward', storeForwardConfig);
    assignIfExists('mqtt', mqttConfig);
    if (
      mqttConfig.value.mapReportSettings &&
      Object.keys(mqttConfig.value.mapReportSettings).length > 0
    ) {
      Object.assign(mapReportConfig.value, dev.moduleConfig.mqtt?.mapReportSettings);
    }
    assignIfExists('serial', serialConfig);
  },
  { immediate: true, once: true }
);

const isAnyDirty = computed(
  () =>
    isMqttDirty.value ||
    isMapReportDirty.value ||
    isSerialDirty.value ||
    isExternalNotificationDirty.value ||
    isStoreForwardDirty.value ||
    isRangeTestDirty.value ||
    isCannedMessagesDirty.value ||
    isAudioDirty.value ||
    isNeighborInfoDirty.value ||
    isAmbientLightDirty.value ||
    isPaxCounterDirty.value ||
    isTrafficManagementDirty.value ||
    isStatusMessageDirty.value ||
    isAtakDirty.value ||
    isTelemetryDirty.value ||
    isMeshBeaconDirty.value
);

const isAnyInvalid = computed(
  () =>
    mqttV$.value.$invalid ||
    mapReportV$.value.$invalid ||
    serialV$.value.$invalid ||
    externalNotificationV$.value.$invalid ||
    storeForwardV$.value.$invalid ||
    rangeTestV$.value.$invalid ||
    cannedMessagesV$.value.$invalid ||
    audioV$.value.$invalid ||
    neighborInfoV$.value.$invalid ||
    ambientLightV$.value.$invalid ||
    paxCounterV$.value.$invalid ||
    trafficManagementV$.value.$invalid ||
    statusMessageV$.value.$invalid ||
    atakV$.value.$invalid ||
    telemetryV$.value.$invalid ||
    meshBeaconV$.value.$invalid
);

const saveButtonDisable = computed(() => !isAnyDirty.value || isAnyInvalid.value);

const onSaveSettings = () => {
  if (!isAnyDirty.value) return;

  if (isMqttDirty.value || isMapReportDirty.value) {
    const conf = structuredClone(toRaw(mqttConfig.value));
    purgeUncloneableProperties(conf);
    if (isMapReportDirty.value) {
      conf.mapReportSettings = structuredClone(toRaw(mapReportConfig.value));
      purgeUncloneableProperties(conf.mapReportSettings);
    }
    device.value?.setChange({ type: 'moduleConfig', variant: 'mqtt' }, conf);
  }

  if (isSerialDirty.value) {
    const conf = structuredClone(toRaw(serialConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'serial' }, conf);
  }

  if (isExternalNotificationDirty.value) {
    const conf = structuredClone(toRaw(externalNotificationConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'externalNotification' }, conf);
  }

  if (isStoreForwardDirty.value) {
    const conf = structuredClone(toRaw(storeForwardConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'storeForward' }, conf);
  }

  if (isRangeTestDirty.value) {
    const conf = structuredClone(toRaw(rangeTestConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'rangeTest' }, conf);
  }

  if (isCannedMessagesDirty.value) {
    const conf = structuredClone(toRaw(cannedMessagesConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'cannedMessage' }, conf);
  }

  if (isAudioDirty.value) {
    const conf = structuredClone(toRaw(audioConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'audio' }, conf);
  }

  if (isNeighborInfoDirty.value) {
    const conf = structuredClone(toRaw(neighborInfoConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'neighborInfo' }, conf);
  }

  if (isAmbientLightDirty.value) {
    const conf = structuredClone(toRaw(ambientLightConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'ambientLighting' }, conf);
  }

  if (isPaxCounterDirty.value) {
    const conf = structuredClone(toRaw(paxCounterConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'paxcounter' }, conf);
  }

  if (isTrafficManagementDirty.value) {
    const conf = structuredClone(toRaw(trafficManagementConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'trafficManagement' }, conf);
  }

  if (isStatusMessageDirty.value) {
    const conf = structuredClone(toRaw(statusMessageConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'statusmessage' }, conf);
  }

  if (isAtakDirty.value) {
    const conf = structuredClone(toRaw(atakConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'tak' }, conf);
  }

  if (isTelemetryDirty.value) {
    const conf = structuredClone(toRaw(telemetryConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'telemetry' }, conf);
  }

  if (isMeshBeaconDirty.value) {
    const conf = structuredClone(toRaw(meshBeaconConfig.value));
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'moduleConfig', variant: 'meshBeacon' }, conf);
  }

  saveConfigHandler.save();
};

const { open } = useConfirm();
onBeforeRouteLeave(async (to, from, next) => {
  if (saveConfigHandler.isSaving.value) {
    next(false);
    return;
  }

  if (isAnyDirty.value) {
    const confirmed = await open({
      header: 'Discard pending changes?',
      message: 'Leaving the page will discard all changes.',
      acceptLabel: 'Leave',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      next();
    } else {
      next(false);
    }
  } else {
    next();
  }
});
</script>
