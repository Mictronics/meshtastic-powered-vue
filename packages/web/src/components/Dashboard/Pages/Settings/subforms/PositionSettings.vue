<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Position Settings</h4>
      <p class="text-slate-400">Settings for the position module</p>
    </div>
    <FormGrid>
      <FormRow
        label="GPS Mode"
        for-id="mode"
        description="Configure whether device GPS is enabled, disabled, or not present."
        :error="useGetError(v$.gpsMode)"
      >
        <Select
          aria-labelledby="mode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="gpsMode"
          :options="gpsModeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select GPS mode"
          :invalid="v$.gpsMode.$invalid"
          @blur="v$.gpsMode.$touch()"
        />
      </FormRow>

      <FormRow
        label="GPS Update Interval"
        for-id="gpsUpdateInterval"
        description="How often a GPS fix should be acquired."
        :error="useGetError(v$.gpsUpdateInterval)"
      >
        <InputGroup>
          <InputText
            id="gpsUpdateInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="gpsUpdateIntervalInput"
            type="number"
            min="0"
            max="604800"
            step="1"
            :invalid="v$.gpsUpdateInterval.$invalid"
            @blur="v$.gpsUpdateInterval.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Broadcast Interval"
        for-id="positionBroadcastSecs"
        description="How often your position is sent out over the mesh."
        :error="useGetError(v$.positionBroadcastSecs)"
      >
        <InputGroup>
          <InputText
            id="positionBroadcastSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="positionBroadcastSecsInput"
            type="number"
            min="0"
            max="604800"
            step="1"
            :invalid="v$.positionBroadcastSecs.$invalid"
            @blur="v$.positionBroadcastSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Enable Smart Position"
        for-id="positionBroadcastSmartEnabled"
        description="Only send position when there has been a meaningful change in location."
      >
        <ToggleSwitch
          input-id="positionBroadcastSmartEnabled"
          v-model="positionBroadcastSmartEnabled"
        />
      </FormRow>

      <FormRow
        label="Smart Position Minimum Interval"
        for-id="broadcastSmartMinimumIntervalSecs"
        description="Minimum interval (in seconds) that must pass before a smart position update is sent."
        :error="useGetError(v$.positionBroadcastSecs)"
      >
        <InputGroup>
          <InputText
            id="broadcastSmartMinimumIntervalSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="broadcastSmartMinimumIntervalSecsInput"
            type="number"
            min="0"
            max="604800"
            step="1"
            :invalid="v$.broadcastSmartMinimumIntervalSecs.$invalid"
            @blur="v$.broadcastSmartMinimumIntervalSecs.$touch()"
            :disabled="!positionBroadcastSmartEnabled"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Smart Position Minimum Distance"
        for-id="broadcastSmartMinimumDistance"
        description="Minimum distance (in meters) that must be traveled before a position update is sent."
        :error="useGetError(v$.broadcastSmartMinimumDistance)"
      >
        <InputGroup>
          <InputText
            id="broadcastSmartMinimumDistance"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="broadcastSmartMinimumDistanceInput"
            type="number"
            min="50"
            max="100000"
            step="1"
            :invalid="v$.broadcastSmartMinimumDistance.$invalid"
            @blur="v$.broadcastSmartMinimumDistance.$touch()"
            :disabled="!positionBroadcastSmartEnabled"
          />
          <InputGroupAddon>Meter</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Enable fixed position"
        for-id="fixPositionEnabled"
        description="Don't report GPS position, but a manually specified one."
      >
        <ToggleSwitch input-id="fixPositionEnabled" v-model="fixedPosition" />
      </FormRow>

      <FormRow
        label="Fixed Position"
        for-id="fixedPosition"
        description="Enter the nodes fixed position in one of the provided coordinates format."
      >
        <FormGeoCoordinate
          v-model:latitude="latitude"
          v-model:longitude="longitude"
          :disabled="!fixedPosition"
        />
      </FormRow>

      <FormRow
        label="Altitude"
        for-id="Altitude"
        description="Optional altitude in Meters above sea level (e.g., 100). Leave blank if unknown or add extra height for antennas/masts."
      >
        <InputGroup>
          <InputText
            id="altitude"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="altitudeInput"
            type="number"
            min="-500"
            max="10000"
            :disabled="!fixedPosition"
          />
          <InputGroupAddon>Meter</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Position Flags"
        for-id="txGpio"
        description="Optional fields to include when assembling position messages. The more fields are selected, the larger the message will be leading to longer airtime usage and a higher risk of packet loss."
        :error="useGetError(v$.positionFlags)"
      >
        <FormPositionFlags v-model:position-flags="positionFlags" />
      </FormRow>

      <FormRow
        label="Transmit Pin"
        for-id="txGpio"
        description="GPS module TX pin override."
        :error="useGetError(v$.txGpio)"
      >
        <InputGroup>
          <InputText
            id="txGpio"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="txGpioInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.txGpio.$invalid"
            @blur="v$.txGpio.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Receive Pin"
        for-id="rxGpio"
        description="GPS module RX pin override."
        :error="useGetError(v$.rxGpio)"
      >
        <InputGroup>
          <InputText
            id="rxGpio"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="rxGpioInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.rxGpio.$invalid"
            @blur="v$.rxGpio.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Enable pin"
        for-id="gpsEnGpio"
        description="GPS module enable pin override."
        :error="useGetError(v$.gpsEnGpio)"
      >
        <InputGroup>
          <InputText
            id="gpsEnGpio"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="gpsEnGpioInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.gpsEnGpio.$invalid"
            @blur="v$.gpsEnGpio.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Protobuf } from '@meshtastic/core';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import FormGeoCoordinate from '../components/FormGeoCoordinate.vue';
import FormPositionFlags from '../components/FormPositionFlags.vue';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const broadcastSmartMinimumDistance = defineModel<number>('broadcastSmartMinimumDistance');
const broadcastSmartMinimumIntervalSecs = defineModel<number>('broadcastSmartMinimumIntervalSecs');
const fixedPosition = defineModel<boolean>('fixedPosition');
const gpsMode = defineModel<Protobuf.Config.Config_PositionConfig_GpsMode>('gpsMode');
const gpsUpdateInterval = defineModel<number>('gpsUpdateInterval');
const positionBroadcastSecs = defineModel<number>('positionBroadcastSecs');
const positionBroadcastSmartEnabled = defineModel<boolean>('positionBroadcastSmartEnabled');
const positionFlags = defineModel<number>('positionFlags');
const rxGpio = defineModel<number>('rxGpio');
const txGpio = defineModel<number>('txGpio');
const gpsEnGpio = defineModel<number>('gpsEnGpio');

const latitude = defineModel<number>('latitude');
const longitude = defineModel<number>('longitude');
const altitude = defineModel<number>('altitude');

const gpsModeOptions = useEnumOptions(Protobuf.Config.Config_PositionConfig_GpsMode);

const broadcastSmartMinimumDistanceInput = computed<string>({
  get() {
    return broadcastSmartMinimumDistance.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    broadcastSmartMinimumDistance.value = Number.isNaN(n) ? 0 : n;
  },
});

const broadcastSmartMinimumIntervalSecsInput = computed<string>({
  get() {
    return broadcastSmartMinimumIntervalSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    broadcastSmartMinimumIntervalSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const gpsUpdateIntervalInput = computed<string>({
  get() {
    return gpsUpdateInterval.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    gpsUpdateInterval.value = Number.isNaN(n) ? 0 : n;
  },
});

const positionBroadcastSecsInput = computed<string>({
  get() {
    return positionBroadcastSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    positionBroadcastSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const rxGpioInput = computed<string>({
  get() {
    return rxGpio.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    rxGpio.value = Number.isNaN(n) ? 0 : n;
  },
});

const txGpioInput = computed<string>({
  get() {
    return txGpio.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    txGpio.value = Number.isNaN(n) ? 0 : n;
  },
});

const gpsEnGpioInput = computed<string>({
  get() {
    return gpsEnGpio.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    gpsEnGpio.value = Number.isNaN(n) ? 0 : n;
  },
});

const altitudeInput = computed<string>({
  get() {
    return altitude.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    altitude.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
