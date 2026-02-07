<template>
  <div v-if="allChannels.length > 0" class="grid grid-cols-1">
    <div v-for="ch in allChannels" :key="ch.index" class="flex gap-2 justify-start">
      <Checkbox
        v-model="selectedChannels"
        :inputId="`channel${ch.index}`"
        name="selectedChannels"
        :value="ch.index"
        size="small"
      />
      <label :for="`channel${ch.index}`">
        {{
          ch.settings?.name.length
            ? ch.settings.name
            : ch.role === Protobuf.Channel.Channel_Role.PRIMARY
              ? 'Primary'
              : `Channel ${ch.index}`
        }}
      </label>
    </div>
    <div><img v-if="qrCode" :src="qrCode" alt="QR Code" /></div>
    <div class="pb-6">
      <SelectButton v-model="addChannels" :options="['Add', 'Replace']" size="small" />
    </div>
    <FloatLabel>
      <InputText id="shareableUrl" v-model="shareableUrl" :disabled="true" size="small" />
      <label for="shareableUrl">Shareable URL</label>
    </FloatLabel>
  </div>
</template>

<script setup lang="ts">
import { create, toBinary } from '@bufbuild/protobuf';
import { Protobuf } from '@meshtastic/core';
import { fromByteArray } from 'base64-js';
import QRCode from 'qrcode';
import { shallowRef, ref, computed, watch } from 'vue';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';

const device = useDeviceStore().device;
const loraConfig = computed(() => device.value?.config.lora);
const allChannels = computed(() => {
  return Object.values(device.value?.channels || {});
});
const selectedChannels = ref<number[]>([0]);
const qrCode = shallowRef();
const addChannels = ref('Add');
const shareableUrl = ref('');

watch(
  [selectedChannels, addChannels, loraConfig, allChannels],
  async () => {
    if (!device.value || !selectedChannels.value.length) {
      shareableUrl.value = '';
      qrCode.value = undefined;
      return;
    }

    const settings = allChannels.value
      .filter((ch) => selectedChannels.value.includes(ch.index))
      .map((ch) => ch.settings)
      .filter((s): s is Protobuf.Channel.ChannelSettings => Boolean(s));

    if (!settings.length) return;

    const message = create(Protobuf.AppOnly.ChannelSetSchema, {
      loraConfig: loraConfig.value,
      settings,
    });

    const base64 = fromByteArray(toBinary(Protobuf.AppOnly.ChannelSetSchema, message))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    shareableUrl.value = `https://meshtastic.org/e/${
      addChannels.value === 'Add' ? '?add=true' : ''
    }#${base64}`;

    qrCode.value = await QRCode.toDataURL(shareableUrl.value);
  },
  { immediate: true }
);
</script>
