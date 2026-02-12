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
        <AccordionContent>
          <PowerSettings
            v-model:adcMultiplierOverride="powerConfig.adcMultiplierOverride"
            v-model:deviceBatteryInaAddress="powerConfig.deviceBatteryInaAddress"
            v-model:isPowerSaving="powerConfig.isPowerSaving"
            v-model:lsSecs="powerConfig.lsSecs"
            v-model:sdsSecs="powerConfig.sdsSecs"
            v-model:minWakeSecs="powerConfig.minWakeSecs"
            v-model:onBatteryShutdownAfterSecs="powerConfig.onBatteryShutdownAfterSecs"
            v-model:waitBluetoothSecs="powerConfig.waitBluetoothSecs"
            :v$="powerV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="network">
        <AccordionHeader><DirtyHeader title="Network" :dirty="isNetworkDirty" /></AccordionHeader>
        <AccordionContent>
          <NetworkSettings
            v-model:addressMode="networkConfig.addressMode"
            v-model:enabledProtocols="networkConfig.enabledProtocols"
            v-model:ethEnabled="networkConfig.ethEnabled"
            v-model:ntpServer="networkConfig.ntpServer"
            v-model:rsyslogServer="networkConfig.rsyslogServer"
            v-model:wifiEnabled="networkConfig.wifiEnabled"
            v-model:wifiPsk="networkConfig.wifiPsk"
            v-model:wifiSsid="networkConfig.wifiSsid"
            v-model:ip="ipConfig.ip"
            v-model:dns="ipConfig.dns"
            v-model:gateway="ipConfig.gateway"
            v-model:subnet="ipConfig.subnet"
            :ipV$="ipV$"
            :networkV$="networkV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="display">
        <AccordionHeader><DirtyHeader title="Display" :dirty="isDisplayDirty" /></AccordionHeader>
        <AccordionContent>
          <DisplaySettings
            v-model:autoScreenCarouselSecs="displayConfig.autoScreenCarouselSecs"
            v-model:compassNorthTop="displayConfig.compassNorthTop"
            v-model:compassOrientation="displayConfig.compassOrientation"
            v-model:displaymode="displayConfig.displaymode"
            v-model:enableMessageBubbles="displayConfig.enableMessageBubbles"
            v-model:flipScreen="displayConfig.flipScreen"
            v-model:headingBold="displayConfig.headingBold"
            v-model:oled="displayConfig.oled"
            v-model:screenOnSecs="displayConfig.screenOnSecs"
            v-model:units="displayConfig.units"
            v-model:use12hClock="displayConfig.use12hClock"
            v-model:useLongNodeName="displayConfig.useLongNodeName"
            v-model:wakeOnTapOrMotion="displayConfig.wakeOnTapOrMotion"
            :v$="displayV$"
          />
        </AccordionContent>
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
import { ref, computed, watch, type Ref } from 'vue';
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { useVuelidate } from '@vuelidate/core';
import SettingsLayout from './components/SettingsLayout.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import UserSettings from './subforms/UserSettings.vue';
import DeviceSettings from './subforms/DeviceSettings.vue';
import PositionSettings from './subforms/PositionSettings.vue';
import BluetoothSettings from './subforms/BluetoothSettings.vue';
import PowerSettings from './subforms/PowerSettings.vue';
import NetworkSettings from './subforms/NetworkSettings.vue';
import DisplaySettings from './subforms/DisplaySettings.vue';
import { useConfigSave } from '@/composables/useConfigSave';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/stores/nodeDB/useNodeDBStore';
import {
  UserRules,
  BluetoothRules,
  DeviceRules,
  PositionRules,
  PowerRules,
  NetworkRules,
  Ipv4Rules,
  DisplayRules,
} from '@/composables/ValidationRules';
import { convertIntToIpAddress } from '@/composables/useIpConvert';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';

const device = useDeviceStore().device;
const database = useNodeDBStore().nodeDatabase;
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

const powerConfig = ref<Protobuf.Config.Config_PowerConfig>(
  create(Protobuf.Config.Config_PowerConfigSchema)
);
const powerV$ = useVuelidate(PowerRules, powerConfig);

const networkConfig = ref<Protobuf.Config.Config_NetworkConfig>(
  create(Protobuf.Config.Config_NetworkConfigSchema)
);
const networkV$ = useVuelidate(NetworkRules, networkConfig);

const ipConfig = ref({
  ip: '',
  dns: '',
  gateway: '',
  subnet: '',
});
const ipV$ = useVuelidate(Ipv4Rules, ipConfig);

const displayConfig = ref<Protobuf.Config.Config_DisplayConfig>(
  create(Protobuf.Config.Config_DisplayConfigSchema)
);
const displayV$ = useVuelidate(DisplayRules, displayConfig);

type ConfigType = NonNullable<typeof device.value>['config'];
const createDirtyComputed = <K extends keyof ConfigType>(
  localRef: Ref<ConfigType[K]>,
  devicePath: K
) => {
  return computed(() => {
    const current = device.value?.config?.[devicePath];
    if (!current) return false;

    return !useDeepCompareConfig(localRef.value, current, true);
  });
};

const isUserDirty = computed(() => {
  const node = database.value?.getMyNode();
  if (!node) return false;
  return !useDeepCompareConfig(userConfig.value, node.user, true);
});

const isDeviceDirty = createDirtyComputed(deviceConfig, 'device');
watch(
  isDeviceDirty,
  (dirty) => {
    if (!dirty) {
      device.value?.removeChange({ type: 'config', variant: 'device' });
    }
  },
  { immediate: true }
);

const isPositionDirty = createDirtyComputed(positionConfig, 'position');
watch(
  isPositionDirty,
  (dirty) => {
    if (!dirty) {
      device.value?.removeChange({ type: 'config', variant: 'position' });
    }
  },
  { immediate: true }
);

const isPowerDirty = createDirtyComputed(powerConfig, 'power');
watch(
  isPowerDirty,
  (dirty) => {
    if (!dirty) {
      device.value?.removeChange({ type: 'config', variant: 'power' });
    }
  },
  { immediate: true }
);

const isNetworkDirty = createDirtyComputed(networkConfig, 'network');
watch(
  isNetworkDirty,
  (dirty) => {
    if (!dirty) {
      device.value?.removeChange({ type: 'config', variant: 'network' });
    }
  },
  { immediate: true }
);

const isIpDirty = computed(() => {
  const ipc = device.value?.config.network?.ipv4Config;
  if (!ipc) return false;

  return (
    ipConfig.value.ip !== convertIntToIpAddress(ipc.ip ?? 0) ||
    ipConfig.value.dns !== convertIntToIpAddress(ipc.dns ?? 0) ||
    ipConfig.value.gateway !== convertIntToIpAddress(ipc.gateway ?? 0) ||
    ipConfig.value.subnet !== convertIntToIpAddress(ipc.subnet ?? 0)
  );
});

const isDisplayDirty = createDirtyComputed(displayConfig, 'display');
watch(
  isDisplayDirty,
  (dirty) => {
    if (!dirty) {
      device.value?.removeChange({ type: 'config', variant: 'display' });
    }
  },
  { immediate: true }
);

const isBluetoothDirty = createDirtyComputed(bluetoothConfig, 'bluetooth');
watch(
  isBluetoothDirty,
  (dirty) => {
    if (!dirty) {
      device.value?.removeChange({ type: 'config', variant: 'bluetooth' });
    }
  },
  { immediate: true }
);

watch(
  () => database.value?.getMyNode(),
  (node) => {
    if (!node) return;
    Object.assign(userConfig.value, node.user);
    const pos = node.position;
    latitude.value = pos?.latitudeI ? pos.latitudeI / 1e7 : 0;
    longitude.value = pos?.longitudeI ? pos.longitudeI / 1e7 : 0;
    altitude.value = pos?.altitude ?? 0;
  },
  { immediate: true, once: true }
);

watch(
  () => device.value?.config,
  (config) => {
    if (!config) return;

    Object.assign(bluetoothConfig.value, config.bluetooth);
    Object.assign(deviceConfig.value, config.device);
    Object.assign(positionConfig.value, config.position);
    Object.assign(powerConfig.value, config.power);
    Object.assign(networkConfig.value, config.network);
    Object.assign(displayConfig.value, config.display);
    const ipc = config.network?.ipv4Config;
    ipConfig.value.ip = convertIntToIpAddress(ipc?.ip ?? 0);
    ipConfig.value.dns = convertIntToIpAddress(ipc?.dns ?? 0);
    ipConfig.value.gateway = convertIntToIpAddress(ipc?.gateway ?? 0);
    ipConfig.value.subnet = convertIntToIpAddress(ipc?.subnet ?? 0);
  },
  { immediate: true, once: true }
);

const isAnyDirty = computed(
  () =>
    isUserDirty.value ||
    isDeviceDirty.value ||
    isPositionDirty.value ||
    isPowerDirty.value ||
    isNetworkDirty.value ||
    isIpDirty.value ||
    isDisplayDirty.value ||
    isBluetoothDirty.value
);

const isAnyInvalid = computed(
  () =>
    userV$.value.$invalid ||
    deviceV$.value.$invalid ||
    positionV$.value.$invalid ||
    powerV$.value.$invalid ||
    networkV$.value.$invalid ||
    ipV$.value.$invalid ||
    displayV$.value.$invalid ||
    bluetoothV$.value.$invalid
);

const saveButtonDisable = computed(() => !isAnyDirty.value || isAnyInvalid.value);
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
