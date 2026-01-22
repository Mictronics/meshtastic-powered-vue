import { ref, watch } from 'vue';
import { useAppStore } from '../stores/app/useAppStore';
import { createSharedComposable } from "@vueuse/core";

export type DeviceContext = {
  deviceId: number;
};

export const useDeviceContext = createSharedComposable(() => {
  const CurrentDeviceContext = ref<DeviceContext>({ deviceId: 0 });

  watch(() => useAppStore().appData.recentDeviceId, (n) => {
    CurrentDeviceContext.value = { deviceId: n };
  })

  return {
    get context() {
      return CurrentDeviceContext.value;
    },
    set context(newDeviceContext: DeviceContext) {
      CurrentDeviceContext.value = newDeviceContext;
    },
  };
});
