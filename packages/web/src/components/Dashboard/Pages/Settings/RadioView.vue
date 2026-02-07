<template>
  <SettingsLayout
    :saveButtonDisable="saveButtonDisable"
    :onSaveSettings="onSaveSettings"
    :saveConfigHandler="saveConfigHandler"
  >
    <template #title>Radio</template>
    <Accordion>
      <AccordionPanel value="lora">
        <AccordionHeader>
          <DirtyHeader title="LoRa" :dirty="isLoraDirty" />
        </AccordionHeader>
        <AccordionContent>
          <MeshSettings
            v-model:ignore-mqtt="loraConfig.ignoreMqtt"
            v-model:config-ok-to-mqtt="loraConfig.configOkToMqtt"
            v-model:channel-num="loraConfig.channelNum"
            v-model:hop-limit="loraConfig.hopLimit"
            v-model:region="loraConfig.region"
            :v$="loraV$"
          />
          <WaveformSettings
            v-model:bandwidth="loraConfig.bandwidth"
            v-model:coding-rate="loraConfig.codingRate"
            v-model:modem-preset="loraConfig.modemPreset"
            v-model:spread-factor="loraConfig.spreadFactor"
            v-model:use-preset="loraConfig.usePreset"
            :v$="loraV$"
          />
          <RadioSettings
            v-model:sx126x-rx-boosted-gain="loraConfig.sx126xRxBoostedGain"
            v-model:frequency-offset="loraConfig.frequencyOffset"
            v-model:override-duty-cycle="loraConfig.overrideDutyCycle"
            v-model:override-frequency="loraConfig.overrideFrequency"
            v-model:tx-enabled="loraConfig.txEnabled"
            v-model:tx-power="loraConfig.txPower"
            v-model:pa-fan-disabled="loraConfig.paFanDisabled"
            :v$="loraV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="channels">
        <AccordionHeader>
          <DirtyHeader title="Channels" :dirty="isChannelsDirty" />
        </AccordionHeader>
        <AccordionContent>
          <ChannelSettings v-model:channels="allChannels" :dirty-flags="channelDirtyFlags" />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="security">
        <AccordionHeader>
          <DirtyHeader title="Security" :dirty="isSecurityDirty" />
        </AccordionHeader>
        <AccordionContent>
          <SecuritySettings
            v-model:admin-channel-enabled="securityConfig.adminChannelEnabled"
            v-model:debug-log-api-enabled="securityConfig.debugLogApiEnabled"
            v-model:is-managed="securityConfig.isManaged"
            v-model:serial-enabled="securityConfig.serialEnabled"
            v-model:private-key="securityConfig.privateKey"
            v-model:public-key="securityConfig.publicKey"
            v-model:admin-key0="securityConfig.adminKey[0]"
            v-model:admin-key1="securityConfig.adminKey[1]"
            v-model:admin-key2="securityConfig.adminKey[2]"
          />
        </AccordionContent>
      </AccordionPanel>
    </Accordion>
  </SettingsLayout>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { ref, computed, watchEffect, toRaw } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { LoraRules } from '@/composables/ValidationRules';
import SettingsLayout from './components/SettingsLayout.vue';
import MeshSettings from './subforms/MeshSettings.vue';
import WaveformSettings from './subforms/WaveformSettings.vue';
import RadioSettings from './subforms/RadioSettings.vue';
import ChannelSettings from './subforms/ChannelSettings.vue';
import SecuritySettings from './subforms/SecuritySettings.vue';
import DirtyHeader from './components/DirtyHeader.vue';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';
import { purgeUncloneableProperties } from '@/composables/stores/utils/purgeUncloneable';
import { useConfigSave } from '@/composables/useConfigSave';
import { onBeforeRouteLeave } from 'vue-router';
import { useConfirm } from '@/composables/useConfirmDialog';

const device = useDeviceStore().device;
const saveConfigHandler = useConfigSave();
const allChannels = ref<Protobuf.Channel.Channel[]>(
  Array.from({ length: 8 }, () => create(Protobuf.Channel.ChannelSchema))
);
const loraConfig = ref<Protobuf.Config.Config_LoRaConfig>(
  create(Protobuf.Config.Config_LoRaConfigSchema)
);
const securityConfig = ref<Protobuf.Config.Config_SecurityConfig>(
  create(Protobuf.Config.Config_SecurityConfigSchema)
);

const loraV$ = useVuelidate(LoraRules, loraConfig);

watchEffect(() => {
  if (!device.value) return;

  const lora = device.value.getEffectiveConfig('lora');
  const channels = device.value.channels;
  const security = device.value.getEffectiveConfig('security');
  if (!lora || !security) return;

  loraConfig.value = {
    ...loraConfig.value,
    ...lora,
  };

  securityConfig.value = {
    ...securityConfig.value,
    ...security,
  };

  allChannels.value = Object.values(channels);
});

const isLoraDirty = computed(() => {
  if (!device.value?.config.lora) return false;
  const dirty = !useDeepCompareConfig(loraConfig.value, device.value?.config.lora, true);
  if (!dirty) {
    device.value?.removeChange({ type: 'config', variant: 'lora' });
  }
  return dirty;
});

const channelDirtyFlags = computed(() => {
  if (!device.value?.channels) return allChannels.value.map(() => false);

  const deviceChannels = Object.values(device.value.channels);
  return allChannels.value.map((channel, index) => {
    const original = deviceChannels[index];
    return !useDeepCompareConfig(channel, original, true);
  });
});

const isChannelsDirty = computed(() => channelDirtyFlags.value.some(Boolean));

const isSecurityDirty = computed(() => {
  if (!device.value?.config.security) return false;
  const dirty = !useDeepCompareConfig(securityConfig.value, device.value?.config.security, true);
  if (!dirty) {
    device.value?.removeChange({ type: 'config', variant: 'security' });
  }
  return dirty;
});

const saveButtonDisable = computed(
  () => !isLoraDirty.value && !isChannelsDirty.value && !isSecurityDirty.value
);

const onSaveSettings = () => {
  loraV$.value.$touch();

  if (loraV$.value.$invalid) {
    return;
  }

  if (isLoraDirty.value) {
    const conf = toRaw(loraConfig.value);
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'config', variant: 'lora' }, conf);
  }

  if (isChannelsDirty.value) {
    allChannels.value.forEach((channel, index) => {
      if (channelDirtyFlags.value[index]) {
        const channelRaw = toRaw(channel);
        purgeUncloneableProperties(channelRaw);
        device.value?.setChange({ type: 'channel', index }, channelRaw);
      } else {
        device.value?.removeChange({ type: 'channel', index: channel.index });
      }
    });
  }

  if (isSecurityDirty.value) {
    const conf = toRaw(securityConfig.value);
    purgeUncloneableProperties(conf);
    device.value?.setChange({ type: 'config', variant: 'security' }, conf);
  }

  saveConfigHandler.save();
};

const { open } = useConfirm();
onBeforeRouteLeave(async (to, from, next) => {
  if (saveConfigHandler.isSaving.value || !saveButtonDisable.value) {
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
