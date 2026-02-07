export enum ConnectionType {
    Unknown = 0,
    Http = 1,
    Serial = 2,
    Bluetooth = 3,
}

export enum ConnectionStatus {
    Disconnected = 0,
    Disconnecting,
    Connected,
    Connecting,
    Configuring,
    Configured,
    Online,
    Error,
}

export enum ConnectionPhase {
    Disconnected = 0,
    Connecting,
    Configuring,
    Configured,
}

export type ConnectionId = number;
export type INewConnection =
    | { type: ConnectionType.Http; name: string; url: string }
    | {
        type: ConnectionType.Bluetooth;
        name: string;
        deviceId?: string;
        deviceName?: string;
        gattServiceUUID?: string;
    }
    | {
        type: ConnectionType.Serial;
        name: string;
        usbVendorId?: number;
        usbProductId?: number;
    }
    | {
        type: ConnectionType.Unknown;
        name: string;
    };

export type IConnection = {
    id: ConnectionId;
    type: ConnectionType;
    name: string;
    createdAt: number;
    lastConnectedAt?: number;
    isDefault: boolean;
    status: ConnectionStatus;
    error?: string;
    meshDeviceId?: number;

    url: string;
    deviceId: string;
    deviceName: string;
    gattServiceUUID: string;
    usbVendorId: number;
    usbProductId: number;
}
