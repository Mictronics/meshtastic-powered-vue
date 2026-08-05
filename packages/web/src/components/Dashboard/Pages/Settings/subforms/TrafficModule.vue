<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for traffic management</p>
    </div>
    <FormGrid>
      <FormRow
        label="Position Interval"
        for-id="positionInterval"
        description="Enable position deduplication and set the minimum interval in seconds between position updates from the same node."
        :error="useGetError(v$.positionMinIntervalSecs)"
      >
        <div class="flex items-center gap-2">
          <ToggleSwitch input-id="positionInterval" v-model="positionMinIntervalSecsEnabled" />
          <InputGroup>
            <InputText
              id="positionInterval"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              min="0"
              :disabled="!positionMinIntervalSecsEnabled"
              v-model="positionMinIntervalSecsInput"
              :invalid="v$.positionMinIntervalSecs.$invalid"
              @blur="v$.positionMinIntervalSecs.$touch()"
            />
            <InputGroupAddon>Seconds</InputGroupAddon>
          </InputGroup>
        </div>
      </FormRow>

      <FormRow
        label="Node Info Response"
        for-id="nodeInfoDistance"
        description="Enable direct response to NodeInfo requests from local cache, up to this many hops away."
        :error="useGetError(v$.nodeinfoDirectResponseMaxHops)"
      >
        <div class="flex items-center gap-2">
          <ToggleSwitch
            input-id="nodeInfoDistance"
            v-model="nodeinfoDirectResponseMaxHopsEnabled"
          />
          <InputGroup>
            <InputText
              id="nodeInfoDistance"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              min="0"
              max="7"
              :disabled="!nodeinfoDirectResponseMaxHopsEnabled"
              v-model="nodeinfoDirectResponseMaxHopsInput"
              :invalid="v$.nodeinfoDirectResponseMaxHops.$invalid"
              @blur="v$.nodeinfoDirectResponseMaxHops.$touch()"
            />
            <InputGroupAddon>Hops</InputGroupAddon>
          </InputGroup>
        </div>
      </FormRow>

      <FormRow
        label="Rate Limit Window"
        for-id="rateLimitWindow"
        description="Enable per-node rate limiting and set the time window in seconds for rate limiting calculations."
        :error="useGetError(v$.rateLimitWindowSecs)"
      >
        <div class="flex items-center gap-2">
          <ToggleSwitch input-id="rateLimitWindow" v-model="rateLimitWindowSecsEnabled" />
          <InputGroup>
            <InputText
              id="rateLimitWindow"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              min="0"
              :disabled="!rateLimitWindowSecsEnabled"
              v-model="rateLimitWindowSecsInput"
              :invalid="v$.rateLimitWindowSecs.$invalid"
              @blur="v$.rateLimitWindowSecs.$touch()"
            />
            <InputGroupAddon>Seconds</InputGroupAddon>
          </InputGroup>
        </div>
      </FormRow>

      <FormRow
        label="Rate Limit Packets"
        for-id="rateLimitPackets"
        description="Maximum packets allowed per node within the rate limit window."
        :error="useGetError(v$.rateLimitMaxPackets)"
      >
        <div class="flex items-center gap-2">
          <ToggleSwitch input-id="rateLimitPackets" v-model="rateLimitMaxPacketsEnabled" />
          <InputGroup>
            <InputText
              id="rateLimitPackets"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              min="0"
              :disabled="!rateLimitMaxPacketsEnabled"
              v-model="rateLimitMaxPacketsInput"
              :invalid="v$.rateLimitMaxPackets.$invalid"
              @blur="v$.rateLimitMaxPackets.$touch()"
            />
            <InputGroupAddon>Packets</InputGroupAddon>
          </InputGroup>
        </div>
      </FormRow>

      <FormRow
        label="Unknown Packets Threshold"
        for-id="unknownPacketThreshold"
        description="Enable dropping of unknown/non-decoding packets after this many are seen from a node within the rate limit window."
        :error="useGetError(v$.unknownPacketThreshold)"
      >
        <div class="flex items-center gap-2">
          <ToggleSwitch input-id="unknownPacketThreshold" v-model="unknownPacketThresholdEnabled" />
          <InputGroup>
            <InputText
              id="unknownPacketThreshold"
              class="dark:bg-slate-800 dark:text-slate-400 w-full"
              size="small"
              type="number"
              min="0"
              :disabled="!unknownPacketThresholdEnabled"
              v-model="unknownPacketThresholdInput"
              :invalid="v$.unknownPacketThreshold.$invalid"
              @blur="v$.unknownPacketThreshold.$touch()"
            />
            <InputGroupAddon>Packets</InputGroupAddon>
          </InputGroup>
        </div>
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

const positionMinIntervalSecs = defineModel<number>('positionMinIntervalSecs');
const nodeinfoDirectResponseMaxHops = defineModel<number>('nodeinfoDirectResponseMaxHops');
const rateLimitWindowSecs = defineModel<number>('rateLimitWindowSecs');
const rateLimitMaxPackets = defineModel<number>('rateLimitMaxPackets');
const unknownPacketThreshold = defineModel<number>('unknownPacketThreshold');

defineProps<{
  v$: Validation;
}>();

// Fields were converted from dedicated bool toggles to a "non-zero implies
// enabled" convention: the toggle just writes a sane default / 0 into the
// companion numeric field.
const DEFAULTS = {
  positionMinIntervalSecs: 3600,
  nodeinfoDirectResponseMaxHops: 3,
  rateLimitWindowSecs: 300,
  rateLimitMaxPackets: 10,
  unknownPacketThreshold: 5,
} as const;

const positionMinIntervalSecsEnabled = computed<boolean>({
  get: () => (positionMinIntervalSecs.value ?? 0) !== 0,
  set: (enabled) => {
    positionMinIntervalSecs.value = enabled ? DEFAULTS.positionMinIntervalSecs : 0;
  },
});

const nodeinfoDirectResponseMaxHopsEnabled = computed<boolean>({
  get: () => (nodeinfoDirectResponseMaxHops.value ?? 0) !== 0,
  set: (enabled) => {
    nodeinfoDirectResponseMaxHops.value = enabled ? DEFAULTS.nodeinfoDirectResponseMaxHops : 0;
  },
});

const rateLimitWindowSecsEnabled = computed<boolean>({
  get: () => (rateLimitWindowSecs.value ?? 0) !== 0,
  set: (enabled) => {
    rateLimitWindowSecs.value = enabled ? DEFAULTS.rateLimitWindowSecs : 0;
  },
});

const rateLimitMaxPacketsEnabled = computed<boolean>({
  get: () => (rateLimitMaxPackets.value ?? 0) !== 0,
  set: (enabled) => {
    rateLimitMaxPackets.value = enabled ? DEFAULTS.rateLimitMaxPackets : 0;
  },
});

const unknownPacketThresholdEnabled = computed<boolean>({
  get: () => (unknownPacketThreshold.value ?? 0) !== 0,
  set: (enabled) => {
    unknownPacketThreshold.value = enabled ? DEFAULTS.unknownPacketThreshold : 0;
  },
});

const positionMinIntervalSecsInput = computed<string>({
  get() {
    return positionMinIntervalSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    positionMinIntervalSecs.value = Number.isNaN(n) ? DEFAULTS.positionMinIntervalSecs : n;
  },
});

const nodeinfoDirectResponseMaxHopsInput = computed<string>({
  get() {
    return nodeinfoDirectResponseMaxHops.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    nodeinfoDirectResponseMaxHops.value = Number.isNaN(n)
      ? DEFAULTS.nodeinfoDirectResponseMaxHops
      : Math.min(7, Math.max(0, n));
  },
});

const rateLimitWindowSecsInput = computed<string>({
  get() {
    return rateLimitWindowSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    rateLimitWindowSecs.value = Number.isNaN(n) ? DEFAULTS.rateLimitWindowSecs : n;
  },
});

const rateLimitMaxPacketsInput = computed<string>({
  get() {
    return rateLimitMaxPackets.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    rateLimitMaxPackets.value = Number.isNaN(n) ? DEFAULTS.rateLimitMaxPackets : n;
  },
});

const unknownPacketThresholdInput = computed<string>({
  get() {
    return unknownPacketThreshold.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    unknownPacketThreshold.value = Number.isNaN(n) ? DEFAULTS.unknownPacketThreshold : n;
  },
});
</script>
