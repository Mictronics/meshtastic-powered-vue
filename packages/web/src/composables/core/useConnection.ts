import { ConnectionPhase, ConnectionStatus, ConnectionType, type IConnection, type ConnectionId } from "@/composables/core/stores/connection/types"
import { useBluetooth } from '@vueuse/core';
import { useSerial } from "@/composables/useSerial";
import { useRandomId } from "@/composables/core/useRandomId";
import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";
import { TransportWebBluetooth } from "@meshtastic/transport-web-bluetooth";
import { TransportWebSerial } from "@meshtastic/transport-web-serial";
import { useConnectionStore } from "@/composables/core/stores/connection/useConnectionStore";
import { useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore";
import { useMessageStore } from "@/composables/core/stores/message/useMessageStore";
import { subscribeAll } from "@/composables/core/subscriptions";
import { useAppStore } from "./stores/app/useAppStore";
import { createGlobalState } from '@vueuse/core'

export const useConnection = createGlobalState(() => {
    const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const CONFIG_HEARTBEAT_INTERVAL_MS = 5000; // 5s during configuration
    const transports = new Map<ConnectionId, BluetoothDevice | SerialPort>();
    const heartbeats = new Map<ConnectionId, ReturnType<typeof setInterval>>();
    const bluetoothSupport = useBluetooth({ acceptAllDevices: true });
    const configSubscriptions = new Map<ConnectionId, () => void>();
    const serialSupport = useSerial();
    const connectionStore = useConnectionStore();
    const connections = connectionStore.connections;
    let activeBluetoothDevice: BluetoothDevice | null = null;
    let activeBluetoothDisconnectHandler: (() => void) | null = null;

    async function testHttpConnection(
        url: string,
        timeoutMs = 2500,
    ): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            // Use no-cors to avoid CORS failure; opaque responses resolve but status is 0
            await fetch(url, {
                method: "HEAD",
                mode: "no-cors",
                cache: "no-store",
                signal: controller.signal,
            });
            clearTimeout(timer);
            return true;
        } catch {
            return false;
        }
    }

    function isBluetoothSupported(): boolean {
        return bluetoothSupport.isSupported.value;
    }

    function isSerialSupported(): boolean {
        return serialSupport.isSupported.value;
    }

    async function requestSerialPortInfo(): Promise<SerialPortInfo> {
        let info = {};
        await serialSupport.requestPort();
        if (serialSupport.port.value) {
            info = serialSupport.port.value.getInfo() as SerialPortInfo;
        }
        return info;
    }

    function setStatus(
        connectionId: ConnectionId,
        status: ConnectionStatus,
        error?: string,
    ) {
        connectionStore.updateConnection(connectionId, {
            status,
            error: error ?? undefined,
        });
    }

    async function enforceSingleActiveConnection(connectionId: ConnectionId) {
        const activeId = connectionStore.activeConnectionId.value;
        if (activeId && activeId !== connectionId) {
            await disconnect(activeId);
        }
    }

    type ResolvedTransport =
        | { type: ConnectionType.Unknown; transport: undefined }
        | { type: ConnectionType.Http; transport: Awaited<ReturnType<typeof TransportHTTP.create>> }
        | { type: ConnectionType.Bluetooth; transport: Awaited<ReturnType<typeof TransportWebBluetooth.createFromDevice>>; device: BluetoothDevice }
        | { type: ConnectionType.Serial; transport: Awaited<ReturnType<typeof TransportWebSerial.createFromPort>>; port: SerialPort };

    async function resolveTransport(
        conn: IConnection,
        opts?: { allowPrompt?: boolean },
    ): Promise<ResolvedTransport> {

        switch (conn.type) {
            case ConnectionType.Http: {
                const ok = await testHttpConnection(conn.url);
                const url = new URL(conn.url);
                const isHTTPS = url.protocol === "https:";
                const message = isHTTPS
                    ? `Cannot reach HTTPS endpoint. If using a self-signed certificate, open ${conn.url} in a new tab, accept the certificate warning, then try connecting again.`
                    : "HTTP endpoint not reachable (may be blocked by CORS)";
                if (!ok) throw new Error(message);

                const transport = await TransportHTTP.create(
                    url.host,
                    isHTTPS,
                );

                return { type: ConnectionType.Http, transport };
            }

            case ConnectionType.Bluetooth: {
                if (!("bluetooth" in navigator)) {
                    throw new Error("Web Bluetooth not supported");
                }

                let device: BluetoothDevice | undefined;

                // Reuse granted device
                const getDevices = navigator.bluetooth.getDevices?.bind(navigator.bluetooth);
                if (getDevices && conn.deviceId) {
                    const known = await getDevices();
                    device = known.find(d => d.id === conn.deviceId);
                }

                if (!device && opts?.allowPrompt) {
                    device = await navigator.bluetooth.requestDevice({
                        acceptAllDevices: !conn.gattServiceUUID,
                        optionalServices: conn.gattServiceUUID
                            ? [conn.gattServiceUUID]
                            : undefined,
                        filters: conn.gattServiceUUID
                            ? [{ services: [conn.gattServiceUUID] }]
                            : undefined,
                    });
                }

                if (!device) {
                    throw new Error("Bluetooth device not available");
                }

                const transport =
                    await TransportWebBluetooth.createFromDevice(device);

                return { type: ConnectionType.Bluetooth, transport, device };
            }

            case ConnectionType.Serial: {
                if (!("serial" in navigator)) {
                    throw new Error("Web Serial not supported");
                }

                let port: SerialPort | undefined;

                const ports = await navigator.serial.getPorts();
                if (ports && conn.usbVendorId && conn.usbProductId) {
                    port = ports.find(p => {
                        const info = p.getInfo?.() ?? {};
                        return (
                            info.usbVendorId === conn.usbVendorId &&
                            info.usbProductId === conn.usbProductId
                        );
                    });
                }

                if (!port && opts?.allowPrompt) {
                    port = await navigator.serial.requestPort({});
                }

                if (!port) {
                    throw new Error("Serial port not available");
                }

                const transport = await TransportWebSerial.createFromPort(port);
                return { type: ConnectionType.Serial, transport, port };
            }
            default:
                return { type: ConnectionType.Unknown, transport: undefined };
        }
    }

    async function attachMeshDevice(
        connectionId: ConnectionId,
        resolved: ResolvedTransport,
    ) {
        setStatus(connectionId, ConnectionStatus.Connected);
        connectionStore.activeConnectionId.value = connectionId;

        switch (resolved.type) {
            case ConnectionType.Http:
                return setupMeshDevice(connectionId, resolved.transport);

            case ConnectionType.Bluetooth:
                return setupMeshDevice(
                    connectionId,
                    resolved.transport,
                    resolved.device,
                );

            case ConnectionType.Serial:
                return setupMeshDevice(
                    connectionId,
                    resolved.transport,
                    undefined,
                    resolved.port,
                );
        }
    }

    async function setupMeshDevice(
        connectionId: ConnectionId,
        transport:
            | Awaited<ReturnType<typeof TransportHTTP.create>>
            | Awaited<ReturnType<typeof TransportWebBluetooth.createFromDevice>>
            | Awaited<ReturnType<typeof TransportWebSerial.createFromPort>>,
        btDevice?: BluetoothDevice,
        serialPort?: SerialPort,
    ) {
        // Reuse existing meshDeviceId if available to prevent duplicate nodeDBs,
        // but only if the corresponding nodeDB still exists. Otherwise, generate a new ID.
        const conn = connections.value.get(connectionId);
        const deviceId = conn?.meshDeviceId ?? useRandomId();

        const device = await useDeviceStore().addDevice(deviceId);
        const nodeDB = await useNodeDBStore().addNodeDB(deviceId);
        const messageStore = await useMessageStore().addMessageStore(deviceId);
        const meshDevice = new MeshDevice(transport, deviceId);
        useAppStore().appData.selectedDeviceId = deviceId;
        if (device) device.addConnection(meshDevice); // This stores meshDevice in Device.connection

        if (device && meshDevice && messageStore && nodeDB)
            subscribeAll(device, meshDevice, messageStore, nodeDB);

        // Store transport locally for cleanup (BT/Serial only)
        if (btDevice) {
            transports.set(connectionId, btDevice);
        } else if (serialPort) {
            transports.set(connectionId, serialPort);
        }

        // Set active connection and link device bidirectionally
        connectionStore.activeConnectionId.value = connectionId;
        if (device) device.setConnectionId(connectionId);

        // Listen for config complete event (with nonce/ID)
        const unsubConfigComplete = meshDevice.events.onConfigComplete.subscribe(
            (configCompleteId) => {
                console.log(
                    `[useConnections] Configuration complete with ID: ${configCompleteId}`,
                );
                if (device) device.setConnectionPhase(ConnectionPhase.Configured);
                setStatus(connectionId, ConnectionStatus.Configured);

                // Switch from fast config heartbeat to slow maintenance heartbeat
                const oldHeartbeat = heartbeats.get(connectionId);
                if (oldHeartbeat) {
                    clearInterval(oldHeartbeat);
                    console.log(
                        `[useConnections] Switching to maintenance heartbeat (5 min interval)`,
                    );
                }

                const maintenanceHeartbeat = setInterval(() => {
                    meshDevice.heartbeat().catch((error) => {
                        console.warn("[useConnections] Heartbeat failed:", error);
                    });
                }, HEARTBEAT_INTERVAL_MS);
                heartbeats.set(connectionId, maintenanceHeartbeat);
            },
        );
        configSubscriptions.set(connectionId, unsubConfigComplete);

        // Start configuration
        if (device) {
            device.setConnectionPhase(ConnectionPhase.Configuring);
        }
        setStatus(connectionId, ConnectionStatus.Configuring);
        console.log("[useConnections] Starting configuration");

        meshDevice
            .configure()
            .then(() => {
                console.log(
                    "[useConnections] Configuration complete, starting heartbeat",
                );
                // Send initial heartbeat after configure completes
                meshDevice
                    .heartbeat()
                    .then(() => {
                        // Start fast heartbeat after first successful heartbeat
                        const configHeartbeatId = setInterval(() => {
                            meshDevice.heartbeat().catch((error) => {
                                console.warn(
                                    "[useConnections] Config heartbeat failed:",
                                    error,
                                );
                            });
                        }, CONFIG_HEARTBEAT_INTERVAL_MS);
                        heartbeats.set(connectionId, configHeartbeatId);
                        console.log(
                            `[useConnections] Heartbeat started for connection ${connectionId} (5s interval during config)`,
                        );
                    })
                    .catch((error) => {
                        console.warn("[useConnections] Initial heartbeat failed:", error);
                    });
            })
            .catch((error) => {
                console.error(`[useConnections] Failed to configure:`, error);
                setStatus(connectionId, ConnectionStatus.Error, error.message);
            });

        connectionStore.updateConnection(connectionId, { meshDeviceId: deviceId });
        return deviceId;
    }

    async function connect(
        connectionId: ConnectionId,
        opts?: { allowPrompt?: boolean },
    ) {
        const conn = connections.value.get(connectionId);
        if (!conn) return false;

        if (
            conn.status === ConnectionStatus.Connected ||
            conn.status === ConnectionStatus.Configured
        ) {
            return true;
        }

        setStatus(connectionId, ConnectionStatus.Connecting);

        try {
            await enforceSingleActiveConnection(connectionId);

            const resolved = await resolveTransport(conn, opts);
            await attachMeshDevice(connectionId, resolved);

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            await disconnect(connectionId);
            setStatus(connectionId, ConnectionStatus.Error, message);
            return false;
        }
    }

    async function disconnect(connectionId: ConnectionId) {
        const conn = connections.value.get(connectionId);
        if (!conn) {
            return;
        }
        try {
            // Stop heartbeat
            const heartbeatId = heartbeats.get(connectionId);
            if (heartbeatId) {
                clearInterval(heartbeatId);
                heartbeats.delete(connectionId);
                console.log(
                    `[useConnections] Heartbeat stopped for connection ${connectionId}`,
                );
            }

            // Unsubscribe from config complete event
            const unsubConfigComplete = configSubscriptions.get(connectionId);
            if (unsubConfigComplete) {
                unsubConfigComplete();
                configSubscriptions.delete(connectionId);
                console.log(
                    `[useConnections] Config subscription cleaned up for connection ${connectionId}`,
                );
            }

            // Get device and meshDevice from Device.connection
            if (conn.meshDeviceId) {
                const device = await useDeviceStore().getDevice(conn.meshDeviceId);

                if (device?.connection) {
                    // Disconnect MeshDevice
                    try {
                        device.connection.disconnect();
                    } catch {
                        // Ignore errors
                    }
                }
                // Close transport connections
                const transport = transports.get(connectionId);
                if (transport) {
                    if (conn.type === ConnectionType.Bluetooth) {
                        if (activeBluetoothDevice && activeBluetoothDisconnectHandler) {
                            activeBluetoothDevice.removeEventListener(
                                "gattserverdisconnected",
                                activeBluetoothDisconnectHandler,
                            );
                            activeBluetoothDevice = null;
                            activeBluetoothDisconnectHandler = null;
                        }
                        if ((transport as BluetoothDevice).gatt?.connected) {
                            (transport as BluetoothDevice).gatt?.disconnect();
                        }
                    }
                    if (conn.type === ConnectionType.Serial) {
                        const port = transport as SerialPort & {
                            close?: () => Promise<void>;
                            readable?: ReadableStream | null;
                        };
                        if (port.close) {
                            try {
                                await port.close();
                            } catch (err) {
                                console.warn("Error closing serial port:", err);
                            }
                        }
                    }
                }

                // Clear the device's connectionId link
                if (device) {
                    device.setConnectionId(null);
                    device.setConnectionPhase(ConnectionPhase.Disconnected);
                }
            }
        } finally {
            if (connectionStore.activeConnectionId.value === connectionId) {
                connectionStore.activeConnectionId.value = null;
            }
            setStatus(connectionId, ConnectionStatus.Disconnected);
        }
    };

    async function deleteConnection(connectionId: ConnectionId) {
        const conn = connections.value.get(connectionId);

        // Stop heartbeat
        const heartbeatId = heartbeats.get(connectionId);
        if (heartbeatId) {
            clearInterval(heartbeatId);
            heartbeats.delete(connectionId);
            console.log(`[useConnections] Heartbeat stopped for connection ${connectionId}`);
        }

        // Unsubscribe from config complete event
        const unsubConfigComplete = configSubscriptions.get(connectionId);
        if (unsubConfigComplete) {
            unsubConfigComplete();
            configSubscriptions.delete(connectionId);
            console.log(
                `[useConnections] Config subscription cleaned up for connection ${connectionId}`,
            );
        }

        // Get device and MeshDevice from Device.connection
        if (conn?.meshDeviceId) {
            const device = await useDeviceStore().getDevice(conn.meshDeviceId);

            if (device?.connection) {
                // Disconnect MeshDevice
                try {
                    device.connection.disconnect();
                } catch { }
            }

            // Close transport if it's BT or Serial
            const transport = transports.get(connectionId);
            if (transport) {
                if (activeBluetoothDevice && activeBluetoothDisconnectHandler) {
                    activeBluetoothDevice.removeEventListener(
                        "gattserverdisconnected",
                        activeBluetoothDisconnectHandler,
                    );
                    activeBluetoothDevice = null;
                    activeBluetoothDisconnectHandler = null;
                }

                if ((transport as BluetoothDevice).gatt?.connected) {
                    (transport as BluetoothDevice).gatt?.disconnect();
                }

                const sp = transport as SerialPort & { close?: () => Promise<void> };
                if (sp.close) {
                    try {
                        sp.close();
                    } catch { }
                }

                transports.delete(connectionId);
            }

            // Clean up orphaned Device
            try {
                await useDeviceStore().deleteDevice(conn.meshDeviceId);
            } catch { }
        }

        connectionStore.deleteConnection(connectionId);
    };

    return {
        testHttpConnection,
        isBluetoothSupported,
        isSerialSupported,
        requestSerialPortInfo,
        connect,
        disconnect,
        deleteConnection,
    }
});
