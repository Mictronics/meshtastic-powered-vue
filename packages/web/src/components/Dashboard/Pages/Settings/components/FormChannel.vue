<template>
  <FormGrid>
    <FormRow
      label="Role"
      for-id="role"
      description="Device telemetry is sent over Primary. Only one Primary allowed."
    >
      <Select
        aria-labelledby="role"
        class="dark:bg-slate-800 dark:text-slate-400 w-full"
        label-class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        :options="roleOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select channel role"
        v-model="formChannel.role"
        :disabled="formChannel.index === 0"
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
        v-model="formChannel.settings.name"
      />
    </FormRow>

    <FormRow
      label="Pre-Shared Key"
      for-id="key"
      description="Supported PSK lengths: 256-bit, 128-bit, 8-bit, Empty (0-bit)"
    >
      <FormKeyGenerator
        :initial-key="psk"
        :initial-key-size="pskSize"
        :error="useGetError(pskV$.preSharedKey)"
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
        label-class="dark:bg-slate-800 dark:text-slate-400"
        size="small"
        :options="positionOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Select position precision"
        v-model="formChannel.settings.moduleSettings.positionPrecision"
      />
    </FormRow>

    <FormRow
      label="Allow MQTT uplink"
      for-id="allowMqttUplink"
      description="Allow sending messages from the local mesh via MQTT."
    >
      <ToggleSwitch input-id="allowMqttUplink" v-model="formChannel.settings.uplinkEnabled" />
    </FormRow>

    <FormRow
      label="Allow MQTT downlink"
      for-id="allowMqttDownlink"
      description="Allow receiving messages from MQTT into the local mesh."
    >
      <ToggleSwitch input-id="allowMqttDownlink" v-model="formChannel.settings.downlinkEnabled" />
    </FormRow>

    <FormRow
      label="Mute notifications"
      for-id="muteNotes"
      description="Mute notifications or alerts from this channel."
    >
      <ToggleSwitch input-id="muteNotes" v-model="formChannel.settings.mute" />
    </FormRow>

    <FormRow
      label="Mute channel"
      for-id="muteChannel"
      description="Mute the channel on phone or clients. Useful for noisy public channels you don't necessarily want to disable."
    >
      <ToggleSwitch
        input-id="muteChannel"
        v-model="formChannel.settings.moduleSettings.isClientMuted"
      />
    </FormRow>
  </FormGrid>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { create } from '@bufbuild/protobuf';
import { Protobuf } from '@meshtastic/core';
import { fromByteArray, toByteArray } from 'base64-js';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import FormKeyGenerator from './FormKeyGenerator.vue';
import type { PreSharedKeyUpdate, Key } from './FormKeyGenerator.vue';
import useVuelidate from '@vuelidate/core';
import { useGetError } from '@/composables/useGetError';
import { useBase64KeyRules } from '@/composables/useBase64KeyValidator';

const props = defineProps<{
  channel: Protobuf.Channel.Channel;
  selectedChannel: number;
}>();

const emit = defineEmits<{
  (e: 'updateChannel', channel: Protobuf.Channel.Channel): void;
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

const formChannel = ref({
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

watch(
  () => formChannel.value.index,
  (index: number) => {
    const role = formChannel.value.role;
    if (index === 0) {
      formChannel.value.role = 1;
    } else if (index > 0) {
      if (role !== 0 && role !== 2) {
        formChannel.value.role = 0;
      }
    }
  },
  { immediate: true }
);

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
const psk = computed<string>({
  get: () => formChannel.value.settings.psk as string,
  set: (val: string) => {
    formChannel.value.settings.psk = val;
  },
});

const pskV$ = useVuelidate(
  {
    preSharedKey: useBase64KeyRules(pskSize, 'Pre-shared key'),
  },
  { preSharedKey: psk }
);

const onKeyUpdate = (payload: PreSharedKeyUpdate) => {
  const { privateKey, length } = payload;
  psk.value = privateKey;
  pskSize.value = length;
  pskV$.value.$touch();
};

watchDebounced(
  formChannel,
  (channel) => {
    if (pskV$.value.$invalid) {
      return;
    }
    const { $typeName, ...settingsWithoutTypeName } = channel.settings;
    const payload = create(Protobuf.Channel.ChannelSchema, {
      ...channel,
      settings: create(Protobuf.Channel.ChannelSettingsSchema, {
        ...settingsWithoutTypeName,
        psk: toByteArray(channel.settings.psk),
        moduleSettings: create(Protobuf.Channel.ModuleSettingsSchema, {
          ...channel.settings.moduleSettings,
          positionPrecision: channel.settings.moduleSettings.positionPrecision,
          isClientMuted: channel.settings.moduleSettings.isClientMuted ?? false,
        }),
      }),
    });
    emit('updateChannel', payload);
  },
  { debounce: 300, deep: true }
);
</script>
