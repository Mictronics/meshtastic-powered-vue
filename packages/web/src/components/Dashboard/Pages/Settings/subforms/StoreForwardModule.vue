<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the store and forward server</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Store&Forward"
        for-id="enabled"
        description="Enable store and forward module."
      >
        <ToggleSwitch input-id="enabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Enable Server"
        for-id="isServer"
        description="Set to true to let this node act as a server that stores received messages and resends them upon request."
      >
        <ToggleSwitch input-id="isServer" v-model="isServer" />
      </FormRow>

      <FormRow
        label="Enable Heartbeat"
        for-id="heartbeat"
        description="Enable send heartbeat advertising."
      >
        <ToggleSwitch input-id="heartbeat" v-model="heartbeat" />
      </FormRow>

      <FormRow
        label="History Maximum Records"
        for-id="historyReturnMaxInput"
        description="Maximum number of records to return."
        :error="useGetError(v$.historyReturnMax)"
      >
        <InputText
          id="historyReturnMaxInput"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="historyReturnMaxInput"
          type="number"
          min="0"
          max="4294967295"
          step="1"
          :invalid="v$.historyReturnMax.$invalid"
          @blur="v$.historyReturnMax.$touch()"
        />
      </FormRow>

      <FormRow
        label="History Return Window"
        for-id="historyReturnWindowInput"
        description="Maximum time window for records to return."
        :error="useGetError(v$.historyReturnWindow)"
      >
        <InputGroup>
          <InputText
            id="historyReturnWindowInput"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="historyReturnWindowInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.historyReturnWindow.$invalid"
            @blur="v$.historyReturnWindow.$touch()"
          />
          <InputGroupAddon>Minutes</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Store Maximum Records"
        for-id="recordsInput"
        description="Maximum number of records to store in memory."
        :error="useGetError(v$.records)"
      >
          <InputText
            id="recordsInput"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="recordsInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.records.$invalid"
            @blur="v$.records.$touch()"
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
  v$: Validation;
}>();

const enabled = defineModel<boolean>('enabled');
const heartbeat = defineModel<boolean>('heartbeat');
const isServer = defineModel<boolean>('isServer');
const historyReturnMax = defineModel<number>('historyReturnMax');
const historyReturnWindow = defineModel<number>('historyReturnWindow');
const records = defineModel<number>('records');

const historyReturnMaxInput = computed<string>({
  get() {
    return historyReturnMax.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    historyReturnMax.value = Number.isNaN(n) ? 0 : n;
  },
});

const historyReturnWindowInput = computed<string>({
  get() {
    return historyReturnWindow.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    historyReturnWindow.value = Number.isNaN(n) ? 0 : n;
  },
});

const recordsInput = computed<string>({
  get() {
    return records.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    records.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
