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
        <AccordionHeader>LoRa</AccordionHeader>
        <AccordionContent>
          <MeshSettings
            v-model:allow-mqtt="meshSettings.ignoreMqtt"
            v-model:forward-mqtt="meshSettings.configOkToMqtt"
            v-model:frequency-slot="meshSettings.channelNum"
            v-model:hop-limit="meshSettings.hopLimit"
            v-model:region="meshSettings.region"
            :v$="meshV$"
          />
          <WaveformSettings
            v-model:bandwidth="waveformSettings.bandwidth"
            v-model:coding-rate="waveformSettings.codingRate"
            v-model:modem-preset="waveformSettings.modemPreset"
            v-model:spreading-factor="waveformSettings.spreadFactor"
            v-model:use-preset="waveformSettings.usePreset"
            :v$="waveformV$"
          />
          <RadioSettings
            v-model:boosted-gain="radioSettings.sx1262RxBoostedGain"
            v-model:frequency-offset="radioSettings.frequencyOffset"
            v-model:override-duty-cycle="radioSettings.overrideDutyCycle"
            v-model:override-frequency="radioSettings.overrideFrequency"
            v-model:transmit-enabled="radioSettings.txEnabled"
            v-model:transmit-power="radioSettings.txPower"
            v-model:pa-fan-disabled="radioSettings.paFanDisabled"
            :v$="radioV$"
          />
        </AccordionContent>
      </AccordionPanel>
      <AccordionPanel value="1">
        <AccordionHeader>Channels</AccordionHeader>
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
import { ref, reactive, computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { RadioRules, MeshRules, WaveformRules } from './subforms/ValidationRules';
import SaveButton from './components/SaveButton.vue';
import MeshSettings from './subforms/MeshSettings.vue';
import WaveformSettings from './subforms/WaveformSettings.vue';
import RadioSettings from './subforms/RadioSettings.vue';
import ChannelSettings from './subforms/ChannelSettings.vue';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';

const device = useDeviceStore().device;
const config = ref(device.value?.config.lora);

const meshSettings = reactive({
  region: 0,
  hopLimit: 3,
  channelNum: '0',
  configOkToMqtt: false,
  ignoreMqtt: false,
});

const waveformSettings = reactive({
  usePreset: true,
  modemPreset: 0,
  bandwidth: '0',
  spreadFactor: '0',
  codingRate: '0',
});

const radioSettings = reactive({
  txEnabled: true,
  txPower: '0',
  overrideDutyCycle: false,
  frequencyOffset: '0',
  overrideFrequency: '0',
  sx1262RxBoostedGain: true,
  paFanDisabled: false,
});

const radioV$ = useVuelidate(RadioRules, radioSettings);
const meshV$ = useVuelidate(MeshRules, meshSettings);
const waveformV$ = useVuelidate(WaveformRules, waveformSettings);

const saveButtonDisable = ref(true);
const onSaveSettings = () => {
  meshV$.value.$touch();
  waveformV$.value.$touch();
  radioV$.value.$touch();

  if (meshV$.value.$invalid || waveformV$.value.$invalid || radioV$.value.$invalid) {
    return;
  }
};

let allChannels = reactive<Protobuf.Channel.Channel[]>([
  {
    $typeName: 'meshtastic.Channel',
    index: 0,
    role: 1,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [1],
      name: 'LongFast',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
      moduleSettings: {
        $typeName: 'meshtastic.ModuleSettings',
        positionPrecision: 0,
        isClientMuted: false,
      },
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 1,
    role: 2,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [
        43, 187, 99, 123, 165, 82, 13, 213, 94, 54, 16, 15, 214, 51, 247, 199, 119, 111, 52, 91, 86,
        59, 128, 158, 222, 115, 236, 162, 133, 66, 12, 168,
      ],
      name: 'Deutsch',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
      moduleSettings: {
        $typeName: 'meshtastic.ModuleSettings',
        positionPrecision: 0,
        isClientMuted: false,
      },
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 2,
    role: 2,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [2],
      name: 'Bayern',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
      moduleSettings: {
        $typeName: 'meshtastic.ModuleSettings',
        positionPrecision: 14,
        isClientMuted: false,
      },
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 3,
    role: 2,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [130],
      name: 'Franken',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
      moduleSettings: {
        $typeName: 'meshtastic.ModuleSettings',
        positionPrecision: 14,
        isClientMuted: false,
      },
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 4,
    role: 2,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [
        250, 228, 204, 17, 163, 145, 238, 25, 42, 105, 123, 254, 13, 19, 142, 17, 222, 65, 134, 240,
        8, 65, 143, 194, 103, 241, 235, 226, 202, 25, 112, 229,
      ],
      name: 'Mesh Hessen',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
      moduleSettings: {
        $typeName: 'meshtastic.ModuleSettings',
        positionPrecision: 10,
        isClientMuted: false,
      },
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 5,
    role: 2,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [12],
      name: 'DonauRies',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 6,
    role: 0,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [],
      name: '',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
    },
  },
  {
    $typeName: 'meshtastic.Channel',
    index: 7,
    role: 0,
    settings: {
      $typeName: 'meshtastic.ChannelSettings',
      channelNum: 0,
      psk: [],
      name: '',
      id: 0,
      uplinkEnabled: false,
      downlinkEnabled: false,
      mute: false,
    },
  },
]);
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
