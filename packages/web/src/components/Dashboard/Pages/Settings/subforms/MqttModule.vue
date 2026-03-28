<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for communication via MQTT</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable MQTT"
        for-id="enabled"
        description="If a node is able to reach the internet it will normally attempt to gateway any channels."
      >
        <ToggleSwitch input-id="enabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Enable Encryption"
        for-id="encryptionEnabled"
        description="Whether to send encrypted or decrypted packets to MQTT"
      >
        <ToggleSwitch input-id="encryptionEnabled" v-model="encryptionEnabled" />
      </FormRow>

      <FormRow
        label="Enable JSON"
        for-id="jsonEnabled"
        description="Whether to send or consume JSON packets on MQTT."
      >
        <ToggleSwitch input-id="jsonEnabled" v-model="jsonEnabled" />
      </FormRow>

      <FormRow
        label="Enable Map Reporting"
        for-id="mapReportingEnabled"
        description="Periodically report unencrypted information about our node to a map via MQTT."
      >
        <ToggleSwitch input-id="mapReportingEnabled" v-model="mapReportingEnabled" />
      </FormRow>

      <FormRow
        label="Report Location"
        for-id="shouldReportLocation"
        description="Whether we have opted-in to report our location to the map."
      >
        <ToggleSwitch input-id="shouldReportLocation" v-model="shouldReportLocation" />
      </FormRow>

      <FormRow
        label="Enable Client Proxy"
        for-id="proxyToClientEnabled"
        description="Use the connected phone or client to proxy messages to MQTT instead of a direct connection."
      >
        <ToggleSwitch input-id="proxyToClientEnabled" v-model="proxyToClientEnabled" />
      </FormRow>

      <FormRow
        label="Enable TLS"
        for-id="tlsEnabled"
        description="Attempt to establish a secure connection using TLS."
      >
        <ToggleSwitch input-id="tlsEnabled" v-model="tlsEnabled" />
      </FormRow>

      <FormRow
        label="Address"
        for-id="address"
        description="The server to use for our MQTT global message gateway feature."
        :error="useGetError(mqttV$.address)"
      >
        <InputText
          id="address"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="text"
          minlength="0"
          maxlength="64"
          v-model="address"
          :invalid="mqttV$.address.$invalid"
          @blur="mqttV$.address.$touch()"
        />
      </FormRow>

      <FormRow
        label="Username"
        for-id="username"
        description="MQTT username to use (most useful for a custom MQTT server)."
        :error="useGetError(mqttV$.username)"
      >
        <InputText
          id="address"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="text"
          minlength="0"
          maxlength="64"
          v-model="username"
          :invalid="mqttV$.username.$invalid"
          @blur="mqttV$.username.$touch()"
        />
      </FormRow>

      <FormRow
        label="Password"
        for-id="password"
        description="MQTT password to use (most useful for a custom MQTT server)."
        :error="useGetError(mqttV$.password)"
      >
        <InputText
          id="wifiPsk"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          v-model="password"
          type="password"
          minlength="0"
          maxlength="32"
          :invalid="mqttV$.password.$invalid"
          @blur="mqttV$.password.$touch()"
        />
      </FormRow>

      <FormRow
        label="Root Topic"
        for-id="root"
        description="The root topic to use for MQTT messages. Default is 'msh'."
        :error="useGetError(mqttV$.root)"
      >
        <InputText
          id="address"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="text"
          minlength="0"
          maxlength="32"
          v-model="root"
          :invalid="mqttV$.root.$invalid"
          @blur="mqttV$.root.$touch()"
        />
      </FormRow>

      <FormRow
        label="Map Report Interval"
        for-id="publishIntervalSecs"
        description="How often we should report our info to the map."
        :error="useGetError(mapReportV$.publishIntervalSecs)"
      >
        <InputGroup>
          <InputText
            id="publishIntervalSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="publishIntervalSecsInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="mapReportV$.publishIntervalSecs.$invalid"
            @blur="mapReportV$.publishIntervalSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Position Precision"
        for-id="position"
        description="Precision for the map position sent (default of 32 is full precision)."
        :error="useGetError(mapReportV$.positionPrecision)"
      >
        <Select
          aria-labelledby="position"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          :options="positionOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select position precision"
          v-model="positionPrecision"
          @change="mapReportV$.positionPrecision.$touch()"
          :invalid="mapReportV$.positionPrecision.$invalid"
        />
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
  mqttV$: Validation;
  mapReportV$: Validation;
}>();

const enabled = defineModel<boolean>('enabled');
const encryptionEnabled = defineModel<boolean>('encryptionEnabled');
const jsonEnabled = defineModel<boolean>('jsonEnabled');
const mapReportingEnabled = defineModel<boolean>('mapReportingEnabled');
const proxyToClientEnabled = defineModel<boolean>('proxyToClientEnabled');
const tlsEnabled = defineModel<boolean>('tlsEnabled');
const address = defineModel<string>('address');
const username = defineModel<string>('username');
const password = defineModel<string>('password');
const root = defineModel<string>('root');
const publishIntervalSecs = defineModel<number>('publishIntervalSecs');
const positionPrecision = defineModel<number>('positionPrecision');
const shouldReportLocation = defineModel<boolean>('shouldReportLocation');

type Position = 0 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 32;
const positionOptions: { label: string; value: Position }[] = [
  { label: 'Do not share position', value: 0 },
  { label: '23 km', value: 10 },
  { label: '12 km', value: 11 },
  { label: '5.8 km', value: 12 },
  { label: '2.9 km', value: 13 },
  { label: '1.5 km', value: 14 },
  { label: '700 m', value: 15 },
  { label: '350 m', value: 16 },
  { label: '200 m', value: 17 },
  { label: '90 m', value: 18 },
  { label: '50 m', value: 19 },
  { label: 'Precise', value: 32 },
];

const publishIntervalSecsInput = computed<string>({
  get() {
    return publishIntervalSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    publishIntervalSecs.value = Number.isNaN(n) ? 3600 : n;
  },
});
</script>
