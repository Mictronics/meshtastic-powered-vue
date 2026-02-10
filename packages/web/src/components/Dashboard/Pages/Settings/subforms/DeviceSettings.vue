<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Device Settings</h4>
      <p class="text-slate-400">General settings for the device</p>
    </div>
    <FormGrid>
      <FormRow
        label="Role"
        for-id="role"
        description="What role the device performs on the mesh."
        :error="useGetError(v$.role)"
      >
        <Select
          aria-labelledby="role"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="role"
          :options="roleOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select device role"
          :invalid="v$.role.$invalid"
          @blur="v$.role.$touch()"
        />
      </FormRow>

      <FormRow
        label="Rebroadcast Mode"
        for-id="broadcastMode"
        description="How to handle rebroadcasting."
        :error="useGetError(v$.rebroadcastMode)"
      >
        <Select
          aria-labelledby="broadcastMode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="rebroadcastMode"
          :options="rebroadcastModeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select rebroadcast mode"
          :invalid="v$.rebroadcastMode.$invalid"
          @blur="v$.rebroadcastMode.$touch()"
        />
      </FormRow>

      <FormRow
        label="Node Info Broadcast Interval"
        for-id="nodeInfo"
        description="How often to broadcast node info."
        :error="useGetError(v$.nodeInfoBroadcastSecs)"
      >
        <InputGroup>
          <InputText
            id="nodeInfo"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="nodeInfoBroadcastSecsInput"
            type="number"
            min="3600"
            max="604800"
            step="1"
            :invalid="v$.nodeInfoBroadcastSecs.$invalid"
            @blur="v$.nodeInfoBroadcastSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Buzzer Mode"
        for-id="buzzerMode"
        description="When to activate the internal buzzer."
        :error="useGetError(v$.buzzerMode)"
      >
        <Select
          aria-labelledby="buzzerMode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="buzzerMode"
          :options="buzzerModeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select buzzer mode"
          :invalid="v$.buzzerMode.$invalid"
          @blur="v$.buzzerMode.$touch()"
        />
      </FormRow>

      <FormRow
        label="Buzzer Pin"
        for-id="buzzerPin"
        description="Buzzer pin override."
        :error="useGetError(v$.buzzerGpio)"
      >
        <InputGroup>
          <InputText
            id="buzzerGpio"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="buzzerGpioInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.buzzerGpio.$invalid"
            @blur="v$.buzzerGpio.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Button Pin"
        for-id="buttonPin"
        description="Button pin override."
        :error="useGetError(v$.buttonGpio)"
      >
        <InputGroup>
          <InputText
            id="buttonPin"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="buttonGpioInput"
            type="number"
            min="0"
            max="65535"
            step="1"
            :invalid="v$.buttonGpio.$invalid"
            @blur="v$.buttonGpio.$touch()"
          />
          <InputGroupAddon>GPIO</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="POSIX Timezone"
        for-id="tzdef"
        description="The POSIX timezone string for the device."
        :error="useGetError(v$.tzdef)"
      >
        <InputGroup>
          <InputText
            id="tzdef"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="tzdef"
            type="text"
            :invalid="v$.tzdef.$invalid"
            @blur="v$.tzdef.$touch()"
            @beforeinput="tzDefInput"
          />
          <InputGroupAddon>{{ byteLength(tzdef ?? '') }}/64</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Double Tap as Button Press"
        for-id="doubleTap"
        description="Treat double tap as button press."
      >
        <ToggleSwitch input-id="doubleTap" v-model="doubleTapAsButtonPress" />
      </FormRow>

      <FormRow
        label="Disable Triple Click"
        for-id="tripleClick"
        description="Disable triple click."
      >
        <ToggleSwitch input-id="tripleClick" v-model="disableTripleClick" />
      </FormRow>

      <FormRow
        label="LED Heartbeat Disabled"
        for-id="heartBeat"
        description="Disable default blinking LED."
      >
        <ToggleSwitch input-id="heartBeat" v-model="ledHeartbeatDisabled" />
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

const props = defineProps<{
  v$: Validation;
}>();

const role = defineModel<number>('role');
const rebroadcastMode = defineModel<number>('rebroadcastMode');
const tzdef = defineModel<string>('tzdef');
const buzzerGpio = defineModel<number>('buzzerGpio');
const buzzerMode = defineModel<number>('buzzerMode');
const buttonGpio = defineModel<number>('buttonGpio');
const nodeInfoBroadcastSecs = defineModel<number>('nodeInfoBroadcastSecs');
const ledHeartbeatDisabled = defineModel<boolean>('ledHeartbeatDisabled');
const disableTripleClick = defineModel<boolean>('disableTripleClick');
const doubleTapAsButtonPress = defineModel<boolean>('doubleTapAsButtonPress');

function byteLength(str: string) {
  return new TextEncoder().encode(str).length;
}

const truncateByByte = (str: string, maxBytes: number) => {
  const encoder = new TextEncoder();
  let result = '';
  for (const char of str) {
    const temp = result + char;
    if (encoder.encode(temp).length > maxBytes - 1) break;
    result = temp;
  }
  return result;
};

const tzDefInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 64);
  tzdef.value = input.value;
  props.v$.tzdef.$touch();
};

const buttonGpioInput = computed<string>({
  get() {
    return buttonGpio.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    buttonGpio.value = Number.isNaN(n) ? 0 : n;
  },
});

const buzzerGpioInput = computed<string>({
  get() {
    return buzzerGpio.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    buzzerGpio.value = Number.isNaN(n) ? 0 : n;
  },
});

const nodeInfoBroadcastSecsInput = computed<string>({
  get() {
    return nodeInfoBroadcastSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    nodeInfoBroadcastSecs.value = Number.isNaN(n) ? 10800 : n;
  },
});

const roleOptions = Object.entries(Protobuf.Config.Config_DeviceConfig_Role)
  .filter(([_, value]) => typeof value === 'number')
  .map(([key, value]) => ({
    label: key.replaceAll('_', ' '),
    value: value as Protobuf.Config.Config_DeviceConfig_Role,
  }));

const rebroadcastModeOptions = Object.entries(Protobuf.Config.Config_DeviceConfig_RebroadcastMode)
  .filter(([_, value]) => typeof value === 'number')
  .map(([key, value]) => ({
    label: key.replaceAll('_', ' '),
    value: value as Protobuf.Config.Config_DeviceConfig_RebroadcastMode,
  }));

const buzzerModeOptions = Object.entries(Protobuf.Config.Config_DeviceConfig_BuzzerMode)
  .filter(([_, value]) => typeof value === 'number')
  .map(([key, value]) => ({
    label: key.replaceAll('_', ' '),
    value: value as Protobuf.Config.Config_DeviceConfig_BuzzerMode,
  }));
</script>
