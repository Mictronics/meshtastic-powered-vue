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
          label-class="dark:bg-slate-800 dark:text-slate-400"
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
          label-class="dark:bg-slate-800 dark:text-slate-400"
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
        for-id="channelNum"
        description="LoRa frequency channel number."
        :error="useGetError(v$.channelNum)"
      >
        <InputText
          id="channelNum"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          v-model="channelNumInput"
          :invalid="v$.channelNum.$invalid"
          @blur="v$.channelNum.$touch()"
        />
      </FormRow>

      <FormRow
        label="Forward MQTT"
        for-id="configOkToMqtt"
        description="Forward MQTT messages over the mesh."
      >
        <ToggleSwitch input-id="configOkToMqtt" v-model="configOkToMqtt" />
      </FormRow>

      <FormRow
        label="Allow MQTT upload"
        for-id="ignoreMqtt"
        description="When enabled, the user approves the packet to be uploaded via MQTT. When disabled, remote
        nodes are requested not to forward packets via MQTT."
      >
        <ToggleSwitch input-id="ignoreMqtt" v-model="ignoreMqtt" />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Protobuf } from '@meshtastic/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import type { Validation } from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const region = defineModel<number>('region');
const hopLimit = defineModel<number>('hopLimit');
const channelNum = defineModel<number>('channelNum');
const configOkToMqtt = defineModel<boolean>('configOkToMqtt');
const ignoreMqtt = defineModel<boolean>('ignoreMqtt');
const channelNumInput = computed<string>({
  get() {
    return channelNum.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    channelNum.value = Number.isNaN(n) ? undefined : n;
  },
});

type HopLimit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
const hopLimitOptions: { label: string; value: HopLimit }[] = [
  { label: 'Direct', value: 0 },
  { label: '1 hop', value: 1 },
  { label: '2 hops', value: 2 },
  { label: '3 hops', value: 3 },
  { label: '4 hops', value: 4 },
  { label: '5 hops', value: 5 },
  { label: '6 hops', value: 6 },
  { label: '7 hops', value: 7 },
];

const regionOptions = useEnumOptions(Protobuf.Config.Config_LoRaConfig_RegionCode);
</script>
