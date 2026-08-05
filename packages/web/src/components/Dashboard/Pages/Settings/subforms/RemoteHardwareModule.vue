<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the remote hardware module</p>
    </div>
    <FormGrid>
      <FormRow
        label="Enable Remote Hardware"
        for-id="remoteHardwareEnabled"
        description="Enable the remote hardware module."
      >
        <ToggleSwitch input-id="remoteHardwareEnabled" v-model="enabled" />
      </FormRow>

      <FormRow
        label="Allow Undefined Pin Access"
        for-id="remoteHardwareAllowUndefinedPinAccess"
        description="Allow consumers to read/write pins not listed below. Insecure: exposes all GPIO pins to the mesh."
      >
        <ToggleSwitch
          input-id="remoteHardwareAllowUndefinedPinAccess"
          v-model="allowUndefinedPinAccess"
        />
      </FormRow>
    </FormGrid>

    <div class="mt-4">
      <div class="flex items-center justify-between">
        <p class="font-medium">Available Pins</p>
        <p class="text-slate-400 text-sm">{{ availablePins?.length ?? 0 }}/{{ MAX_PINS }}</p>
      </div>
      <p class="text-slate-400">GPIO pins exposed to the mesh for reading and writing.</p>

      <div class="mt-2 flex flex-col gap-2">
        <div
          v-for="(pin, index) in availablePins"
          :key="index"
          class="grid grid-cols-1 sm:grid-cols-[0.2fr_0.4fr_0.35fr_auto] items-center gap-2"
        >
          <InputText
            :aria-label="`Pin ${index} GPIO number`"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="number"
            min="0"
            max="65535"
            :model-value="pin.gpioPin"
            @update:model-value="(value) => setGpioPin(index, value)"
            placeholder="GPIO"
          />

          <InputText
            :aria-label="`Pin ${index} name`"
            class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            type="text"
            v-model="pin.name"
            placeholder="Name"
          />

          <Select
            :aria-label="`Pin ${index} access type`"
            class="dark:bg-slate-800 dark:text-slate-400"
            label-class="dark:bg-slate-800 dark:text-slate-400"
            size="small"
            v-model="pin.type"
            :options="pinTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select access type"
          />

          <Button
            :aria-label="`Remove pin ${index}`"
            size="small"
            variant="text"
            severity="danger"
            @click="removePin(index)"
          >
            <Trash2 :size="16" />
          </Button>
        </div>
      </div>

      <Button
        class="mt-2"
        size="small"
        severity="secondary"
        :disabled="(availablePins?.length ?? 0) >= MAX_PINS"
        @click="addPin"
      >
        <Plus :size="16" />
        Add Pin
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { create } from '@bufbuild/protobuf';
import { Protobuf } from '@meshtastic/core';
import type { Validation } from '@vuelidate/core';
import { Plus, Trash2 } from 'lucide-vue-next';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

// Firmware caps the remote hardware pin list at 64 entries.
const MAX_PINS = 64;

const enabled = defineModel<boolean>('enabled');
const allowUndefinedPinAccess = defineModel<boolean>('allowUndefinedPinAccess');
const availablePins = defineModel<Protobuf.ModuleConfig.RemoteHardwarePin[]>('availablePins');

const pinTypeOptions = useEnumOptions(Protobuf.ModuleConfig.RemoteHardwarePinType);

const setGpioPin = (index: number, value: string | number) => {
  const pin = availablePins.value?.[index];
  if (!pin) return;
  const n = Number(value);
  pin.gpioPin = Number.isNaN(n) ? 0 : Math.min(Math.max(n, 0), 65535);
};

const addPin = () => {
  if (!availablePins.value || availablePins.value.length >= MAX_PINS) return;
  availablePins.value.push(create(Protobuf.ModuleConfig.RemoteHardwarePinSchema));
};

const removePin = (index: number) => {
  availablePins.value?.splice(index, 1);
};
</script>
