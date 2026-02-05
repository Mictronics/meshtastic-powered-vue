<template>
  <FormGrid>
    <FormRow
      label="Role"
      for-id="region"
      description="Device telemetry is sent over Primary. Only one Primary allowed."
    >
      <Select
        aria-labelledby="region"
        class="dark:bg-slate-800 dark:text-slate-400 w-full"
        size="small"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select channel role"
        v-model="formValues.role"
      />
    </FormRow>

    <FormRow
      label="Name"
      for-id="name"
      description="A unique name for the channel, leave blank for default"
    >
      <InputText
        id="name"
        class="dark:bg-slate-800 dark:text-slate-400 w-full"
        size="small"
        type="text"
        minlength="0"
        maxlength="12"
        v-model="formValues.settings.name"
      />
    </FormRow>

    <FormRow
      label="Pre-Shared Key"
      for-id="key"
      description="Supported PSK lengths: 256-bit, 128-bit, 8-bit, Empty (0-bit)"
    >
      <FormKeyGenerator
        :initial-key="preSharedKey"
        :initial-key-size="pskSize"
        :error="useGetError(v$.preSharedKey)"
        @update-key="onKeyUpdate"
      />
    </FormRow>

    <FormRow
      label="Position"
      for-id="position"
      description="The precision of the position to share with the channel. Can be disabled."
    >
      <Select
        aria-labelledby="position"
        class="dark:bg-slate-800 dark:text-slate-400 w-full"
        size="small"
        :options="positionOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select position precision"
        v-model="formValues.settings.moduleSettings.positionPrecision"
      />
    </FormRow>

    <FormRow
      label="Allow MQTT uplink"
      for-id="allowMqttUplink"
      description="Allow sending messages from the local mesh via MQTT."
    >
      <ToggleSwitch input-id="allowMqttUplink" v-model="formValues.settings.uplinkEnabled" />
    </FormRow>

    <FormRow
      label="Allow MQTT downlink"
      for-id="allowMqttDownlink"
      description="Allow receiving messages from MQTT into the local mesh."
    >
      <ToggleSwitch input-id="allowMqttDownlink" v-model="formValues.settings.downlinkEnabled" />
    </FormRow>

    <FormRow
      label="Mute notifications"
      for-id="muteNotes"
      description="Mute notifications or alerts from this channel."
    >
      <ToggleSwitch input-id="muteNotes" v-model="formValues.settings.mute" />
    </FormRow>

    <FormRow
      label="Mute channel"
      for-id="muteChannel"
      description="Mute the channel on phone or clients. Useful for noisy public channels you don't necessarily want to disable."
    >
      <ToggleSwitch
        input-id="muteChannel"
        v-model="formValues.settings.moduleSettings.isClientMuted"
      />
    </FormRow>
  </FormGrid>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Protobuf } from '@meshtastic/core';
import { fromByteArray, toByteArray } from 'base64-js';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import FormKeyGenerator from './FormKeyGenerator.vue';
import type { PreSharedKeyUpdate, Key } from './FormKeyGenerator.vue';
import useVuelidate from '@vuelidate/core';
import { helpers } from '@vuelidate/validators';
import { useGetError } from '@/composables/useGetError';

const props = defineProps<{
  channel: Protobuf.Channel.Channel;
  selectedChannel: number;
}>();

type Role = 0 | 1 | 2;
const roleOptions: { label: string; value: Role }[] = [
  { label: 'Disabled', value: 0 },
  { label: 'Primary', value: 1 },
  { label: 'Secondary', value: 2 },
];

type Position = 0 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 32;
const positionOptions: { label: string; value: Position }[] = [
  { label: 'Do not share position', value: 0 },
  { label: '23 km', value: 10 },
  { label: '12 km', value: 11 },
  { label: '5.8 km', value: 12 },
  { label: '2.9 km', value: 13 },
  { label: '1.5 km', value: 14 },
  { label: '700 m', value: 15 },
  { label: '350 m', value: 16 },
  { label: '200 m', value: 17 },
  { label: '90 m', value: 18 },
  { label: '50 m', value: 19 },
  { label: 'Precise', value: 32 },
];

const formValues = ref({
  ...props.channel,
  settings: {
    ...(props.channel.settings ?? {}),
    psk: fromByteArray(props.channel.settings?.psk ?? new Uint8Array(0)),
    moduleSettings: {
      ...(props.channel.settings?.moduleSettings ?? {}),
      positionPrecision: props.channel.settings?.moduleSettings?.positionPrecision ?? 10,
    },
  },
});

const toKeyLength = (value?: number): Key => {
  switch (value) {
    case 0:
    case 1:
    case 16:
    case 32:
      return value;
    default:
      return 16;
  }
};

const pskSize = ref<Key>(toKeyLength(props.channel.settings?.psk?.length));
const preSharedKey = ref(formValues.value.settings.psk);

const tryDecodeBase64 = (value: string): Uint8Array | null => {
  try {
    return toByteArray(value);
  } catch {
    return null;
  }
};

const emptyWhenZeroLength = helpers.withMessage(
  'Key must be empty when length is set to Empty',
  (value: string) => {
    return pskSize.value === 0 ? value.length === 0 : true;
  }
);

const validBase64 = helpers.withMessage('Key is not valid Base64', (value: string) => {
  if (!value || pskSize.value === 0) return true;
  return tryDecodeBase64(value) !== null;
});

const decodedLengthMatches = helpers.withMessage(
  'Decoded key length does not match selected size',
  (value: string) => {
    if (!value || pskSize.value === 0) return true;

    const decoded = tryDecodeBase64(value);
    if (!decoded) return true; // handled by validBase64

    return decoded.length === pskSize.value;
  }
);

const keyRule = {
  preSharedKey: {
    emptyWhenZeroLength,
    validBase64,
    decodedLengthMatches,
  },
};
const v$ = useVuelidate(keyRule, { preSharedKey });

const onKeyUpdate = (payload: PreSharedKeyUpdate) => {
  const { key, length } = payload;
  preSharedKey.value = key;
  pskSize.value = length;
  v$.value.$touch();
};
</script>
