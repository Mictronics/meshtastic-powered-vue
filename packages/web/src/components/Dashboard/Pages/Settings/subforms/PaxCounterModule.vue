<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the pax counter</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Pax Counter"
        for-id="enablePaxCounter"
        description="Enable pax counter module. ESP32 only."
      >
        <ToggleSwitch input-id="enablePaxCounter" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Update Interval"
        for-id="updateInterval"
        description="Pax counter update interval."
        :error="useGetError(v$.paxcounterUpdateInterval)"
      >
        <InputGroup>
          <InputText
            id="updateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="paxcounterUpdateIntervalInput"
            type="number"
            min="3600"
            max="4294967295"
            step="1"
            :invalid="v$.paxcounterUpdateInterval.$invalid"
            @blur="v$.paxcounterUpdateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="WiFi RSSI"
        for-id="wifiRssi"
        description="WiFi RSSI threshold."
        :error="useGetError(v$.wifiThreshold)"
      >
        <InputGroup>
          <InputText
            id="wifiRssi"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="wifiThresholdInput"
            type="number"
            min="-120"
            max="0"
            step="1"
            :invalid="v$.wifiThreshold.$invalid"
            @blur="v$.wifiThreshold.$touch()"
          />
          <InputGroupAddon>dBm</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="BLE RSSI"
        for-id="bleRssi"
        description="BLE RSSI threshold."
        :error="useGetError(v$.bleThreshold)"
      >
        <InputGroup>
          <InputText
            id="bleRssi"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="bleThresholdInput"
            type="number"
            min="-120"
            max="0"
            step="1"
            :invalid="v$.bleThreshold.$invalid"
            @blur="v$.bleThreshold.$touch()"
          />
          <InputGroupAddon>dBm</InputGroupAddon>
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

const paxcounterUpdateInterval = defineModel<number>('paxcounterUpdateInterval');
const wifiThreshold = defineModel<number>('wifiThreshold');
const bleThreshold = defineModel<number>('bleThreshold');
const enabled = defineModel<boolean>('enabled');

const paxcounterUpdateIntervalInput = computed<string>({
  get() {
    return paxcounterUpdateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    paxcounterUpdateInterval.value = Number.isNaN(n) ? 3600 : n;
  },
});

const wifiThresholdInput = computed<string>({
  get() {
    return wifiThreshold.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    wifiThreshold.value = Number.isNaN(n) ? -80 : n;
  },
});

const bleThresholdInput = computed<string>({
  get() {
    return bleThreshold.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    bleThreshold.value = Number.isNaN(n) ? -80 : n;
  },
});
</script>
