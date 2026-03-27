<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for external notification</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable external notification"
        for-id="enableExternalNotification"
        description="Enable external notification module."
      >
        <ToggleSwitch input-id="enableExternalNotification" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Output active state"
        for-id="active"
        description="If this is true, the output pin will be pulled active high, false means active low."
      >
        <ToggleSwitch input-id="active" v-model="active" />
      </FormRow>

      <FormRow
        label="Alert Bell"
        for-id="alertBell"
        description="Alert when the bell character is received (output)."
      >
        <ToggleSwitch input-id="alertBell" v-model="alertBell" />
      </FormRow>

      <FormRow
        label="Alert Bell Buzzer"
        for-id="alertBellBuzzer"
        description="Alert when the bell character is received (output buzzer)."
      >
        <ToggleSwitch input-id="alertBellBuzzer" v-model="alertBellBuzzer" />
      </FormRow>

      <FormRow
        label="Alert Bell Vibration"
        for-id="alertBellVibra"
        description="Alert when the bell character is received (output vibration)."
      >
        <ToggleSwitch input-id="alertBellVibra" v-model="alertBellVibra" />
      </FormRow>

      <FormRow
        label="Alert Message"
        for-id="alertMessage"
        description="Alert when a text message arrives (output)."
      >
        <ToggleSwitch input-id="alertMessage" v-model="alertMessage" />
      </FormRow>

      <FormRow
        label="Alert Message Buzzer"
        for-id="alertMessageBuzzer"
        description="Alert when a text message arrives (output buzzer)."
      >
        <ToggleSwitch input-id="alertMessageBuzzer" v-model="alertMessageBuzzer" />
      </FormRow>

      <FormRow
        label="Alert Message Vibration"
        for-id="alertMessageVibra"
        description="Alert when a text message arrives (output vibration)."
      >
        <ToggleSwitch input-id="alertMessageVibra" v-model="alertMessageVibra" />
      </FormRow>

      <FormRow
        label="Use I2S Buzzer"
        for-id="useI2sAsBuzzer"
        description="Enables devices with native I2S audio output to use the ringtone over speaker."
      >
        <ToggleSwitch input-id="useI2sAsBuzzer" v-model="useI2sAsBuzzer" />
      </FormRow>

      <FormRow
        label="Use PWM"
        for-id="usePwm"
        description="PWM modulation instead of a simple on/off output. This will use only the buzzer GPIO setting."
      >
        <ToggleSwitch input-id="usePwm" v-model="usePwm" />
      </FormRow>

      <FormRow
        label="Output Interval"
        for-id="outputInterval"
        description="When using in On/Off mode, keep the output on for this many milliseconds."
        :error="useGetError(v$.outputMs)"
      >
        <InputGroup>
          <InputText
            id="outputInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="outputMsInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.outputMs.$invalid"
            @blur="v$.outputMs.$touch()"
          />
          <InputGroupAddon>Milliseconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Output Pin"
        for-id="outputPin"
        description="Define the output GPIO. In standalone devices this pin should drive the LED to match the UI."
        :error="useGetError(v$.output)"
      >
        <InputGroup>
          <InputText
            id="outputPin"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="outputInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.output.$invalid"
            @blur="v$.output.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Output Buzzer Pin"
        for-id="outputBuzzerPin"
        description="Define a output GPIO for an active buzzer."
        :error="useGetError(v$.outputBuzzer)"
      >
        <InputGroup>
          <InputText
            id="outputBuzzerPin"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="outputBuzzerInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.outputBuzzer.$invalid"
            @blur="v$.outputBuzzer.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Output Vibration Pin"
        for-id="outputVibraPin"
        description="Define a output GPIO for a vibration motor."
        :error="useGetError(v$.outputVibra)"
      >
        <InputGroup>
          <InputText
            id="outputVibraPin"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="outputVibraInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.outputVibra.$invalid"
            @blur="v$.outputVibra.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Nag Timeout"
        for-id="nagTimeout"
        description="The notification will be active for this time of seconds."
        :error="useGetError(v$.nagTimeout)"
      >
        <InputGroup>
          <InputText
            id="nagTimeout"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="nagTimeoutInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.nagTimeout.$invalid"
            @blur="v$.nagTimeout.$touch()"
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

const enabled = defineModel<boolean>('enabled');
const active = defineModel<boolean>('active');
const alertBell = defineModel<boolean>('alertBell');
const alertBellBuzzer = defineModel<boolean>('alertBellBuzzer');
const alertBellVibra = defineModel<boolean>('alertBellVibra');
const alertMessage = defineModel<boolean>('alertMessage');
const alertMessageBuzzer = defineModel<boolean>('alertMessageBuzzer');
const alertMessageVibra = defineModel<boolean>('alertMessageVibra');
const useI2sAsBuzzer = defineModel<boolean>('useI2sAsBuzzer');
const usePwm = defineModel<boolean>('usePwm');
const nagTimeout = defineModel<number>('nagTimeout');
const output = defineModel<number>('output');
const outputBuzzer = defineModel<number>('outputBuzzer');
const outputMs = defineModel<number>('outputMs');
const outputVibra = defineModel<number>('outputVibra');

const nagTimeoutInput = computed<string>({
  get() {
    return nagTimeout.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    nagTimeout.value = Number.isNaN(n) ? 300 : n;
  },
});

const outputInput = computed<string>({
  get() {
    return output.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    output.value = Number.isNaN(n) ? 0 : n;
  },
});

const outputBuzzerInput = computed<string>({
  get() {
    return outputBuzzer.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    outputBuzzer.value = Number.isNaN(n) ? 0 : n;
  },
});

const outputMsInput = computed<string>({
  get() {
    return outputMs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    outputMs.value = Number.isNaN(n) ? 0 : n;
  },
});

const outputVibraInput = computed<string>({
  get() {
    return outputVibra.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    outputVibra.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
