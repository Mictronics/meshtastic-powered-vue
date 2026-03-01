<template>
  <div class="pt-2">
    <div>
      <p class="text-slate-400">Settings for audio support</p>
    </div>
    <FormGrid></FormGrid>
  </div>
</template>

<script setup lang="ts">
import type { Validation } from '@vuelidate/core';
import FormGrid from '../components/FormGrid.vue';
import FormRow from '../components/FormRow.vue';

defineProps<{
  v$: Validation;
}>();
</script>
