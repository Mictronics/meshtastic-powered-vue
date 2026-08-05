<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for telemetry broadcast</p>
    </div>
    <FormGrid>
      <FormRow
        label="Device Telemetry Enabled"
        for-id="deviceTelemetryEnabled"
        description="Enable sending device metrics (battery, voltage, channel utilization, etc.) to the mesh."
      >
        <ToggleSwitch input-id="deviceTelemetryEnabled" v-model="deviceTelemetryEnabled" />
      </FormRow>

      <FormRow
        label="Device Update Interval"
        for-id="deviceUpdateInterval"
        description="Interval how often we should try to send our device metrics to the mesh."
        :error="useGetError(v$.deviceUpdateInterval)"
      >
        <InputGroup>
          <InputText
            id="deviceUpdateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="deviceUpdateIntervalInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.deviceUpdateInterval.$invalid"
            @blur="v$.deviceUpdateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Environment Measurement Enabled"
        for-id="environmentMeasurementEnabled"
        description="Enable the telemetry module's environment measurement collection."
      >
        <ToggleSwitch
          input-id="environmentMeasurementEnabled"
          v-model="environmentMeasurementEnabled"
        />
      </FormRow>

      <FormRow
        label="Environment Update Interval"
        for-id="environmentUpdateInterval"
        description="Interval how often we should try to send our environment measurements to the mesh."
        :error="useGetError(v$.environmentUpdateInterval)"
      >
        <InputGroup>
          <InputText
            id="environmentUpdateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="environmentUpdateIntervalInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.environmentUpdateInterval.$invalid"
            @blur="v$.environmentUpdateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Environment Screen Enabled"
        for-id="environmentScreenEnabled"
        description="Enable the telemetry module's on-device display for environment measurements."
      >
        <ToggleSwitch input-id="environmentScreenEnabled" v-model="environmentScreenEnabled" />
      </FormRow>

      <FormRow
        label="Environment Display Fahrenheit"
        for-id="environmentDisplayFahrenheit"
        description="Display environment temperature readings in Fahrenheit instead of Celsius."
      >
        <ToggleSwitch
          input-id="environmentDisplayFahrenheit"
          v-model="environmentDisplayFahrenheit"
        />
      </FormRow>

      <FormRow
        label="Air Quality Enabled"
        for-id="airQualityEnabled"
        description="Enable air quality metrics collection."
      >
        <ToggleSwitch input-id="airQualityEnabled" v-model="airQualityEnabled" />
      </FormRow>

      <FormRow
        label="Air Quality Interval"
        for-id="airQualityInterval"
        description="Interval how often we should try to send our air quality metrics to the mesh."
        :error="useGetError(v$.airQualityInterval)"
      >
        <InputGroup>
          <InputText
            id="airQualityInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="airQualityIntervalInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.airQualityInterval.$invalid"
            @blur="v$.airQualityInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Air Quality Screen Enabled"
        for-id="airQualityScreenEnabled"
        description="Enable the telemetry module's on-device display for air quality metrics."
      >
        <ToggleSwitch input-id="airQualityScreenEnabled" v-model="airQualityScreenEnabled" />
      </FormRow>

      <FormRow
        label="Power Measurement Enabled"
        for-id="powerMeasurementEnabled"
        description="Enable power metrics collection."
      >
        <ToggleSwitch input-id="powerMeasurementEnabled" v-model="powerMeasurementEnabled" />
      </FormRow>

      <FormRow
        label="Power Update Interval"
        for-id="powerUpdateInterval"
        description="Interval how often we should try to send our power metrics to the mesh."
        :error="useGetError(v$.powerUpdateInterval)"
      >
        <InputGroup>
          <InputText
            id="powerUpdateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="powerUpdateIntervalInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.powerUpdateInterval.$invalid"
            @blur="v$.powerUpdateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Power Screen Enabled"
        for-id="powerScreenEnabled"
        description="Enable the telemetry module's on-device display for power metrics."
      >
        <ToggleSwitch input-id="powerScreenEnabled" v-model="powerScreenEnabled" />
      </FormRow>

      <FormRow
        label="Health Measurement Enabled"
        for-id="healthMeasurementEnabled"
        description="Enable health metrics collection."
      >
        <ToggleSwitch input-id="healthMeasurementEnabled" v-model="healthMeasurementEnabled" />
      </FormRow>

      <FormRow
        label="Health Update Interval"
        for-id="healthUpdateInterval"
        description="Interval how often we should try to send our health metrics to the mesh."
        :error="useGetError(v$.healthUpdateInterval)"
      >
        <InputGroup>
          <InputText
            id="healthUpdateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="healthUpdateIntervalInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.healthUpdateInterval.$invalid"
            @blur="v$.healthUpdateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Health Screen Enabled"
        for-id="healthScreenEnabled"
        description="Enable the telemetry module's on-device display for health metrics."
      >
        <ToggleSwitch input-id="healthScreenEnabled" v-model="healthScreenEnabled" />
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

const deviceTelemetryEnabled = defineModel<boolean>('deviceTelemetryEnabled');
const deviceUpdateInterval = defineModel<number>('deviceUpdateInterval');
const environmentMeasurementEnabled = defineModel<boolean>('environmentMeasurementEnabled');
const environmentUpdateInterval = defineModel<number>('environmentUpdateInterval');
const environmentScreenEnabled = defineModel<boolean>('environmentScreenEnabled');
const environmentDisplayFahrenheit = defineModel<boolean>('environmentDisplayFahrenheit');
const airQualityEnabled = defineModel<boolean>('airQualityEnabled');
const airQualityInterval = defineModel<number>('airQualityInterval');
const airQualityScreenEnabled = defineModel<boolean>('airQualityScreenEnabled');
const powerMeasurementEnabled = defineModel<boolean>('powerMeasurementEnabled');
const powerUpdateInterval = defineModel<number>('powerUpdateInterval');
const powerScreenEnabled = defineModel<boolean>('powerScreenEnabled');
const healthMeasurementEnabled = defineModel<boolean>('healthMeasurementEnabled');
const healthUpdateInterval = defineModel<number>('healthUpdateInterval');
const healthScreenEnabled = defineModel<boolean>('healthScreenEnabled');

const deviceUpdateIntervalInput = computed<string>({
  get() {
    return deviceUpdateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    deviceUpdateInterval.value = Number.isNaN(n) ? 0 : n;
  },
});

const environmentUpdateIntervalInput = computed<string>({
  get() {
    return environmentUpdateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    environmentUpdateInterval.value = Number.isNaN(n) ? 0 : n;
  },
});

const airQualityIntervalInput = computed<string>({
  get() {
    return airQualityInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    airQualityInterval.value = Number.isNaN(n) ? 0 : n;
  },
});

const powerUpdateIntervalInput = computed<string>({
  get() {
    return powerUpdateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    powerUpdateInterval.value = Number.isNaN(n) ? 0 : n;
  },
});

const healthUpdateIntervalInput = computed<string>({
  get() {
    return healthUpdateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    healthUpdateInterval.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
