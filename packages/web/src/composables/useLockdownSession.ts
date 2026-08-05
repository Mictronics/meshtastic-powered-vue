import { ref } from 'vue';
import { createSharedComposable } from '@vueuse/core';

/**
 * Holds a lockdown passphrase in memory only, for the lifetime of the
 * browser tab. Never written to IndexedDB, so a page reload or a different
 * physical device always requires fresh passphrase entry. Only meant to be
 * populated once a device has confirmed the passphrase is correct (state
 * UNLOCKED), so it can be silently replayed after an in-tab reconnect.
 */
export const useLockdownSession = createSharedComposable(() => {
    const passphrase = ref<Uint8Array | undefined>(undefined);
    const forDeviceId = ref<number | undefined>(undefined);

    function setPassphrase(deviceId: number, bytes: Uint8Array) {
        forDeviceId.value = deviceId;
        passphrase.value = bytes;
    }

    function clearPassphrase() {
        forDeviceId.value = undefined;
        passphrase.value = undefined;
    }

    function getPassphraseFor(deviceId: number): Uint8Array | undefined {
        return forDeviceId.value === deviceId ? passphrase.value : undefined;
    }

    return { forDeviceId, setPassphrase, clearPassphrase, getPassphraseFor };
});
