<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the detection sensor</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Detection Sensor"
        for-id="detectionEnabled"
        description="Enable the detection sensor module."
      >
        <ToggleSwitch input-id="detectionEnabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Name"
        for-id="detectionName"
        description='Friendly name used to format the message sent to the mesh, e.g. "Motion" results in "Motion detected".'
        :error="useGetError(v$.name)"
      >
        <InputText
          id="detectionName"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="text"
          maxlength="20"
          v-model="name"
          :invalid="v$.name.$invalid"
          @blur="v$.name.$touch()"
        />
      </FormRow>

      <FormRow
        label="Monitor Pin"
        for-id="detectionMonitorPin"
        description="GPIO pin to monitor for state changes."
        :error="useGetError(v$.monitorPin)"
      >
        <InputText
          id="detectionMonitorPin"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          max="65535"
          v-model="monitorPinInput"
          :invalid="v$.monitorPin.$invalid"
          @blur="v$.monitorPin.$touch()"
        />
      </FormRow>

      <FormRow
        label="Trigger Type"
        for-id="detectionTriggerType"
        description="The type of pin state change that triggers an event."
        :error="useGetError(v$.detectionTriggerType)"
      >
        <Select
          aria-labelledby="detectionTriggerType"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="detectionTriggerType"
          :options="triggerTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select trigger type"
          :invalid="v$.detectionTriggerType.$invalid"
          @blur="v$.detectionTriggerType.$touch()"
        />
      </FormRow>

      <FormRow
        label="Use Pullup"
        for-id="detectionUsePullup"
        description="Use INPUT_PULLUP mode for the GPIO pin. Only applicable if the board uses pull-up resistors on the pin."
      >
        <ToggleSwitch input-id="detectionUsePullup" v-model="usePullup" />
      </FormRow>

      <FormRow
        label="Send Bell"
        for-id="detectionSendBell"
        description="Send an ASCII bell with the alert message. Useful for triggering an external notification on bell."
      >
        <ToggleSwitch input-id="detectionSendBell" v-model="sendBell" />
      </FormRow>

      <FormRow
        label="Minimum Broadcast Interval"
        for-id="detectionMinimumBroadcastSecs"
        description="How often, at minimum, a message is sent to the mesh when a trigger event is detected."
        :error="useGetError(v$.minimumBroadcastSecs)"
      >
        <InputGroup>
          <InputText
            id="detectionMinimumBroadcastSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            v-model="minimumBroadcastSecsInput"
            :invalid="v$.minimumBroadcastSecs.$invalid"
            @blur="v$.minimumBroadcastSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="State Broadcast Interval"
        for-id="detectionStateBroadcastSecs"
        description="How often to send a status message regardless of trigger events. 0 sends only trigger events."
        :error="useGetError(v$.stateBroadcastSecs)"
      >
        <InputGroup>
          <InputText
            id="detectionStateBroadcastSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            v-model="stateBroadcastSecsInput"
            :invalid="v$.stateBroadcastSecs.$invalid"
            @blur="v$.stateBroadcastSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
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
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const enabled = defineModel<boolean>('enabled');
const name = defineModel<string>('name');
const monitorPin = defineModel<number>('monitorPin');
const detectionTriggerType =
  defineModel<Protobuf.ModuleConfig.ModuleConfig_DetectionSensorConfig_TriggerType>(
    'detectionTriggerType'
  );
const usePullup = defineModel<boolean>('usePullup');
const sendBell = defineModel<boolean>('sendBell');
const minimumBroadcastSecs = defineModel<number>('minimumBroadcastSecs');
const stateBroadcastSecs = defineModel<number>('stateBroadcastSecs');

const triggerTypeOptions = useEnumOptions(
  Protobuf.ModuleConfig.ModuleConfig_DetectionSensorConfig_TriggerType
);

const monitorPinInput = computed<string>({
  get() {
    return monitorPin.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    monitorPin.value = Number.isNaN(n) ? 0 : n;
  },
});

const minimumBroadcastSecsInput = computed<string>({
  get() {
    return minimumBroadcastSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    minimumBroadcastSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const stateBroadcastSecsInput = computed<string>({
  get() {
    return stateBroadcastSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    stateBroadcastSecs.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
