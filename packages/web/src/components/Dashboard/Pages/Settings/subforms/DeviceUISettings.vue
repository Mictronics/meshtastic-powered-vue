<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the on-device screen UI</p>
    </div>
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Display</h4>
      <p class="text-slate-400">Settings for the TFT/touchscreen display</p>
    </div>
    <FormGrid>
      <FormRow
        label="Brightness"
        for-id="screenBrightness"
        description="TFT display brightness, 0-255."
        :error="useGetError(v$.screenBrightness)"
      >
        <InputText
          id="screenBrightness"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          max="255"
          v-model="screenBrightnessInput"
          :invalid="v$.screenBrightness.$invalid"
          @blur="v$.screenBrightness.$touch()"
        />
      </FormRow>

      <FormRow
        label="Screen Timeout"
        for-id="screenTimeout"
        description="Turn off the screen after this long, 0-900 seconds."
        :error="useGetError(v$.screenTimeout)"
      >
        <InputGroup>
          <InputText
            id="screenTimeout"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            max="900"
            v-model="screenTimeoutInput"
            :invalid="v$.screenTimeout.$invalid"
            @blur="v$.screenTimeout.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow label="Theme" for-id="theme" description="Color theme for the screen UI.">
        <Select
          aria-labelledby="theme"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="theme"
          :options="themeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select theme"
        />
      </FormRow>

      <FormRow label="Accent Color" for-id="screenRgbColor" description="RGB accent color for BaseUI.">
        <ColorPicker v-model="screenRgbColorInput" inputId="screenRgbColor" format="hex" />
      </FormRow>

      <FormRow
        label="Analog Clockface"
        for-id="isClockfaceAnalog"
        description="Use an analog clockface instead of digital."
      >
        <ToggleSwitch input-id="isClockfaceAnalog" v-model="isClockfaceAnalog" />
      </FormRow>
    </FormGrid>

    <div class="pt-2">
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Lock</h4>
      <p class="text-slate-400">Settings for screen and settings lock</p>
    </div>
    <FormGrid>
      <FormRow label="Screen Lock" for-id="screenLock" description="Require the PIN to unlock the screen.">
        <ToggleSwitch input-id="screenLock" v-model="screenLock" />
      </FormRow>

      <FormRow
        label="Settings Lock"
        for-id="settingsLock"
        description="Require the PIN to change settings on the device."
      >
        <ToggleSwitch input-id="settingsLock" v-model="settingsLock" />
      </FormRow>

      <FormRow label="PIN Code" for-id="pinCode" description="PIN used for the screen and settings lock.">
        <InputText
          id="pinCode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          v-model="pinCodeInput"
        />
      </FormRow>
    </FormGrid>

    <div class="pt-2">
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Alerts</h4>
      <p class="text-slate-400">Settings for audible messages, banners and ring tone</p>
    </div>
    <FormGrid>
      <FormRow label="Alert Enabled" for-id="alertEnabled" description="Play an audible alert for messages.">
        <ToggleSwitch input-id="alertEnabled" v-model="alertEnabled" />
      </FormRow>

      <FormRow label="Banner Enabled" for-id="bannerEnabled" description="Show a banner for incoming messages.">
        <ToggleSwitch input-id="bannerEnabled" v-model="bannerEnabled" />
      </FormRow>

      <FormRow label="Ring Tone" for-id="ringToneId" description="ID of the ring tone to play for alerts.">
        <InputText
          id="ringToneId"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          v-model="ringToneIdInput"
        />
      </FormRow>
    </FormGrid>

    <div class="pt-2">
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Localization</h4>
      <p class="text-slate-400">Settings for language and coordinate display</p>
    </div>
    <FormGrid>
      <FormRow label="Language" for-id="language" description="Language used by the screen UI.">
        <Select
          aria-labelledby="language"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="language"
          :options="languageOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select language"
        />
      </FormRow>

      <FormRow
        label="GPS Format"
        for-id="gpsFormat"
        description="How GPS coordinates are formatted on screen."
      >
        <Select
          aria-labelledby="gpsFormat"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="gpsFormat"
          :options="gpsFormatOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select GPS format"
        />
      </FormRow>
    </FormGrid>

    <div class="pt-2">
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Compass</h4>
      <p class="text-slate-400">Settings for the compass display</p>
    </div>
    <FormGrid>
      <FormRow label="Compass Mode" for-id="compassMode" description="How the compass ring and heading behave.">
        <Select
          aria-labelledby="compassMode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="compassMode"
          :options="compassModeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select compass mode"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Validation } from '@vuelidate/core';
import {
  Theme,
  Language,
  CompassMode,
  DeviceUIConfig_GpsCoordinateFormat,
} from '@meshtastic/protobufs/device_ui_pb.ts';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const screenBrightness = defineModel<number>('screenBrightness');
const screenTimeout = defineModel<number>('screenTimeout');
const screenLock = defineModel<boolean>('screenLock');
const settingsLock = defineModel<boolean>('settingsLock');
const pinCode = defineModel<number>('pinCode');
const theme = defineModel<Theme>('theme');
const alertEnabled = defineModel<boolean>('alertEnabled');
const bannerEnabled = defineModel<boolean>('bannerEnabled');
const ringToneId = defineModel<number>('ringToneId');
const language = defineModel<Language>('language');
const compassMode = defineModel<CompassMode>('compassMode');
const screenRgbColor = defineModel<number>('screenRgbColor');
const isClockfaceAnalog = defineModel<boolean>('isClockfaceAnalog');
const gpsFormat = defineModel<DeviceUIConfig_GpsCoordinateFormat>('gpsFormat');

const themeOptions = useEnumOptions(Theme);
const languageOptions = useEnumOptions(Language);
const compassModeOptions = useEnumOptions(CompassMode);
const gpsFormatOptions = useEnumOptions(DeviceUIConfig_GpsCoordinateFormat);

const screenBrightnessInput = computed<string>({
  get() {
    return screenBrightness.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    screenBrightness.value = Number.isNaN(n) ? 0 : n;
  },
});

const screenTimeoutInput = computed<string>({
  get() {
    return screenTimeout.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    screenTimeout.value = Number.isNaN(n) ? 0 : n;
  },
});

const pinCodeInput = computed<string>({
  get() {
    return pinCode.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    pinCode.value = Number.isNaN(n) ? 0 : n;
  },
});

const ringToneIdInput = computed<string>({
  get() {
    return ringToneId.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    ringToneId.value = Number.isNaN(n) ? 0 : n;
  },
});

// screenRgbColor is packed 0xRRGGBB; ColorPicker's hex format takes/returns an unprefixed hex string.
const screenRgbColorInput = computed<string>({
  get() {
    return (screenRgbColor.value ?? 0).toString(16).padStart(6, '0');
  },
  set(value) {
    const n = Number.parseInt(value, 16);
    screenRgbColor.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
