<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Power Settings</h4>
      <p class="text-slate-400">Settings for the power module</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable power saving mode"
        for-id="isPowerSaving"
        description="Select if powered from a low-current source (i.e. solar), to minimize power consumption as much as possible."
      >
        <ToggleSwitch input-id="isPowerSaving" v-model="isPowerSaving" />
      </FormRow>

      <FormRow
        label="Shutdown on battery delay"
        for-id="onBatteryShutdownAfterSecs"
        description="Automatically shutdown node after this long when on battery, 0 for indefinite."
        :error="useGetError(v$.onBatteryShutdownAfterSecs)"
      >
        <InputGroup>
          <InputText
            id="onBatteryShutdownAfterSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="onBatteryShutdownAfterSecsInput"
            type="number"
            min="0"
            max="3600"
            step="1"
            :invalid="v$.onBatteryShutdownAfterSecs.$invalid"
            @blur="v$.onBatteryShutdownAfterSecs.$touch()"
            :disabled="!isPowerSaving"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="ADC multiplier override"
        for-id="adcMultiplierOverride"
        description="Used for tweaking battery voltage reading."
        :error="useGetError(v$.adcMultiplierOverride)"
      >
        <InputText
          id="adcMultiplierOverride"
          class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="adcMultiplierOverrideInput"
          type="number"
          min="-4"
          max="4"
          step="0.01"
          :invalid="v$.adcMultiplierOverride.$invalid"
          @blur="v$.adcMultiplierOverride.$touch()"
        />
      </FormRow>

      <FormRow
        label="Bluetooth listen time"
        for-id="waitBluetoothSecs"
        description="If the device does not receive a Bluetooth connection, the BLE radio will be disabled after this long."
        :error="useGetError(v$.waitBluetoothSecs)"
      >
        <InputGroup>
          <InputText
            id="waitBluetoothSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="waitBluetoothSecsInput"
            type="number"
            min="0"
            max="3600"
            step="1"
            :invalid="v$.waitBluetoothSecs.$invalid"
            @blur="v$.waitBluetoothSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="INA219 Address"
        for-id="deviceBatteryInaAddress"
        description="Address of the INA219 battery monitor."
        :error="useGetError(v$.deviceBatteryInaAddress)"
      >
        <InputGroup>
          <InputText
            id="deviceBatteryInaAddress"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="deviceBatteryInaAddressInput"
            type="number"
            min="0"
            max="255"
            step="1"
            :invalid="v$.deviceBatteryInaAddress.$invalid"
            @blur="v$.deviceBatteryInaAddress.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Super Deep Sleep Duration"
        for-id="sdsSecs"
        description="How long the device will stay in super deep sleep."
        :error="useGetError(v$.sdsSecs)"
      >
        <InputGroup>
          <InputText
            id="sdsSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="sdsSecsInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.sdsSecs.$invalid"
            @blur="v$.sdsSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Light Sleep Duration"
        for-id="lsSecs"
        description="How long the device will stay in light sleep."
        :error="useGetError(v$.lsSecs)"
      >
        <InputGroup>
          <InputText
            id="lsSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="lsSecsInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.lsSecs.$invalid"
            @blur="v$.lsSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Minimum Wake Time"
        for-id="minWakeSecs"
        description="Minimum amount of time the device will stay awake for after receiving a packet."
        :error="useGetError(v$.minWakeSecs)"
      >
        <InputGroup>
          <InputText
            id="minWakeSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="minWakeSecsInput"
            type="number"
            min="0"
            max="4294967295"
            step="1"
            :invalid="v$.minWakeSecs.$invalid"
            @blur="v$.minWakeSecs.$touch()"
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

const isPowerSaving = defineModel<boolean>('isPowerSaving');
const onBatteryShutdownAfterSecs = defineModel<number>('onBatteryShutdownAfterSecs');
const adcMultiplierOverride = defineModel<number>('adcMultiplierOverride');
const waitBluetoothSecs = defineModel<number>('waitBluetoothSecs');
const deviceBatteryInaAddress = defineModel<number>('deviceBatteryInaAddress');
const sdsSecs = defineModel<number>('sdsSecs');
const lsSecs = defineModel<number>('lsSecs');
const minWakeSecs = defineModel<number>('minWakeSecs');

const onBatteryShutdownAfterSecsInput = computed<string>({
  get() {
    return onBatteryShutdownAfterSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    onBatteryShutdownAfterSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const adcMultiplierOverrideInput = computed<string>({
  get() {
    return adcMultiplierOverride.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    adcMultiplierOverride.value = Number.isNaN(n) ? 0 : n;
  },
});

const waitBluetoothSecsInput = computed<string>({
  get() {
    return waitBluetoothSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    waitBluetoothSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const deviceBatteryInaAddressInput = computed<string>({
  get() {
    return deviceBatteryInaAddress.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    deviceBatteryInaAddress.value = Number.isNaN(n) ? 0 : n;
  },
});

const sdsSecsInput = computed<string>({
  get() {
    return sdsSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    sdsSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const lsSecsInput = computed<string>({
  get() {
    return lsSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    lsSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const minWakeSecsInput = computed<string>({
  get() {
    return minWakeSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    minWakeSecs.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
