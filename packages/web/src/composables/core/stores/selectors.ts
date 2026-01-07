import { useDeviceStore, type IDevice } from "@/composables/core/stores/device/useDeviceStore.ts";
import { type IConnection, type ConnectionId, ConnectionStatus } from "@/composables/core/stores/connection/types";
import { useConnectionStore } from "./connection/useConnectionStore";

/**
 * Hook to get a specific connection's status
 */
export function useConnectionStatus(id: ConnectionId): ConnectionStatus | undefined {
  return useConnectionStore().connections.value.get(id)?.status;
}

/**
 * Hook to get a device for a specific connection
 */
export async function useDeviceForConnection(id: ConnectionId) {
  return await useDeviceStore().getDeviceForConnection(id);
}

/**
 * Hook to get a connection for a specific device
 */
export function useConnectionForDevice(
  deviceId: number,
): IConnection | undefined {
  return useConnectionStore().getConnectionForDevice(deviceId);
}

/**
 * Hook to check if any connection is currently connecting
 */
export function useIsConnecting(): boolean {
  return [...useConnectionStore().connections.value.values()].some(
    (c) => c.status === ConnectionStatus.Connecting || c.status === ConnectionStatus.Configuring);
}

/**
 * Hook to get error message for a specific connection
 */
export function useConnectionError(id: ConnectionId): string | null {
  return useConnectionStore().connections.value.get(id)?.error ?? null;
}

/**
 * Hook to get all saved connections
 */
export function useSavedConnections(): Map<number, IConnection> {
  return useConnectionStore().connections.value;
}

/**
 * Hook to check if a connection is connected
 */
export function useIsConnected(id: ConnectionId): boolean {
  const status = useConnectionStore().connections.value.get(id)?.status;
  return status === ConnectionStatus.Connected || status === ConnectionStatus.Configured;
}
