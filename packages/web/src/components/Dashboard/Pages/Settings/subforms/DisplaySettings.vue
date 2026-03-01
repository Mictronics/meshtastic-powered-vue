<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the device display</p>
    </div>
    <FormGrid>
      <FormRow
        label="Display Units"
        for-id="units"
        description="Display metric or imperial units on screen."
        :error="useGetError(v$.units)"
      >
        <Select
          aria-labelledby="units"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="units"
          :options="unitsOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select GPS mode"
          :invalid="v$.units.$invalid"
          @blur="v$.units.$touch()"
        />
      </FormRow>

      <FormRow
        label="OLED Type"
        for-id="oled"
        description="Type of OLED screen attached to the device."
        :error="useGetError(v$.oled)"
      >
        <Select
          aria-labelledby="oled"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="oled"
          :options="oledOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select GPS mode"
          :invalid="v$.oled.$invalid"
          @blur="v$.oled.$touch()"
        />
      </FormRow>

      <FormRow
        label="Display Mode"
        for-id="displaymode"
        description="Screen layout variant."
        :error="useGetError(v$.displaymode)"
      >
        <Select
          aria-labelledby="displaymode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="displaymode"
          :options="displaymodeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select GPS mode"
          :invalid="v$.displaymode.$invalid"
          @blur="v$.displaymode.$touch()"
        />
      </FormRow>

      <FormRow
        label="Compass Orientation"
        for-id="compassOrientation"
        description="Compass orientation pointing up."
        :error="useGetError(v$.compassOrientation)"
      >
        <Select
          aria-labelledby="compassOrientation"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="compassOrientation"
          :options="compassOrientationOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select GPS mode"
          :invalid="v$.compassOrientation.$invalid"
          @blur="v$.compassOrientation.$touch()"
        />
      </FormRow>

      <FormRow
        label="Screen Timeout"
        for-id="screenOnSecs"
        description="Turn off the display after this long."
        :error="useGetError(v$.screenOnSecs)"
      >
        <InputGroup>
          <InputText
            id="screenOnSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="screenOnSecsInput"
            type="number"
            min="0"
            max="604800"
            step="1"
            :invalid="v$.screenOnSecs.$invalid"
            @blur="v$.screenOnSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Carousel Delay"
        for-id="autoScreenCarouselSecs"
        description="How fast to cycle through windows."
        :error="useGetError(v$.autoScreenCarouselSecs)"
      >
        <InputGroup>
          <InputText
            id="autoScreenCarouselSecs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="autoScreenCarouselSecsInput"
            type="number"
            min="0"
            max="604800"
            step="1"
            :invalid="v$.autoScreenCarouselSecs.$invalid"
            @blur="v$.autoScreenCarouselSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Compass North Up"
        for-id="compassNorthTop"
        description="Fix compass north up."
      >
        <ToggleSwitch input-id="compassNorthTop" v-model="compassNorthTop" />
      </FormRow>

      <FormRow label="12-Hour Clock" for-id="use12hClock" description="Use 12-hour clock format.">
        <ToggleSwitch input-id="use12hClock" v-model="use12hClock" />
      </FormRow>

      <FormRow label="Flip Screen" for-id="flipScreen" description="Flip display 180 degrees.">
        <ToggleSwitch input-id="flipScreen" v-model="flipScreen" />
      </FormRow>

      <FormRow label="Bold Heading" for-id="headingBold" description="Bolden the heading text.">
        <ToggleSwitch input-id="headingBold" v-model="headingBold" />
      </FormRow>

      <FormRow
        label="Wake on Tap or Motion"
        for-id="wakeOnTapOrMotion"
        description="Wake the device on tap or motion."
      >
        <ToggleSwitch input-id="wakeOnTapOrMotion" v-model="wakeOnTapOrMotion" />
      </FormRow>

      <FormRow
        label="Long Node Name"
        for-id="useLongNodeName"
        description="The device will use the long name on various display screens instead of short name."
      >
        <ToggleSwitch input-id="useLongNodeName" v-model="useLongNodeName" />
      </FormRow>

      <FormRow
        label="Message Bubbles"
        for-id="enableMessageBubbles"
        description="The device will show message bubbles on screen."
      >
        <ToggleSwitch input-id="enableMessageBubbles" v-model="enableMessageBubbles" />
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

const units = defineModel<number>('units');
const oled = defineModel<number>('oled');
const displaymode = defineModel<number>('displaymode');
const compassOrientation = defineModel<number>('compassOrientation');
const screenOnSecs = defineModel<number>('screenOnSecs');
const autoScreenCarouselSecs = defineModel<number>('autoScreenCarouselSecs');
const compassNorthTop = defineModel<boolean>('compassNorthTop');
const use12hClock = defineModel<boolean>('use12hClock');
const flipScreen = defineModel<boolean>('flipScreen');
const headingBold = defineModel<boolean>('headingBold');
const wakeOnTapOrMotion = defineModel<boolean>('wakeOnTapOrMotion');
const useLongNodeName = defineModel<boolean>('useLongNodeName');
const enableMessageBubbles = defineModel<boolean>('enableMessageBubbles');

const unitsOptions = useEnumOptions(Protobuf.Config.Config_DisplayConfig_DisplayUnits);
const oledOptions = useEnumOptions(Protobuf.Config.Config_DisplayConfig_OledType);
const displaymodeOptions = useEnumOptions(Protobuf.Config.Config_DisplayConfig_DisplayMode);
const compassOrientationOptions = useEnumOptions(
  Protobuf.Config.Config_DisplayConfig_CompassOrientation
);

const screenOnSecsInput = computed<string>({
  get() {
    return screenOnSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    screenOnSecs.value = Number.isNaN(n) ? 0 : n;
  },
});

const autoScreenCarouselSecsInput = computed<string>({
  get() {
    return autoScreenCarouselSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    autoScreenCarouselSecs.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
