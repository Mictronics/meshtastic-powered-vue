/*
import { useDeviceContext } from "@/composables/core/hooks/useDeviceContext";
import { ref, computed, onUnmounted } from "vue";
import { useDebounceFn } from '@vueuse/core';
import { useStore } from 'vuex'; // or your preferred state management solution

export function bindStoreToDevice(store, resolveDB) {
  // Overloads:
  function useBound() {
    return bindLogic();
  }

  function useBoundWithSelector(selector, opts = {}) {
    return bindLogic(selector, opts);
  }

  function bindLogic(selector, opts) {
    const deviceContext = useDeviceContext();
    const { deviceId } = deviceContext; // Assuming deviceContext returns deviceId

    // Reactive state
    const snapshotRef = ref();
    const timer = ref(null);

    const storeSelector = (state) => {
      const db = resolveDB(state, deviceId);
      return selector ? selector(db) : db;
    };

    const wrappedSelector = computed(() => storeSelector(store.state)); // Assuming 'state' is used

    const equality = opts?.equality || ((a, b) => JSON.stringify(a) === JSON.stringify(b));
    const wait = opts?.debounce || 0;

    const updateSnapshot = () => {
      snapshotRef.value = wrappedSelector.value;
    };

    const unsubscribe = store.subscribe((mutation, state) => {
      const next = storeSelector(state);
      const prev = snapshotRef.value;

      // Use the equality function to check if the value has changed
      if (!equality(next, prev)) {
        if (wait > 0) {
          if (timer.value) {
            clearTimeout(timer.value);
          }

          timer.value = setTimeout(updateSnapshot, wait);
        } else {
          updateSnapshot();
        }
      }
    });

    // Set the initial snapshot immediately if fireImmediately is true
    if (opts?.fireImmediately !== false) {
      updateSnapshot();
    }

    // Cleanup when the component is unmounted
    onUnmounted(() => {
      if (timer.value) {
        clearTimeout(timer.value);
      }
      unsubscribe();
    });

    return snapshotRef;
  }

  return {
    useBound,
    useBoundWithSelector,
  };
}
*/