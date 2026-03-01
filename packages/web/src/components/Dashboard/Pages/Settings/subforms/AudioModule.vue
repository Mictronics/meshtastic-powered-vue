<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for audio support</p>
    </div>
    <FormGrid>
      <FormRow
        label="Codec 2 Enabled"
        for-id="codec2Enabled"
        description="Enable Codec 2 audio encoding."
      >
        <ToggleSwitch input-id="codec2Enabled" v-model="codec2Enabled" />
      </FormRow>

      <FormRow
        label="Bitrate"
        for-id="bitrate"
        description="Bitrate to use for audio encoding."
        :error="useGetError(v$.bitrate)"
      >
        <Select
          aria-labelledby="bitrate"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="bitrate"
          :options="bitrateOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select buzzer mode"
          :invalid="v$.bitrate.$invalid"
          @blur="v$.bitrate.$touch()"
        />
      </FormRow>

      <FormRow
        label="PTT Pin"
        for-id="pttPin"
        description="GPIO pin to use for PTT."
        :error="useGetError(v$.pttPin)"
      >
        <InputGroup>
          <InputText
            id="pttPin"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="pttPinInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.pttPin.$invalid"
            @blur="v$.pttPin.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="i2S WS"
        for-id="i2sWs"
        description="GPIO pin to use for i2S WS."
        :error="useGetError(v$.i2sWs)"
      >
        <InputGroup>
          <InputText
            id="i2sWs"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="i2sWsInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.i2sWs.$invalid"
            @blur="v$.i2sWs.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="i2S SD"
        for-id="i2sSd"
        description="GPIO pin to use for i2S SD."
        :error="useGetError(v$.i2sSd)"
      >
        <InputGroup>
          <InputText
            id="i2sSd"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="i2sSdInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.i2sSd.$invalid"
            @blur="v$.i2sSd.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="i2S DIN"
        for-id="i2sDin"
        description="GPIO pin to use for i2S DIN."
        :error="useGetError(v$.i2sDin)"
      >
        <InputGroup>
          <InputText
            id="i2sDin"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="i2sDinInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.i2sDin.$invalid"
            @blur="v$.i2sDin.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="i2S SCK"
        for-id="i2sSck"
        description="GPIO pin to use for i2S SCK."
        :error="useGetError(v$.i2sSck)"
      >
        <InputGroup>
          <InputText
            id="i2sSck"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="i2sSckInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.i2sSck.$invalid"
            @blur="v$.i2sSck.$touch()"
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
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const bitrate = defineModel<Protobuf.ModuleConfig.ModuleConfig_AudioConfig_Audio_Baud>('bitrate');
const codec2Enabled = defineModel<boolean>('codec2Enabled');
const pttPin = defineModel<number>('pttPin');
const i2sWs = defineModel<number>('i2sWs');
const i2sSd = defineModel<number>('i2sSd');
const i2sDin = defineModel<number>('i2sDin');
const i2sSck = defineModel<number>('i2sSck');

const bitrateOptions = useEnumOptions(Protobuf.ModuleConfig.ModuleConfig_AudioConfig_Audio_Baud);

const pttPinInput = computed<string>({
  get() {
    return pttPin.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    pttPin.value = Number.isNaN(n) ? 0 : n;
  },
});

const i2sWsInput = computed<string>({
  get() {
    return i2sWs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    i2sWs.value = Number.isNaN(n) ? 0 : n;
  },
});

const i2sSdInput = computed<string>({
  get() {
    return i2sSd.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    i2sSd.value = Number.isNaN(n) ? 0 : n;
  },
});

const i2sDinInput = computed<string>({
  get() {
    return i2sDin.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    i2sDin.value = Number.isNaN(n) ? 0 : n;
  },
});

const i2sSckInput = computed<string>({
  get() {
    return i2sSck.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    i2sSck.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
