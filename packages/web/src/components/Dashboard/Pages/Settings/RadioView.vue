<template>
  <Fieldset pt:legend:class="fieldset-legend" class="m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <span class="font-bold">Radio</span>
        <SaveButton type="submit" :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
      </div>
    </template>
    <Accordion value="0">
      <AccordionPanel value="0">
        <AccordionHeader>
          <div>
            LoRa
            <span v-if="isLoraDirty" class="ml-2 text-orange-500">●</span>
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
      <AccordionPanel value="1">
        <AccordionHeader>
          <div>
            Channels
            <span v-if="isChannelsDirty" class="ml-2 text-orange-500">●</span>
          </div>
        </AccordionHeader>
        <AccordionContent>
          <ChannelSettings v-model:channels="allChannels" />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="2">
        <AccordionHeader>Security</AccordionHeader>
        <AccordionContent></AccordionContent>
      </AccordionPanel>
    </Accordion>
  </Fieldset>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import { create } from '@bufbuild/protobuf';
import { ref, computed, watchEffect } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { LoraRules } from './subforms/ValidationRules';
import SaveButton from './components/SaveButton.vue';
import MeshSettings from './subforms/MeshSettings.vue';
import WaveformSettings from './subforms/WaveformSettings.vue';
import RadioSettings from './subforms/RadioSettings.vue';
import ChannelSettings from './subforms/ChannelSettings.vue';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useDeepCompareConfig } from '@/composables/useDeepCompareConfig';

const device = useDeviceStore().device;
const allChannels = ref<Protobuf.Channel.Channel[]>(
  Array.from({ length: 8 }, () => create(Protobuf.Channel.ChannelSchema))
);
const loraConfig = ref<Protobuf.Config.Config_LoRaConfig>(
  create(Protobuf.Config.Config_LoRaConfigSchema)
);

const loraV$ = useVuelidate(LoraRules, loraConfig);

watchEffect(() => {
  if (!device.value) return;

  const lora = device.value.config?.lora;
  const channels = device.value.channels;
  if (!lora) return;

  loraConfig.value = {
    ...loraConfig.value,
    ...lora,
  };

  allChannels.value = Object.values(channels);
});

const isLoraDirty = computed(() => {
  if (!device.value?.config.lora) return false;
  return !useDeepCompareConfig(loraConfig.value, device.value?.config.lora, true);
});

const isChannelsDirty = computed(() => {
  if (!device.value?.channels) return false;
  return !useDeepCompareConfig(allChannels.value, Object.values(device.value?.channels), true);
});

const saveButtonDisable = computed(() => !isLoraDirty.value && !isChannelsDirty.value);
const onSaveSettings = () => {
  loraV$.value.$touch();

  if (loraV$.value.$invalid) {
    return;
  }

  if (isLoraDirty.value) {
    device.value?.setChange({ type: 'config', variant: 'lora' }, loraConfig);
  }

  if (isChannelsDirty.value) {
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
