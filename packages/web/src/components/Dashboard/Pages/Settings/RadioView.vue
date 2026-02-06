<template>
  <Fieldset pt:legend:class="fieldset-legend" class="m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <span class="font-bold">Radio</span>
        <SaveButton type="submit" :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
      </div>
    </template>
    <Accordion v-model:value="activeSettingTab">
      <AccordionPanel value="lora">
        <AccordionHeader>
          <div>
            LoRa
            <span v-if="isLoraDirty" class="ml-2 text-orange-500 text-sm">●</span>
          </div>
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
          <div>
            Channels
            <span v-if="isChannelsDirty" class="ml-2 text-orange-500 text-sm">●</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <ChannelSettings v-model:channels="allChannels" :dirty-flags="channelDirtyFlags" />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="security">
        <AccordionHeader>
          <div>
            Security
            <span v-if="isSecurityDirty" class="ml-2 text-orange-500 text-sm">●</span>
          </div>
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
  </Fieldset>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { ref, computed, watchEffect, toRaw } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { LoraRules } from '@/composables/ValidationRules';
import SaveButton from './components/SaveButton.vue';
import MeshSettings from './subforms/MeshSettings.vue';
import WaveformSettings from './subforms/WaveformSettings.vue';
import RadioSettings from './subforms/RadioSettings.vue';
import ChannelSettings from './subforms/ChannelSettings.vue';
import SecuritySettings from './subforms/SecuritySettings.vue';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';
import { purgeUncloneableProperties } from '@/composables/core/stores/utils/purgeUncloneable';

const activeSettingTab = ref();
const device = useDeviceStore().device;
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
  const channels = device.value.get
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
};
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
