<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for neighbor info broadcast</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Neighbor Info"
        for-id="enableNeighborInfo"
        description="Enable neighbor info module."
      >
        <ToggleSwitch input-id="enableNeighborInfo" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Transmit Over LoRa"
        for-id="transmitOverLora"
        description="Whether in addition to sending it to MQTT and the PhoneAPI, NeighborInfo should be transmitted over LoRa."
      >
        <ToggleSwitch input-id="transmitOverLora" v-model="transmitOverLora" />
      </FormRow>

      <FormRow
        label="Update Interval"
        for-id="updateInterval"
        description="Interval how often we send the Neighbor Info."
        :error="useGetError(v$.updateInterval)"
      >
        <InputGroup>
          <InputText
            id="updateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="updateIntervalInput"
            type="number"
            min="14400"
            max="4294967295"
            step="1"
            :invalid="v$.updateInterval.$invalid"
            @blur="v$.updateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';

defineProps<{
  v$: Validation;
}>();

const updateInterval = defineModel<number>('updateInterval');
const enabled = defineModel<boolean>('enabled');
const transmitOverLora = defineModel<boolean>('transmitOverLora');

const updateIntervalInput = computed<string>({
  get() {
    return updateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    updateInterval.value = Number.isNaN(n) ? 14400 : n;
  },
});
</script>
