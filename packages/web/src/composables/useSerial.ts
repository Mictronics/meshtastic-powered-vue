import type { ComputedRef, ShallowRef } from 'vue'
import { readonly, shallowRef } from 'vue'
import { useSupported } from '@vueuse/core'

/* https://github.com/vueuse/vueuse/blob/main/packages/core/useBluetooth/index.ts */

export function useSerial(): UseSerialReturn {
    const isSupported = useSupported(() => navigator && 'serial' in navigator)

    const port = shallowRef<undefined | SerialPort>()

    const error = shallowRef<unknown | null>(null)

    async function requestPort(options?: SerialPortRequestOptions): Promise<void> {
        const {
            filters = undefined,
            allowedBluetoothServiceClassIds = undefined,
        } = options || {}
        // This is the function can only be called if Serial API is supported:
        if (!isSupported.value)
            return

        // Reset any errors we currently have:
        error.value = null

        try {
            port.value = await navigator?.serial.requestPort({
                filters,
                allowedBluetoothServiceClassIds,
            });
            isConnected.value = port.value.connected;
        }
        catch (err) {
            error.value = err
        }
    }

    const isConnected = shallowRef(false)

    function reset() {
        isConnected.value = false
        port.value = undefined
    }

    return {
        isSupported,
        isConnected: readonly(isConnected),
        port,
        requestPort,
        reset,
        error,
    }
}

interface UseSerialReturn {
    isSupported: ComputedRef<boolean>
    isConnected: Readonly<ShallowRef<boolean>>
    port: ShallowRef<SerialPort | undefined>
    requestPort: () => Promise<void>
    error: ShallowRef<unknown | null>
    reset: () => void
}