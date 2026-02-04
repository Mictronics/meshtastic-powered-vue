<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Mesh Settings</h4>
      <p class="text-slate-400">Settings for the LoRa mesh</p>
    </div>
    <FormGrid>
      <FormRow label="Region" for-id="region" description="Sets the region for your node.">
        <Select
          aria-labelledby="region"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.region"
        />
      </FormRow>

      <FormRow label="Hop Limit" for-id="hopLimit" description="Maximum number of hops.">
        <Select
          aria-labelledby="hopLimit"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.hopLimit"
        />
      </FormRow>

      <FormRow
        label="Frequency Slot"
        for-id="frequencySlot"
        description="LoRa frequency channel number."
      >
        <InputText
          id="frequencySlot"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="model.frequencySlot"
        />
      </FormRow>

      <FormRow
        label="Forward MQTT"
        for-id="forwardMqtt"
        description="Forward MQTT messages over the mesh."
      >
        <ToggleSwitch input-id="forwardMqtt" v-model="model.forwardMqtt" />
      </FormRow>

      <FormRow
        label="Allow MQTT upload"
        for-id="allowMqtt"
        description="When enabled, the user approves the packet to be uploaded via MQTT. When disabled, remote
        nodes are requested not to forward packets via MQTT."
      >
        <ToggleSwitch input-id="allowMqtt" v-model="model.allowMqtt" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';

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
