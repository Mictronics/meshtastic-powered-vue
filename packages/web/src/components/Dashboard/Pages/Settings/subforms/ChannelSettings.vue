<template>
  <div>
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Channel Settings</h4>
      <p class="text-slate-400">Crypto, MQTT & misc settings</p>
    </div>
    <Tabs :value="selectedChannel" @update:value="handleChannelChange">
      <TabList>
        <Tab v-for="ch in channels" :key="ch.index" :value="ch.index" pt:root:class="font-light">
          {{ ch.settings?.name || `Channel ${ch.index}` }}
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel v-for="ch in channels" :key="ch.index" :value="ch.index" as="div">
          <FormChannel
            :channel="ch"
            :selected-channel="selectedChannel"
            @update-channel="onUpdateChannel"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Protobuf } from '@meshtastic/core';
import FormChannel from '../components/FormChannel.vue';

const channels = defineModel<Protobuf.Channel.Channel[]>('channels');
const selectedChannel = ref<number>(0);
const handleChannelChange = (value: string | number) => {
  const val = Number(value);
  selectedChannel.value = val;
};

const onUpdateChannel = (updatedChannel: Protobuf.Channel.Channel) => {
  if (!channels.value) return;
  const index = channels.value.findIndex((ch) => ch.index === selectedChannel.value);

  if (index === -1) return;
  channels.value = channels.value.map((ch, i) => (i === index ? updatedChannel : ch));
};
</script>
