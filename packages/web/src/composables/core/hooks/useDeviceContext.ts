import { reactive } from 'vue';

// Define the type for the device context
export type DeviceContext = {
  deviceId: number; // Unique identifier for the device
};

// Create a reactive store for the device context
export const CurrentDeviceContext = reactive<DeviceContext>({ deviceId: 0 });

// Create a custom function to manage the device context
export function useDeviceContext() {
  return {
    get context() {
      return CurrentDeviceContext; // Getter for the entire DeviceContext
    },
    set context(newDeviceContext: DeviceContext) {
      CurrentDeviceContext.deviceId = newDeviceContext.deviceId; // Setter for the entire DeviceContext
    },
  };
}