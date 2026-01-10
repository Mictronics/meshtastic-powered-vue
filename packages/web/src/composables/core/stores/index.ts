import { useDeviceContext } from "@/composables/core/hooks/useDeviceContext.ts";
import { type IDevice, useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import {
  type IMessageStore,
  useMessageStore,
} from "@/composables/core/stores/message/useMessageStore";
import { type INodeDB, useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore";
//import { bindStoreToDevice } from "@core/stores/utils/bindStoreToDevice.ts";

export {
  type DeviceContext,
  useDeviceContext,
} from "@/composables/core/hooks/useDeviceContext";
//export { useAppStore } from "@core/stores/appStore/index.ts";
export { type IDevice, useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
export {
  useConnectionError,
  useConnectionForDevice,
  useConnectionStatus,
  useDeviceForConnection,
  useIsConnected,
  useIsConnecting,
  useSavedConnections,
} from "@/composables/core/stores/selectors";
export type {
  Page,
  ValidConfigType,
  ValidModuleConfigType,
  WaypointWithMetadata,
} from "@/composables/core/stores/device/types";
export {
  MessageState,
  type IMessageStore,
  MessageType,
  useMessageStore,
} from "@/composables/core/stores/message/useMessageStore";
export { type INodeDB, useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore";
export type { NodeErrorType } from "@/composables/core/stores/nodeDB/types";

// Define hooks to access the stores
export const useNodeDB = (): INodeDB => {
  const { deviceId } = useDeviceContext().context;
  let device: any = {};
  useNodeDBStore().getNodeDB(deviceId as number) ??
    useNodeDBStore().addNodeDB(deviceId as number).then((dev) => { device = dev; });
  return device;
};

export const useDevice = (): IDevice => {
  const { deviceId } = useDeviceContext().context;
  let device: any = {};
  useDeviceStore().getDevice(deviceId as number) ??
    useDeviceStore().addDevice(deviceId as number).then((dev) => { device = dev; });
  return device;
};

export const useMessages = (): IMessageStore => {
  const { deviceId } = useDeviceContext().context;
  let device: any = {};
  useMessageStore().getMessageStore(deviceId) ??
    useMessageStore().addMessageStore(deviceId).then((dev) => { device = dev; });
  return device;
};
