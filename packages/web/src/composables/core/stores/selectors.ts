import { useDeviceStore, type IDevice } from "@/composables/core/stores/device/useDeviceStore.ts";
import { type IConnection, type ConnectionId, ConnectionStatus } from "@/composables/core/stores/connection/types";
import { useConnectionStore } from "./connection/useConnectionStore";

/**
 * Hook to get the currently active connection
 */
export function useActiveConnection(): IConnection | undefined {
  return useDeviceStore().getActiveConnection();
}

/**
 * Hook to get the HTTP connection marked as default
 */
export function useDefaultConnection(): IConnection | undefined {
  return [...useConnectionStore().connections.value].find(([key, value]) => value.isDefault)?.[1];
}

/**
 * Hook to get the first saved connection
 */
export function useFirstSavedConnection(): IConnection | undefined {
  return useConnectionStore().connections.value.entries().next().value?.[1];
}

export function useAddSavedConnection() {
  return useConnectionStore().addConnection;
}

export function useUpdateSavedConnection() {
  return useConnectionStore().updateConnection;
}

export function useRemoveSavedConnection() {
  return useConnectionStore().deleteConnection;
}

/**
 * Hook to get the active connection ID
 */
export function useActiveConnectionId(): ConnectionId | null {
  return useDeviceStore().getActiveConnectionId();
}

export function useSetActiveConnectionId(id: ConnectionId) {
  return useDeviceStore().setActiveConnectionId(id);
}

/**
 * Hook to get a specific connection's status
 */
export function useConnectionStatus(id: ConnectionId): ConnectionStatus | undefined {
  return useConnectionStore().connections.value.get(id)?.status;
}

/**
 * Hook to get a device for a specific connection
 */
export function useDeviceForConnection(id: ConnectionId): IDevice | undefined {
  return useDeviceStore().getDeviceForConnection(id);
}

/**
 * Hook to get a connection for a specific device
 */
export function useConnectionForDevice(
  deviceId: number,
): IConnection | undefined {
  return useDeviceStore().getConnectionForDevice(deviceId);
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
