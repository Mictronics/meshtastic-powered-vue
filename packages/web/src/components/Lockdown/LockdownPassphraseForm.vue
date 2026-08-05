<template>
  <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
    <div>
      <label for="lockdownPassphrase" class="text-sm font-medium">Passphrase</label>
      <Password
        id="lockdownPassphrase"
        input-class="dark:bg-slate-800 dark:text-slate-400"
        input-id="lockdownPassphrase"
        v-model="passphrase"
        toggleMask
        fluid
        size="small"
        :feedback="false"
        :invalid="v$.passphrase.$error"
        @blur="v$.passphrase.$touch()"
      />
      <Message v-if="v$.passphrase.$error" severity="error" size="small" variant="simple">
        <p v-for="error of v$.passphrase.$errors" :key="error.$uid">{{ error.$message }}</p>
      </Message>
    </div>

    <div v-if="mode === 'provision'">
      <label for="lockdownPassphraseConfirm" class="text-sm font-medium">Confirm passphrase</label>
      <Password
        id="lockdownPassphraseConfirm"
        input-class="dark:bg-slate-800 dark:text-slate-400"
        v-model="confirmPassphrase"
        toggleMask
        fluid
        size="small"
        :feedback="false"
        :invalid="confirmTouched && confirmPassphrase !== passphrase"
        @blur="confirmTouched = true"
      />
      <Message
        v-if="confirmTouched && confirmPassphrase !== passphrase"
        severity="error"
        size="small"
        variant="simple"
      >
        Passphrases do not match.
      </Message>
    </div>

    <Fieldset v-if="mode !== 'disable'" legend="Advanced (optional)" toggleable :collapsed="true">
      <div class="flex flex-col gap-3">
        <div>
          <label class="text-sm">Boots remaining (0 = firmware default)</label>
          <InputText
            type="number"
            min="0"
            v-model.number="bootsRemaining"
            size="small"
            fluid
            class="dark:bg-slate-800 dark:text-slate-400"
          />
        </div>
        <div>
          <label class="text-sm">Session expiry, Unix epoch seconds (0 = no limit)</label>
          <InputText
            type="number"
            min="0"
            v-model.number="validUntilEpoch"
            size="small"
            fluid
            class="dark:bg-slate-800 dark:text-slate-400"
          />
        </div>
        <div>
          <label class="text-sm">Max session length in seconds (0 = unlimited)</label>
          <InputText
            type="number"
            min="0"
            v-model.number="maxSessionSeconds"
            size="small"
            fluid
            class="dark:bg-slate-800 dark:text-slate-400"
          />
        </div>
      </div>
    </Fieldset>

    <Message v-if="mode === 'provision'" severity="warn" size="small">
      <div class="flex gap-2 items-start">
        <AlertTriangle :size="16" class="shrink-0 mt-0.5" />
        <div>
          Enabling lockdown permanently locks this device's debug port (SWD/JTAG). This cannot be
          undone even by disabling lockdown later &mdash; recovery would require a full chip erase
          that destroys all data on the device.
        </div>
      </div>
    </Message>
    <div v-if="mode === 'provision'" class="flex items-center gap-2">
      <Checkbox v-model="acknowledged" inputId="lockdownAck" binary size="small" />
      <label for="lockdownAck" class="text-sm">I understand this cannot be undone.</label>
    </div>

    <Message v-if="errorMessage" severity="error" size="small" variant="simple">
      {{ errorMessage }}
    </Message>

    <div class="flex items-center gap-3">
      <Button
        type="submit"
        size="small"
        :severity="mode === 'disable' ? 'danger' : 'success'"
        :disabled="submitDisabled"
      >
        <ProgressSpinner
          v-if="submitting"
          style="width: 15px; height: 15px"
          strokeWidth="5"
          fill="transparent"
        />
        <template v-else>{{ submitLabel }}</template>
      </Button>
      <span v-if="backoffRemaining > 0" class="text-xs text-slate-500 dark:text-slate-400">
        Try again in {{ backoffRemaining }}s.
      </span>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AlertTriangle } from 'lucide-vue-next';
import { useVuelidate } from '@vuelidate/core';
import { useIntervalFn } from '@vueuse/core';
import { LockdownAuthRules } from '@/composables/ValidationRules';

const props = defineProps<{
  mode: 'provision' | 'unlock' | 'disable';
  backoffSeconds?: number;
  errorMessage?: string;
  submitting?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      passphraseBytes: Uint8Array;
      bootsRemaining: number;
      validUntilEpoch: number;
      maxSessionSeconds: number;
    },
  ): void;
}>();

const passphrase = ref('');
const confirmPassphrase = ref('');
const confirmTouched = ref(false);
const acknowledged = ref(false);
const bootsRemaining = ref(0);
const validUntilEpoch = ref(0);
const maxSessionSeconds = ref(0);

const v$ = useVuelidate(LockdownAuthRules, { passphrase });

const backoffRemaining = ref(0);
const { pause, resume } = useIntervalFn(
  () => {
    if (backoffRemaining.value <= 1) {
      backoffRemaining.value = 0;
      pause();
    } else {
      backoffRemaining.value -= 1;
    }
  },
  1000,
  { immediate: false },
);

// Backoff duration is reported fresh on each UNLOCK_FAILED; restart the
// countdown whenever it changes rather than only on the first failure.
watch(
  () => props.backoffSeconds,
  (secs) => {
    if (secs && secs > 0) {
      backoffRemaining.value = secs;
      resume();
    }
  },
);

const submitLabel = computed(() => {
  switch (props.mode) {
    case 'provision':
      return 'Set passphrase';
    case 'disable':
      return 'Disable lockdown';
    default:
      return 'Unlock';
  }
});

const submitDisabled = computed(() => {
  if (v$.value.passphrase.$invalid) return true;
  if (props.mode === 'provision') {
    if (confirmPassphrase.value !== passphrase.value) return true;
    if (!acknowledged.value) return true;
  }
  if (backoffRemaining.value > 0) return true;
  if (props.submitting) return true;
  return false;
});

function onSubmit() {
  v$.value.$touch();
  confirmTouched.value = true;
  if (submitDisabled.value) return;

  emit('submit', {
    passphraseBytes: new TextEncoder().encode(passphrase.value),
    bootsRemaining: bootsRemaining.value || 0,
    validUntilEpoch: validUntilEpoch.value || 0,
    maxSessionSeconds: maxSessionSeconds.value || 0,
  });
}
</script>
