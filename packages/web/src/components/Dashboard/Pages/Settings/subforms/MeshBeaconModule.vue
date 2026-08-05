<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the periodic mesh beacon</p>
    </div>
    <FormGrid>
      <FormRow
        label="Listen"
        for-id="beaconListen"
        description="Receive beacon messages from other nodes and deliver them to the local inbox."
      >
        <ToggleSwitch input-id="beaconListen" v-model="listenEnabled" />
      </FormRow>

      <FormRow
        label="Broadcast"
        for-id="beaconBroadcast"
        description="Periodically broadcast a beacon message from this node."
      >
        <ToggleSwitch input-id="beaconBroadcast" v-model="broadcastEnabled" />
      </FormRow>

      <FormRow
        label="Message"
        for-id="beaconMessage"
        description="Human-readable text included in each beacon broadcast."
        :error="useGetError(v$.broadcastMessage)"
      >
        <InputGroup>
          <InputText
            id="beaconMessage"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="text"
            v-model="broadcastMessage"
            :invalid="v$.broadcastMessage.$invalid"
            @beforeinput="onMessageInput"
          />
          <InputGroupAddon>{{ byteLength(broadcastMessage ?? '') }}/100</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Broadcast Interval"
        for-id="beaconInterval"
        description="How often to broadcast, in seconds. Minimum 3600 (1 hour)."
        :error="useGetError(v$.broadcastIntervalSecs)"
      >
        <InputGroup>
          <InputText
            id="beaconInterval"
            class="dark:bg-slate-800 dark:text-slate-400 w-full"
            size="small"
            type="number"
            min="3600"
            v-model="broadcastIntervalSecsInput"
            :invalid="v$.broadcastIntervalSecs.$invalid"
            @blur="v$.broadcastIntervalSecs.$touch()"
          />
          <InputGroupAddon>Seconds</InputGroupAddon>
        </InputGroup>
      </FormRow>

      <FormRow
        label="Send As Node"
        for-id="beaconSendAsNode"
        description="Optional node ID to send beacon messages as. Leave at 0 to send as the local node."
      >
        <InputText
          id="beaconSendAsNode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          size="small"
          type="number"
          min="0"
          v-model="broadcastSendAsNodeInput"
        />
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

const flags = defineModel<number>('flags');
const broadcastMessage = defineModel<string>('broadcastMessage');
const broadcastIntervalSecs = defineModel<number>('broadcastIntervalSecs');
const broadcastSendAsNode = defineModel<number>('broadcastSendAsNode');

const props = defineProps<{
  v$: Validation;
}>();

const hasFlag = (mask: number) => ((flags.value ?? 0) & mask) !== 0;
const setFlag = (mask: number, enabled: boolean) => {
  flags.value = enabled ? (flags.value ?? 0) | mask : (flags.value ?? 0) & ~mask;
};

const listenEnabled = computed<boolean>({
  get: () => hasFlag(Protobuf.ModuleConfig.ModuleConfig_MeshBeaconConfig_Flags.FLAG_LISTEN_ENABLED),
  set: (enabled) =>
    setFlag(Protobuf.ModuleConfig.ModuleConfig_MeshBeaconConfig_Flags.FLAG_LISTEN_ENABLED, enabled),
});

const broadcastEnabled = computed<boolean>({
  get: () =>
    hasFlag(Protobuf.ModuleConfig.ModuleConfig_MeshBeaconConfig_Flags.FLAG_BROADCAST_ENABLED),
  set: (enabled) =>
    setFlag(Protobuf.ModuleConfig.ModuleConfig_MeshBeaconConfig_Flags.FLAG_BROADCAST_ENABLED, enabled),
});

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

const onMessageInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  input.value = truncateByByte(input.value, 100);
  broadcastMessage.value = input.value;
  props.v$.broadcastMessage.$touch();
};

const broadcastIntervalSecsInput = computed<string>({
  get() {
    return broadcastIntervalSecs.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    broadcastIntervalSecs.value = Number.isNaN(n) ? 3600 : n;
  },
});

const broadcastSendAsNodeInput = computed<string>({
  get() {
    return broadcastSendAsNode.value?.toString() ?? '';
  },
  set(value) {
    const n = Number(value);
    broadcastSendAsNode.value = Number.isNaN(n) ? 0 : n;
  },
});
</script>
