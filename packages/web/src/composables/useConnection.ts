import { ConnectionPhase, ConnectionStatus, ConnectionType, type IConnection, type ConnectionId } from "@/composables/stores/connection/types"
import { useBluetooth } from '@vueuse/core';
import { useSerial } from "@/composables/useSerial";
import { useRandomId } from "@/composables/useRandomId";
import { MeshDevice } from "@meshtastic/core";
import { TransportHTTP } from "@meshtastic/transport-http";
import { TransportWebBluetooth } from "@meshtastic/transport-web-bluetooth";
import { TransportWebSerial } from "@meshtastic/transport-web-serial";
import { useConnectionStore } from "@/composables/stores/connection/useConnectionStore";
import { useDeviceStore } from "@/composables/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore";
import { useMessageStore } from "@/composables/stores/message/useMessageStore";
import { subscribeAll } from "@/composables/subscriptions";
import { useAppStore } from "./stores/app/useAppStore";
import { createGlobalState } from '@vueuse/core'

export const useConnection = createGlobalState(() => {
    const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    const CONFIG_HEARTBEAT_INTERVAL_MS = 5000; // 5s during configuration
    const bluetoothSupport = useBluetooth({ acceptAllDevices: true });
    const serialSupport = useSerial();
    const connectionStore = useConnectionStore();
    const connections = connectionStore.connections;
    let connecting = false;

    type ActiveConnectionRuntime = {
        connectionId: ConnectionId | null;
        transport?: BluetoothDevice | SerialPort;
        bluetoothDisconnectHandler?: () => void;
        heartbeatId?: ReturnType<typeof setInterval>;
        unsubConfigComplete?: () => void;
        isConfigured?: boolean;
    };

    const runtime: ActiveConnectionRuntime = {
        connectionId: null,
    };

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

    async function requestSerialPortInfo(): Promise<SerialPortInfo | undefined> {
        await serialSupport.requestPort();
        if (serialSupport.port.value) {
            return serialSupport.port.value.getInfo() as SerialPortInfo;
        }
        return undefined;
    }

    function setStatus(
        connectionId: ConnectionId,
        status: ConnectionStatus,
        error?: string,
    ) {
        connectionStore.updateConnection(connectionId, {
            status,
            error: error ?? undefined,
            ...(status === ConnectionStatus.Connected ? { lastConnectedAt: Date.now() / 1000 } : {}),
        });
    }

    function startHeartbeat(meshDevice: MeshDevice, intervalMs: number) {
        if (runtime.heartbeatId) {
            clearInterval(runtime.heartbeatId);
        }

        runtime.heartbeatId = setInterval(() => {
            if (!runtime.connectionId) return;
            meshDevice.heartbeat().catch(err => {
                console.warn("[useConnection] Heartbeat failed:", err);
            });
        }, intervalMs);
    }

    function stopHeartbeat() {
        if (runtime.heartbeatId) {
            clearInterval(runtime.heartbeatId);
            runtime.heartbeatId = undefined;
        }
    }

    async function teardownActiveConnection(reason?: string) {
        if (!runtime.connectionId) return;

        const connectionId = runtime.connectionId;
        const conn = connections.value.get(connectionId);
        runtime.isConfigured = false;
        stopHeartbeat();

        if (runtime.unsubConfigComplete) {
            runtime.unsubConfigComplete();
            runtime.unsubConfigComplete = undefined;
        }

        if (
            conn?.type === ConnectionType.Bluetooth &&
            runtime.transport as BluetoothDevice
        ) {
            if (runtime.bluetoothDisconnectHandler) {
                runtime.transport?.removeEventListener(
                    "gattserverdisconnected",
                    runtime.bluetoothDisconnectHandler,
                );
                runtime.bluetoothDisconnectHandler = undefined;
            }

            if ((runtime.transport as BluetoothDevice).gatt?.connected) {
                (runtime.transport as BluetoothDevice).gatt?.disconnect();
            }
        }

        if (
            conn?.type === ConnectionType.Serial &&
            runtime.transport &&
            "close" in runtime.transport
        ) {
            try {
                await runtime.transport.close();
            } catch {
                // ignore
            }
        }

        if (conn?.meshDeviceId) {
            const device = await useDeviceStore().getDevice(conn.meshDeviceId);
            if (device?.connection) {
                try {
                    device.connection.disconnect();
                } catch { }
            }

            device?.setConnectionId(null);
            device?.setConnectionPhase(ConnectionPhase.Disconnected);
        }

        setStatus(connectionId, ConnectionStatus.Disconnected);

        runtime.connectionId = null;
        runtime.transport = undefined;

        connectionStore.activeConnectionId.value = null;

        if (reason) {
            console.info(`[useConnection] Connection torn down: ${reason}`);
        }
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
        runtime.isConfigured = false;

        runtime.connectionId = connectionId;
        runtime.transport =
            resolved.type === ConnectionType.Bluetooth
                ? resolved.device
                : resolved.type === ConnectionType.Serial
                    ? resolved.port
                    : undefined;

        switch (resolved.type) {
            case ConnectionType.Http:
                return setupMeshDevice(connectionId, resolved.transport);

            case ConnectionType.Bluetooth:
                const onGattDisconnected = () => {
                    if (runtime.connectionId !== connectionId) return;
                    teardownActiveConnection("bluetooth disconnect");
                };

                resolved.device.addEventListener(
                    "gattserverdisconnected",
                    onGattDisconnected,
                );

                runtime.bluetoothDisconnectHandler = onGattDisconnected;
                runtime.transport = resolved.device;
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
        useAppStore().appData.recentDeviceId = deviceId;
        if (device) device.addConnection(meshDevice); // This stores meshDevice in Device.connection

        if (device && meshDevice && messageStore && nodeDB)
            subscribeAll(device, meshDevice, messageStore, nodeDB);

        // Set active connection and link device bidirectionally
        if (device) device.setConnectionId(connectionId);

        // Listen for config complete event (with nonce/ID)
        runtime.unsubConfigComplete = meshDevice.events.onConfigComplete.subscribe(
            (configCompleteId) => {
                if (runtime.connectionId !== connectionId) return;
                console.log(
                    `[useConnections] Configuration complete with ID: ${configCompleteId}`,
                );
                if (device) device.setConnectionPhase(ConnectionPhase.Configured);
                setStatus(connectionId, ConnectionStatus.Configured);

                nodeDB?.pruneStaleNodes();

                // Switch from fast config heartbeat to slow maintenance heartbeat
                runtime.isConfigured = true;
                startHeartbeat(meshDevice, HEARTBEAT_INTERVAL_MS);
                console.log(
                    `[useConnections] Switching to maintenance heartbeat (5 min interval)`,
                );
            },
        );

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
                    "[useConnections] Configuration command sent, starting heartbeat",
                );
                // Send initial heartbeat after configure completes
                meshDevice
                    .heartbeat()
                    .then(() => {
                        // Start fast heartbeat after first successful heartbeat
                        if (!runtime.isConfigured) {
                            startHeartbeat(meshDevice, CONFIG_HEARTBEAT_INTERVAL_MS);
                        }
                        console.log(
                            `[useConnections] Heartbeat started for connection ${connectionId} (5s interval during config)`,
                        );
                    })
                    .catch((error) => {
                        console.warn("[useConnections] Initial heartbeat failed:", error);
                    });
            })
            .catch(async (error) => {
                console.error(`[useConnections] Failed to configure:`, error);
                await teardownActiveConnection("configuration failed");
                setStatus(connectionId, ConnectionStatus.Error, error.message);
            });

        connectionStore.updateConnection(connectionId, { meshDeviceId: deviceId });
        return deviceId;
    }

    async function connect(
        connectionId: ConnectionId,
        opts?: { allowPrompt?: boolean },
    ) {
        if (connecting) return false;
        connecting = true;

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
        finally {
            connecting = false;
        }
    }

    async function disconnect(connectionId: ConnectionId) {
        if (runtime.connectionId !== connectionId) return;
        await teardownActiveConnection("manual disconnect");
    }

    async function deleteConnection(connectionId: ConnectionId) {
        if (runtime.connectionId === connectionId) {
            await teardownActiveConnection("delete connection");
        }

        connectionStore.deleteConnection(connectionId);
    }

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
