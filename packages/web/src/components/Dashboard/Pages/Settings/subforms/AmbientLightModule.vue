<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Ambient Light Module</h4>
      <p class="text-slate-400">Settings for the ambient light</p>
    </div>
    <FormGrid>
      <FormRow label="LED State" for-id="ledState" description="Sets LED to on or off.">
        <ToggleSwitch input-id="ledState" v-model="ledState" />
      </FormRow>

      <FormRow
        label="Current"
        for-id="current"
        description="Sets the current for the LED output. Default is 10."
        :error="useGetError(v$.current)"
      >
        <InputText
          id="current"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          max="255"
          v-model="currentInput"
          :invalid="v$.current.$invalid"
          @blur="v$.current.$touch()"
        />
      </FormRow>

      <FormRow label="LED Color" for-id="color" description="Set the RGB color of the LED.">
        <ColorPicker v-model="colorRGB" inputId="color" format="rgb" />
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

const current = defineModel<number>('current');
const red = defineModel<number>('red');
const green = defineModel<number>('green');
const blue = defineModel<number>('blue');
const ledState = defineModel<boolean>('ledState');

defineProps<{
  v$: Validation;
}>();

const currentInput = computed<string>({
  get() {
    return current.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return;
    current.value = Math.min(255, Math.max(0, n));
  },
});

type RgbColor = { r: number; b: number; g: number };
const colorRGB = computed<RgbColor>({
  get() {
    return {
      r: red.value ?? 128,
      g: green.value ?? 128,
      b: blue.value ?? 128,
    };
  },
  set(value) {
    if (!value) return;

    const clamp = (v: number) => (Number.isFinite(v) ? Math.min(255, Math.max(0, v)) : 128);

    red.value = clamp(value.r);
    green.value = clamp(value.g);
    blue.value = clamp(value.b);
  },
});
</script>
