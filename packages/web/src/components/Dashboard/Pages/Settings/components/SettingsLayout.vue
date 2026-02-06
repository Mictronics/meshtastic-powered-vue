<template>
  <Fieldset pt:legend:class="fieldset-legend" class="m-1">
    <template #legend>
      <div class="flex items-center gap-4">
        <slot name="title" />
        <SaveButton :disabled="saveButtonDisable" @save-settings="onSaveSettings" />
        <MeterGroup
          v-if="saveConfigHandler.isSaving.value"
          :value="saveConfigHandler.meters.value"
          pt:root:class="text-xs"
        />
      </div>
    </template>
    <slot />
  </Fieldset>
</template>

<script setup lang="ts">
import SaveButton from './SaveButton.vue';

const props = defineProps<{
  saveButtonDisable: boolean;
  onSaveSettings: () => void;
  saveConfigHandler: any;
}>();
</script>
