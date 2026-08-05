<template>
  <main class="lockdown-view p-4 md:p-8 max-w-lg mx-auto">
    <header class="flex items-start justify-between gap-3 mb-4">
      <div>
        <h1 class="text-xl md:text-2xl font-bold tracking-tight logo-text flex items-center gap-2">
          <Lock :size="22" />
          Device lockdown
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ connectionName }}
        </p>
      </div>
      <Button asChild v-slot="slotProps" aria-label="Back to Connections" variant="text" severity="secondary">
        <RouterLink to="/" :class="slotProps.class">
          <ArrowLeft :size="20" />
        </RouterLink>
      </Button>
    </header>
    <Divider />

    <div v-if="viewMode === 'loading'" class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
      <ProgressSpinner style="width: 18px; height: 18px" strokeWidth="5" fill="transparent" />
      Checking lockdown status&hellip;
    </div>

    <div v-else-if="viewMode === 'redirecting'" class="text-sm text-slate-500 dark:text-slate-400">
      Device is accessible &mdash; returning you to the app&hellip;
    </div>

    <template v-else-if="viewMode === 'provision'">
      <p class="text-sm mb-4">
        This device supports lockdown mode. Set a passphrase to encrypt its stored configuration,
        channels, and node database at rest.
      </p>
      <LockdownPassphraseForm
        mode="provision"
        :submitting="submitting"
        :error-message="sendError"
        @submit="onSubmit"
      />
    </template>

    <template v-else-if="viewMode === 'unlock'">
      <Message severity="warn" size="small" class="mb-4">{{ lockReasonText }}</Message>
      <LockdownPassphraseForm
        mode="unlock"
        :submitting="submitting"
        :error-message="sendError"
        @submit="onSubmit"
      />
    </template>

    <template v-else-if="viewMode === 'unlockFailed'">
      <Message severity="error" size="small" class="mb-4">
        Passphrase rejected. Please try again.
      </Message>
      <LockdownPassphraseForm
        mode="unlock"
        :submitting="submitting"
        :error-message="sendError"
        :backoff-seconds="lockdownStatus?.backoffSeconds"
        @submit="onSubmit"
      />
    </template>

    <template v-else-if="viewMode === 'disable'">
      <p class="text-sm mb-4">
        Disabling lockdown decrypts this device's storage and removes the passphrase requirement.
        The debug-port lock (if the device's hardware supports it) is not reversed by this action.
      </p>
      <LockdownPassphraseForm
        mode="disable"
        :submitting="submitting"
        :error-message="sendError"
        @submit="onSubmit"
      />
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Lock } from 'lucide-vue-next';
import { Protobuf } from '@meshtastic/core';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useConnectionStore } from '@/composables/stores/connection/useConnectionStore';
import { useLockdownSession } from '@/composables/useLockdownSession';
import LockdownPassphraseForm from '@/components/Lockdown/LockdownPassphraseForm.vue';

const LockdownState = Protobuf.Mesh.LockdownStatus_State;

const LOCK_REASON_TEXT: Record<string, string> = {
  needs_auth: 'Storage is unlocked, but this connection needs to authenticate.',
  token_missing: 'No unlock token found on this device.',
  token_expired: 'Your unlock session has expired.',
  token_boots_zero: 'Your unlock session has run out of allowed boots.',
  token_hmac_fail: 'The unlock token failed verification (tampered or wrong device).',
  token_dek_fail: 'The unlock token could not decrypt device storage.',
  token_wrong_size: 'The unlock token file is corrupted.',
  token_bad_magic: 'The unlock token file is corrupted.',
  not_provisioned: 'This device has not been provisioned yet.',
};

const route = useRoute();
const router = useRouter();
const device = useDeviceStore().device;
const connectionStore = useConnectionStore();

const submitting = ref(false);
const sendError = ref('');
const lastAttemptedPassphrase = ref<Uint8Array | undefined>(undefined);

const lockdownStatus = computed(() => device.value?.lockdownStatus);

const connectionName = computed(() => {
  const conn = device.value ? connectionStore.getConnectionForDevice(device.value.id) : undefined;
  return conn?.name ?? 'No active connection';
});

const redirectTarget = computed(() => {
  const target = route.query.redirect;
  return typeof target === 'string' && target ? target : '/nodes';
});

const lockReasonText = computed(() => {
  const reason = lockdownStatus.value?.lockReason;
  if (!reason) return 'Locked — enter passphrase to continue.';
  return LOCK_REASON_TEXT[reason] ?? 'Locked — enter passphrase to continue.';
});

const viewMode = computed(() => {
  const state = lockdownStatus.value?.state;
  if (state === undefined || state === LockdownState.STATE_UNSPECIFIED) return 'loading';
  if (state === LockdownState.NEEDS_PROVISION) return 'provision';
  if (state === LockdownState.LOCKED) return 'unlock';
  if (state === LockdownState.UNLOCK_FAILED) return 'unlockFailed';
  if (state === LockdownState.DISABLED) {
    return route.query.action === 'disable' ? 'redirecting' : 'provision';
  }
  if (state === LockdownState.UNLOCKED) {
    return route.query.action === 'disable' ? 'disable' : 'redirecting';
  }
  return 'loading';
});

watch(
  () => lockdownStatus.value?.state,
  (state) => {
    if (state === LockdownState.UNLOCKED && route.query.action !== 'disable') {
      if (lastAttemptedPassphrase.value && device.value) {
        useLockdownSession().setPassphrase(device.value.id, lastAttemptedPassphrase.value);
      }
      router.replace(redirectTarget.value);
    } else if (state === LockdownState.DISABLED && route.query.action === 'disable') {
      useLockdownSession().clearPassphrase();
      router.replace(redirectTarget.value);
    }
  },
);

async function onSubmit(payload: {
  passphraseBytes: Uint8Array;
  bootsRemaining: number;
  validUntilEpoch: number;
  maxSessionSeconds: number;
}) {
  const meshDevice = device.value?.connection;
  if (!meshDevice) {
    sendError.value = 'No active device connection.';
    return;
  }

  sendError.value = '';
  submitting.value = true;
  lastAttemptedPassphrase.value = payload.passphraseBytes;

  try {
    if (viewMode.value === 'disable') {
      await meshDevice.disableLockdown(payload.passphraseBytes);
    } else {
      await meshDevice.setLockdownAuth(payload.passphraseBytes, {
        bootsRemaining: payload.bootsRemaining,
        validUntilEpoch: payload.validUntilEpoch,
        maxSessionSeconds: payload.maxSessionSeconds,
      });
    }
  } catch (err) {
    sendError.value = err instanceof Error ? err.message : 'Failed to send command to device.';
  } finally {
    submitting.value = false;
  }
}
</script>
