<template>
  <div class="pt-2">
    <div>
      <h4 class="scroll-m-20 text-xl tracking-tight font-medium">Traffic Management Module</h4>
      <p class="text-slate-400">Settings for traffic management</p>
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
