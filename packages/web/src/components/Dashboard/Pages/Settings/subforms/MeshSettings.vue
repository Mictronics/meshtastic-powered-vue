<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Mesh Settings</h4>
      <p class="text-slate-400">Settings for the LoRa mesh</p>
    </div>
    <FormGrid>
      <span id="region" class="font-medium">Region</span>
      <Select
        aria-labelledby="region"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        v-model="model.region"
      />
      <p class="text-slate-400">Sets the region for your node</p>

      <span id="hopLimit" class="font-medium">Hop Limit</span>
      <Select
        aria-labelledby="hopLimit"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        v-model="model.hopLimit"
      />
      <p class="text-slate-400">Maximum number of hops</p>

      <label for="frequencySlot" class="font-medium">Frequency Slot</label>
      <InputText
        id="frequencySlot"
        class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        v-model="model.frequencySlot"
      />
      <p class="text-slate-400">LoRa frequency channel number</p>

      <label for="forwardMqtt" class="font-medium">Forward MQTT</label>
      <ToggleSwitch input-id="forwardMqtt" v-model="model.forwardMqtt" />
      <p class="text-slate-400">Forward MQTT messages over the mesh</p>

      <label for="allowMqtt" class="font-medium">Allow MQTT upload</label>
      <ToggleSwitch input-id="allowMqtt" v-model="model.allowMqtt" />
      <p class="text-slate-400">
        When enabled, the user approves the packet to be uploaded via MQTT. When disabled, remote
        nodes are requested not to forward packets via MQTT.
      </p>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';

defineProps<{
  model: {
    region: string;
    hopLimit: number;
    frequencySlot: string;
    forwardMqtt: boolean;
    allowMqtt: boolean;
  };
}>();
</script>
