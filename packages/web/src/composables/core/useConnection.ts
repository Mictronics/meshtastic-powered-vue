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
    const connections = useConnectionStore().connections;

    async function testHttpConnection(
        url: string,
        timeoutMs = 2500,
    ): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            // Use no-cors to avoid CORS failure; opaque responses resolve but status is 0
            await fetch(url, {
                method: "GET",
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

    function updateStatus(id: ConnectionId, status: ConnectionStatus, error?: string) {
        const updates: Partial<IConnection> = {
            status,
            error: error || undefined,
            ...(status === ConnectionStatus.Disconnected ? { lastConnectedAt: Date.now() / 1000 } : {}),
        };
        useConnectionStore().updateConnection(id, updates);
    };

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
        let deviceId = conn?.meshDeviceId;

        if (!deviceId) {
            deviceId = deviceId ?? useRandomId();
        }

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
        useDeviceStore().setActiveConnectionId(connectionId);
        if (device) device.setConnectionId(connectionId);

        // Listen for config complete event (with nonce/ID)
        const unsubConfigComplete = meshDevice.events.onConfigComplete.subscribe(
            (configCompleteId) => {
                console.log(
                    `[useConnections] Configuration complete with ID: ${configCompleteId}`,
                );
                if (device) device.setConnectionPhase(ConnectionPhase.Configured);
                updateStatus(connectionId, ConnectionStatus.Configured);

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
        if (device) device.setConnectionPhase(ConnectionPhase.Configuring);
        updateStatus(connectionId, ConnectionStatus.Configuring);
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
                updateStatus(connectionId, ConnectionStatus.Error, error.message);
            });

        useConnectionStore().updateConnection(connectionId, { meshDeviceId: deviceId });
        return deviceId;
    }


    async function connect(connectionId: ConnectionId, opts?: { allowPrompt?: boolean }) {
        const conn = connections.value.get(connectionId);
        if (!conn) {
            return false;
        }

        if (conn.status === ConnectionStatus.Configured || conn.status === ConnectionStatus.Connected) {
            return true;
        }
        updateStatus(connectionId, ConnectionStatus.Connecting);
        try {
            if (conn.type === ConnectionType.Http) {
                const ok = await testHttpConnection(conn.url);
                if (!ok) {
                    const url = new URL(conn.url);
                    const isHTTPS = url.protocol === "https:";
                    const message = isHTTPS
                        ? `Cannot reach HTTPS endpoint. If using a self-signed certificate, open ${conn.url} in a new tab, accept the certificate warning, then try connecting again.`
                        : "HTTP endpoint not reachable (may be blocked by CORS)";
                    throw new Error(message);
                }

                const url = new URL(conn.url);
                const isTLS = url.protocol === "https:";
                const transport = await TransportHTTP.create(url.host, isTLS);
                setupMeshDevice(connectionId, transport);
                // Status will be set to "configured" by onConfigComplete event
                return true;
            } else if (conn.type === ConnectionType.Bluetooth) {
                if (!("bluetooth" in navigator)) {
                    throw new Error("Web Bluetooth not supported");
                }
                let bleDevice = transports.get(connectionId) as BluetoothDevice | undefined;
                if (!bleDevice) {
                    // Try to recover permitted devices
                    const getDevices = (
                        navigator.bluetooth as Navigator["bluetooth"] & {
                            getDevices?: () => Promise<BluetoothDevice[]>;
                        }
                    ).getDevices;

                    if (getDevices) {
                        const known = await getDevices();
                        if (known && known.length > 0 && conn.deviceId) {
                            bleDevice = known.find(
                                (d: BluetoothDevice) => d.id === conn.deviceId,
                            );
                        }
                    }
                }
                if (!bleDevice && opts?.allowPrompt) {
                    // Prompt user to reselect (filter by optional service if provided)
                    bleDevice = await navigator.bluetooth.requestDevice({
                        acceptAllDevices: !conn.gattServiceUUID,
                        optionalServices: conn.gattServiceUUID
                            ? [conn.gattServiceUUID]
                            : undefined,
                        filters: conn.gattServiceUUID
                            ? [{ services: [conn.gattServiceUUID] }]
                            : undefined,
                    });
                }
                if (!bleDevice) {
                    throw new Error(
                        "Bluetooth device not available. Re-select the device.",
                    );
                }

                const transport =
                    await TransportWebBluetooth.createFromDevice(bleDevice);
                setupMeshDevice(connectionId, transport, bleDevice);

                bleDevice.addEventListener("gattserverdisconnected", () => {
                    updateStatus(connectionId, ConnectionStatus.Disconnected);
                });

                // Status will be set to "configured" by onConfigComplete event
                return true;
            } else if (conn.type === ConnectionType.Serial) {
                if (!("serial" in navigator)) {
                    throw new Error("Web Serial not supported");
                }
                let port = transports.get(connectionId) as SerialPort | undefined;
                if (!port) {
                    // Find a previously granted port by vendor/product
                    const ports: SerialPort[] = await (
                        navigator as Navigator & {
                            serial: { getPorts: () => Promise<SerialPort[]> };
                        }
                    ).serial.getPorts();
                    if (ports && conn.usbVendorId && conn.usbProductId) {
                        port = ports.find((p: SerialPort) => {
                            const info =
                                (
                                    p as SerialPort & {
                                        getInfo?: () => {
                                            usbVendorId?: number;
                                            usbProductId?: number;
                                        };
                                    }
                                ).getInfo?.() ?? {};
                            return (
                                info.usbVendorId === conn.usbVendorId &&
                                info.usbProductId === conn.usbProductId
                            );
                        });
                    }
                }
                if (!port && opts?.allowPrompt) {
                    port = await (
                        navigator as Navigator & {
                            serial: {
                                requestPort: (
                                    options: Record<string, unknown>,
                                ) => Promise<SerialPort>;
                            };
                        }
                    ).serial.requestPort({});
                }
                if (!port) {
                    throw new Error("Serial port not available. Re-select the port.");
                }

                // Ensure the port is closed before opening it
                const portWithStreams = port as SerialPort & {
                    readable: ReadableStream | null;
                    writable: WritableStream | null;
                    close: () => Promise<void>;
                };
                if (portWithStreams.readable || portWithStreams.writable) {
                    try {
                        await portWithStreams.close();
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    } catch (err) {
                        console.warn("Error closing port before reconnect:", err);
                    }
                }

                const transport = await TransportWebSerial.createFromPort(port);
                setupMeshDevice(connectionId, transport, undefined, port);
                // Status will be set to "configured" by onConfigComplete event
                return true;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            updateStatus(connectionId, ConnectionStatus.Error, message);
            return false;
        }
        return false;
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
                        const dev = transport as BluetoothDevice;
                        if (dev.gatt?.connected) {
                            dev.gatt.disconnect();
                        }
                    }
                    if (conn.type === ConnectionType.Serial) {
                        const port = transport as SerialPort & {
                            close?: () => Promise<void>;
                            readable?: ReadableStream | null;
                        };
                        if (port.close && port.readable) {
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
            updateStatus(connectionId, ConnectionStatus.Disconnected, undefined);
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
                const bt = transport as BluetoothDevice;
                if (bt.gatt?.connected) {
                    try {
                        bt.gatt.disconnect();
                    } catch { }
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

        useConnectionStore().deleteConnection(connectionId);
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
