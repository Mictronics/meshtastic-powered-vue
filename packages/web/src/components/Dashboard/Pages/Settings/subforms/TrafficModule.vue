<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Traffic Management Module</h4>
      <p class="text-slate-400">Settings for traffic management</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable"
        for-id="enableTrafficModule"
        description="enable for traffic management module."
      >
        <ToggleSwitch input-id="enableTrafficModule" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Drop Position"
        for-id="dropPosition"
        description="Enable position deduplication to drop redundant position broadcasts."
      >
        <ToggleSwitch input-id="dropPosition" v-model="positionDedupEnabled" />
      </FormRow>

      <FormRow
        label="Position Precision"
        for-id="precision"
        description="Precision for position deduplication."
      >
        <Select
          aria-labelledby="precision"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          :options="precisionOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select deduplication precision"
          v-model="positionPrecisionBits"
        />
      </FormRow>

      <FormRow
        label="Position Interval"
        for-id="positionInterval"
        description="Minimum interval in seconds between position updates from the same node."
        :error="useGetError(v$.positionMinIntervalSecs)"
      >
        <InputGroup>
          <InputText
            id="positionInterval"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="number"
            min="0"
            v-model="positionMinIntervalSecsInput"
            :invalid="v$.positionMinIntervalSecs.$invalid"
            @blur="v$.positionMinIntervalSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Node Info Response"
        for-id="nodeInfoDirect"
        description="Enable direct response to NodeInfo requests from local cache."
      >
        <ToggleSwitch input-id="nodeInfoDirect" v-model="nodeinfoDirectResponse" />
      </FormRow>

      <FormRow
        label="Node Info Distance"
        for-id="nodeInfoDistance"
        description="Minimum hop distance from requestor before responding to NodeInfo requests."
        :error="useGetError(v$.nodeinfoDirectResponseMaxHops)"
      >
        <InputGroup>
          <InputText
            id="nodeInfoDistance"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="number"
            min="0"
            max="7"
            v-model="nodeinfoDirectResponseMaxHopsInput"
            :invalid="v$.nodeinfoDirectResponseMaxHops.$invalid"
            @blur="v$.nodeinfoDirectResponseMaxHops.$touch()"
          />
          <InputGroupAddon>Hops</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Node Rate Limit"
        for-id="nodeRateLimitEnable"
        description="Enable per-node rate limiting to throttle chatty nodes."
      >
        <ToggleSwitch input-id="nodeRateLimitEnable" v-model="rateLimitEnabled" />
      </FormRow>

      <FormRow
        label="Rate Limit Window"
        for-id="rateLimitWindow"
        description="Time window in seconds for rate limiting calculations."
        :error="useGetError(v$.rateLimitWindowSecs)"
      >
        <InputGroup>
          <InputText
            id="rateLimitWindow"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="number"
            min="0"
            v-model="rateLimitWindowSecsInput"
            :invalid="v$.rateLimitWindowSecs.$invalid"
            @blur="v$.rateLimitWindowSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Rate Limit Packets"
        for-id="rateLimitPackets"
        description="Maximum packets allowed per node within the rate limit window."
        :error="useGetError(v$.rateLimitMaxPackets)"
      >
        <InputGroup>
          <InputText
            id="rateLimitPackets"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="number"
            min="0"
            v-model="rateLimitMaxPacketsInput"
            :invalid="v$.rateLimitMaxPackets.$invalid"
            @blur="v$.rateLimitMaxPackets.$touch()"
          />
          <InputGroupAddon>Packets</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Drop Unknown"
        for-id="dropUnknown"
        description="Enable dropping of unknown/non-decoding packets within rate limit."
      >
        <ToggleSwitch input-id="dropUnknown" v-model="dropUnknownEnabled" />
      </FormRow>

      <FormRow
        label="Unknown Packets Threshold"
        for-id="unknownPacketThreshold"
        description="Number of unknown packets before dropping from a node."
        :error="useGetError(v$.unknownPacketThreshold)"
      >
        <InputGroup>
          <InputText
            id="unknownPacketThreshold"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="number"
            min="0"
            v-model="unknownPacketThresholdInput"
            :invalid="v$.unknownPacketThreshold.$invalid"
            @blur="v$.unknownPacketThreshold.$touch()"
          />
          <InputGroupAddon>Packets</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Limit Telemetry"
        for-id="limitTelemetry"
        description="Set hop limit to 0 for relayed telemetry broadcasts (own packets unaffected)."
      >
        <ToggleSwitch input-id="limitTelemetry" v-model="exhaustHopTelemetry" />
      </FormRow>

      <FormRow
        label="Limit Position"
        for-id="limitPosition"
        description="Set hop limit to 0 for relayed position broadcasts (own packets unaffected)."
      >
        <ToggleSwitch input-id="limitPosition" v-model="exhaustHopPosition" />
      </FormRow>

      <FormRow
        label="Preserve Router"
        for-id="preserveRouter"
        description="Preserve hop limit for router-to-router traffic."
      >
        <ToggleSwitch input-id="preserveRouter" v-model="routerPreserveHops" />
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

const positionPrecisionBits = defineModel<number>('positionPrecisionBits');
const positionMinIntervalSecs = defineModel<number>('positionMinIntervalSecs');
const nodeinfoDirectResponseMaxHops = defineModel<number>('nodeinfoDirectResponseMaxHops');
const rateLimitWindowSecs = defineModel<number>('rateLimitWindowSecs');
const rateLimitMaxPackets = defineModel<number>('rateLimitMaxPackets');
const unknownPacketThreshold = defineModel<number>('unknownPacketThreshold');
const enabled = defineModel<boolean>('enabled');
const positionDedupEnabled = defineModel<boolean>('positionDedupEnabled');
const nodeinfoDirectResponse = defineModel<boolean>('nodeinfoDirectResponse');
const rateLimitEnabled = defineModel<boolean>('rateLimitEnabled');
const dropUnknownEnabled = defineModel<boolean>('dropUnknownEnabled');
const exhaustHopTelemetry = defineModel<boolean>('exhaustHopTelemetry');
const exhaustHopPosition = defineModel<boolean>('exhaustHopPosition');
const routerPreserveHops = defineModel<boolean>('routerPreserveHops');

defineProps<{
  v$: Validation;
}>();

type Precision = 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 32;
const precisionOptions: { label: string; value: Precision }[] = [
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

const positionMinIntervalSecsInput = computed<string>({
  get() {
    return positionMinIntervalSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    positionMinIntervalSecs.value = Number.isNaN(n) ? 3600 : n;
  },
});

const nodeinfoDirectResponseMaxHopsInput = computed<string>({
  get() {
    return nodeinfoDirectResponseMaxHops.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    nodeinfoDirectResponseMaxHops.value = Number.isNaN(n) ? 3 : Math.min(7, Math.max(0, n));
  },
});

const rateLimitWindowSecsInput = computed<string>({
  get() {
    return rateLimitWindowSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    rateLimitWindowSecs.value = Number.isNaN(n) ? 300 : n;
  },
});

const rateLimitMaxPacketsInput = computed<string>({
  get() {
    return rateLimitMaxPackets.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    rateLimitMaxPackets.value = Number.isNaN(n) ? 0 : n;
  },
});

const unknownPacketThresholdInput = computed<string>({
  get() {
    return unknownPacketThreshold.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    unknownPacketThreshold.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
