<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for canned messages</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Canned Messages"
        for-id="enabled"
        description="Enable canned messages module."
      >
        <ToggleSwitch input-id="enabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Enable Rotary Encoder"
        for-id="rotary1Enabled"
        description="Enable the rotary encoder #1."
      >
        <ToggleSwitch input-id="rotary1Enabled" v-model="rotary1Enabled" />
      </FormRow>

      <FormRow
        label="Enable Up/Down Encoder"
        for-id="updown1Enabled"
        description="Enable the Up/Down/Select input device."
      >
        <ToggleSwitch input-id="updown1Enabled" v-model="updown1Enabled" />
      </FormRow>

      <FormRow
        label="Send Bell"
        for-id="sendBell"
        description="Send a bell character with the messages."
      >
        <ToggleSwitch input-id="sendBell" v-model="sendBell" />
      </FormRow>

      <FormRow
        label="Encode Pin A"
        for-id="inputbrokerPinAInput"
        description="GPIO pin for rotary encoder A port."
        :error="useGetError(v$.inputbrokerPinA)"
      >
        <InputGroup>
          <InputText
            id="inputbrokerPinAInput"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="inputbrokerPinAInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.inputbrokerPinA.$invalid"
            @blur="v$.inputbrokerPinA.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Encoder Pin B"
        for-id="inputbrokerPinBInput"
        description="GPIO pin for rotary encoder B port."
        :error="useGetError(v$.inputbrokerPinB)"
      >
        <InputGroup>
          <InputText
            id="inputbrokerPinBInput"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="inputbrokerPinBInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.inputbrokerPinB.$invalid"
            @blur="v$.inputbrokerPinB.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Encoder Pin Press"
        for-id="inputbrokerPinPressInput"
        description="GPIO pin for rotary encoder Press port."
        :error="useGetError(v$.inputbrokerPinPress)"
      >
        <InputGroup>
          <InputText
            id="inputbrokerPinPressInput"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="inputbrokerPinPressInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.inputbrokerPinPress.$invalid"
            @blur="v$.inputbrokerPinPress.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Clockwise Event"
        for-id="inputbrokerEventCw"
        description="Generate input event on clockwise of this kind."
        :error="useGetError(v$.inputbrokerEventCw)"
      >
        <Select
          aria-labelledby="inputbrokerEventCw"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="inputbrokerEventCw"
          :options="inputbrokerEventCwOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Event"
          :invalid="v$.inputbrokerEventCw.$invalid"
          @blur="v$.inputbrokerEventCw.$touch()"
        />
      </FormRow>

      <FormRow
        label="Counter-clockwise Event"
        for-id="inputbrokerEventCcw"
        description="Generate input event on counter-clockwise of this kind."
        :error="useGetError(v$.inputbrokerEventCcw)"
      >
        <Select
          aria-labelledby="inputbrokerEventCcw"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="inputbrokerEventCcw"
          :options="inputbrokerEventCcwOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Event"
          :invalid="v$.inputbrokerEventCcw.$invalid"
          @blur="v$.inputbrokerEventCcw.$touch()"
        />
      </FormRow>

      <FormRow
        label="Encoder Press Event"
        for-id="inputbrokerEventPress"
        description="Generate input event on Press of this kind."
        :error="useGetError(v$.inputbrokerEventCcw)"
      >
        <Select
          aria-labelledby="inputbrokerEventPress"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="inputbrokerEventPress"
          :options="inputbrokerEventPressOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select Event"
          :invalid="v$.inputbrokerEventPress.$invalid"
          @blur="v$.inputbrokerEventPress.$touch()"
        />
      </FormRow>

      <FormRow
        label="Allow Input Source"
        for-id="allowInputSource"
        description="Input event origin accepted by the canned message module. [rotEnc1, upDownEnc1, scanAndSelect, cardkb, serialkb, _any]"
        :error="useGetError(v$.allowInputSource)"
      >
        <InputText
          id="allowInputSource"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="text"
          minlength="0"
          maxlength="16"
          v-model="allowInputSource"
          :invalid="v$.allowInputSource.$invalid"
          @blur="v$.allowInputSource.$touch()"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import { computed } from 'vue';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const enabled = defineModel<boolean>('enabled');
const rotary1Enabled = defineModel<boolean>('rotary1Enabled');
const sendBell = defineModel<boolean>('sendBell');
const updown1Enabled = defineModel<boolean>('updown1Enabled');
const inputbrokerPinA = defineModel<number>('inputbrokerPinA');
const inputbrokerPinB = defineModel<number>('inputbrokerPinB');
const inputbrokerPinPress = defineModel<number>('inputbrokerPinPress');
const inputbrokerEventCw = defineModel<number>('inputbrokerEventCw');
const inputbrokerEventCcw = defineModel<number>('inputbrokerEventCcw');
const inputbrokerEventPress = defineModel<number>('inputbrokerEventPress');
const allowInputSource = defineModel<string>('allowInputSource');

const inputbrokerPinAInput = computed<string>({
  get() {
    return inputbrokerPinA.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    inputbrokerPinA.value = Number.isNaN(n) ? 0 : n;
  },
});

const inputbrokerPinBInput = computed<string>({
  get() {
    return inputbrokerPinB.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    inputbrokerPinB.value = Number.isNaN(n) ? 0 : n;
  },
});

const inputbrokerPinPressInput = computed<string>({
  get() {
    return inputbrokerPinPress.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    inputbrokerPinPress.value = Number.isNaN(n) ? 0 : n;
  },
});

const inputbrokerEventCwOptions = useEnumOptions(
  Protobuf.ModuleConfig.ModuleConfig_CannedMessageConfig_InputEventChar
);
const inputbrokerEventCcwOptions = useEnumOptions(
  Protobuf.ModuleConfig.ModuleConfig_CannedMessageConfig_InputEventChar
);
const inputbrokerEventPressOptions = useEnumOptions(
  Protobuf.ModuleConfig.ModuleConfig_CannedMessageConfig_InputEventChar
);
</script>
