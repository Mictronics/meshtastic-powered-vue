<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the range test</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Range Test"
        for-id="enableRangetest"
        description="Enable range test module."
      >
        <ToggleSwitch input-id="enableRangetest" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Message Interval"
        for-id="messageInterval"
        description="Delay time between test packets."
        :error="useGetError(v$.sender)"
      >
        <InputGroup>
          <InputText
            id="messageInterval"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="senderInput"
            type="number"
            min="30"
            max="28800000"
            step="1"
            :invalid="v$.sender.$invalid"
            @blur="v$.sender.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Save CSV"
        for-id="save"
        description="Save a RangeTest.csv file to storage. ESP32 only."
      >
        <ToggleSwitch input-id="save" v-model="save" />
      </FormRow>

      <FormRow
        label="Clear CSV"
        for-id="clearOnReboot"
        description="Clear RangeTest.csv file on reboot. ESP32 only."
      >
        <ToggleSwitch input-id="clearOnReboot" v-model="clearOnReboot" />
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

const sender = defineModel<number>('sender');
const enabled = defineModel<boolean>('enabled');
const save = defineModel<boolean>('save');
const clearOnReboot = defineModel<boolean>('clearOnReboot');

const senderInput = computed<string>({
  get() {
    return sender.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    sender.value = Number.isNaN(n) ? 30 : n;
  },
});
</script>
