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
        <AccordionContent>
          <UserSettings
            v-model:isLicensed="userConfig.isLicensed"
            v-model:isUnmessagable="userConfig.isUnmessagable"
            v-model:longName="userConfig.longName"
            v-model:shortName="userConfig.shortName"
            :id="userConfig.id"
            :hwModel="userConfig.hwModel"
            :v$="userV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="device">
        <AccordionHeader>
          <DirtyHeader title="Device" :dirty="isDeviceDirty" />
        </AccordionHeader>
        <AccordionContent>
          <DeviceSettings
            v-model:buttonGpio="deviceConfig.buttonGpio"
            v-model:buzzerGpio="deviceConfig.buzzerGpio"
            v-model:buzzerMode="deviceConfig.buzzerMode"
            v-model:disableTripleClick="deviceConfig.disableTripleClick"
            v-model:doubleTapAsButtonPress="deviceConfig.doubleTapAsButtonPress"
            v-model:ledHeartbeatDisabled="deviceConfig.ledHeartbeatDisabled"
            v-model:nodeInfoBroadcastSecs="deviceConfig.nodeInfoBroadcastSecs"
            v-model:rebroadcastMode="deviceConfig.rebroadcastMode"
            v-model:role="deviceConfig.role"
            v-model:tzdef="deviceConfig.tzdef"
            :v$="deviceV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="position">
        <AccordionHeader>
          <DirtyHeader title="Position" :dirty="isPositionDirty" />
        </AccordionHeader>
        <AccordionContent>
          <PositionSettings
            v-model:broadcastSmartMinimumDistance="positionConfig.broadcastSmartMinimumDistance"
            v-model:broadcastSmartMinimumIntervalSecs="
              positionConfig.broadcastSmartMinimumIntervalSecs
            "
            v-model:fixedPosition="positionConfig.fixedPosition"
            v-model:gpsEnGpio="positionConfig.gpsEnGpio"
            v-model:gpsMode="positionConfig.gpsMode"
            v-model:gpsUpdateInterval="positionConfig.gpsUpdateInterval"
            v-model:positionBroadcastSecs="positionConfig.positionBroadcastSecs"
            v-model:positionBroadcastSmartEnabled="positionConfig.positionBroadcastSmartEnabled"
            v-model:positionFlags="positionConfig.positionFlags"
            v-model:rxGpio="positionConfig.rxGpio"
            v-model:txGpio="positionConfig.txGpio"
            v-model:latitude="latitude"
            v-model:longitude="longitude"
            v-model:altitude="altitude"
            :v$="positionV$"
          />
        </AccordionContent>
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
        <AccordionContent>
          <BluetoothSettings
            v-model:enabled="bluetoothConfig.enabled"
            v-model:fixedPin="bluetoothConfig.fixedPin"
            v-model:mode="bluetoothConfig.mode"
            :v$="bluetoothV$"
          />
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </SettingsLayout>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { useVuelidate } from '@vuelidate/core';
import SettingsLayout from './components/SettingsLayout.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import UserSettings from './subforms/UserSettings.vue';
import DeviceSettings from './subforms/DeviceSettings.vue';
import PositionSettings from './subforms/PositionSettings.vue';
import BluetoothSettings from './subforms/BluetoothSettings.vue';
import { useConfigSave } from '@/composables/useConfigSave';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/stores/nodeDB/useNodeDBStore';
import {
  UserRules,
  BluetoothRules,
  DeviceRules,
  PositionRules,
} from '@/composables/ValidationRules';

const device = useDeviceStore().device;
const database = useNodeDBStore().nodeDatabase;
const saveButtonDisable = ref(true);
const saveConfigHandler = useConfigSave();

const userConfig = ref<Protobuf.Mesh.User>(create(Protobuf.Mesh.UserSchema));
const userV$ = useVuelidate(UserRules, userConfig);

const bluetoothConfig = ref<Protobuf.Config.Config_BluetoothConfig>(
  create(Protobuf.Config.Config_BluetoothConfigSchema)
);
const bluetoothV$ = useVuelidate(BluetoothRules, bluetoothConfig);

const deviceConfig = ref<Protobuf.Config.Config_DeviceConfig>(
  create(Protobuf.Config.Config_DeviceConfigSchema)
);
const deviceV$ = useVuelidate(DeviceRules, deviceConfig);

const positionConfig = ref<Protobuf.Config.Config_PositionConfig>(
  create(Protobuf.Config.Config_PositionConfigSchema)
);
const positionV$ = useVuelidate(PositionRules, positionConfig);

const currentPosition = ref<Protobuf.Mesh.Position>(create(Protobuf.Mesh.PositionSchema));

const latitude = ref<number>(0);
const longitude = ref<number>(0);
const altitude = ref<number>(0);

watchEffect(() => {
  const node = database.value?.getMyNode();
  if (!node) return;

  userConfig.value = {
    ...userConfig.value,
    ...node.user,
  };

  const currentPosition = node.position;
  latitude.value = currentPosition?.latitudeI ? currentPosition.latitudeI / 1e7 : 0;
  longitude.value = currentPosition?.latitudeI ? currentPosition.latitudeI / 1e7 : 0;
  altitude.value = currentPosition?.altitude ?? 0;
});

watchEffect(() => {
  if (!device) return;

  bluetoothConfig.value = {
    ...bluetoothConfig.value,
    ...device.value?.config.bluetooth,
  };

  deviceConfig.value = {
    ...deviceConfig.value,
    ...device.value?.config.device,
  };

  positionConfig.value = {
    ...positionConfig.value,
    ...device.value?.config.position,
  };
});

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
