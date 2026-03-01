<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for the TAK/ATAK plugin</p>
    </div>
    <FormGrid>
      <FormRow
        label="Member Role"
        for-id="role"
        description="Role of the group member."
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
          placeholder="Select member role"
          :invalid="v$.role.$invalid"
          @blur="v$.role.$touch()"
        />
      </FormRow>

      <FormRow
        label="Team"
        for-id="team"
        description="Team color of the group member."
        :error="useGetError(v$.team)"
      >
        <Select
          aria-labelledby="mode"
          class="dark:bg-slate-800 dark:text-slate-400 w-full"
          label-class="dark:bg-slate-800 dark:text-slate-400"
          size="small"
          v-model="team"
          :options="teamOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select team color"
          :invalid="v$.team.$invalid"
          @blur="v$.team.$touch()"
        />
      </FormRow>
    </FormGrid>
  </div>
</template>

<script setup lang="ts">
import { Protobuf } from '@meshtastic/core';
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';
import { useGetError } from '@/composables/useGetError';
import { useEnumOptions } from '@/composables/useEnumOptions';

defineProps<{
  v$: Validation;
}>();

const role = defineModel<Protobuf.ATAK.MemberRole>('role');
const team = defineModel<Protobuf.ATAK.Team>('team');

const roleOptions = useEnumOptions(Protobuf.ATAK.MemberRole);
const teamOptions = useEnumOptions(Protobuf.ATAK.Team);
</script>
