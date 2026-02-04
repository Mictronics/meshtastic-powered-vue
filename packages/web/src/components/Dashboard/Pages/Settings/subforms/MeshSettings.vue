<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Mesh Settings</h4>
      <p class="text-slate-400">Settings for the LoRa mesh</p>
    </div>
    <FormGrid>
      <FormRow
        label="Region"
        for-id="region"
        description="Sets the region for your node."
        :error="useGetError(v$.region)"
      >
        <Select
          aria-labelledby="region"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="region"
          :options="regionOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select your region"
          :invalid="v$.region.$invalid"
          @blur="v$.region.$touch()"
        />
      </FormRow>

      <FormRow
        label="Hop Limit"
        for-id="hopLimit"
        description="Maximum number of hops."
        :error="useGetError(v$.hopLimit)"
      >
        <Select
          aria-labelledby="hopLimit"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="hopLimit"
          :options="hopLimitOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select hop limit"
          :invalid="v$.hopLimit.$invalid"
          @blur="v$.hopLimit.$touch()"
        />
      </FormRow>

      <FormRow
        label="Frequency Slot"
        for-id="frequencySlot"
        description="LoRa frequency channel number."
        :error="useGetError(v$.frequencySlot)"
      >
        <InputText
          id="frequencySlot"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          v-model="frequencySlot"
          :invalid="v$.frequencySlot.$invalid"
          @blur="v$.frequencySlot.$touch()"
        />
      </FormRow>

      <FormRow
        label="Forward MQTT"
        for-id="forwardMqtt"
        description="Forward MQTT messages over the mesh."
      >
        <ToggleSwitch input-id="forwardMqtt" v-model="forwardMqtt" />
      </FormRow>

      <FormRow
        label="Allow MQTT upload"
        for-id="allowMqtt"
        description="When enabled, the user approves the packet to be uploaded via MQTT. When disabled, remote
        nodes are requested not to forward packets via MQTT."
      >
        <ToggleSwitch input-id="allowMqtt" v-model="allowMqtt" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import type { Validation } from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';

defineProps<{
  v$: Validation;
}>();

const region = defineModel<number>('region');
const hopLimit = defineModel<number>('hopLimit');
const frequencySlot = defineModel<string>('frequencySlot');
const forwardMqtt = defineModel<boolean>('forwardMqtt');
const allowMqtt = defineModel<boolean>('allowMqtt');

type HopLimit = 1 | 2 | 3 | 4 | 5 | 6 | 7;
const hopLimitOptions: { label: string; value: HopLimit }[] = [
  { label: '1 hop', value: 1 },
  { label: '2 hops', value: 2 },
  { label: '3 hops', value: 3 },
  { label: '4 hops', value: 4 },
  { label: '5 hops', value: 5 },
  { label: '6 hops', value: 5 },
  { label: '7 hops', value: 5 },
];

const regionOptions = Object.entries(Protobuf.Config.Config_LoRaConfig_RegionCode)
  .filter(([_, value]) => typeof value === 'number')
  .map(([key, value]) => ({
    label: key,
    value: value as Protobuf.Config.Config_LoRaConfig_RegionCode,
  }));
</script>
