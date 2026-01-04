import { create, toBinary } from "@bufbuild/protobuf";
import type { DBSchema } from "idb";
import {
    IDB_DEVICE_STORE,
    useIndexedDB
} from "../indexedDB.ts";
import { useConnectionStore } from "@/composables/core/stores/connection/useConnectionStore.ts";
import {
    ConnectionPhase,
    type ConnectionId,
} from "@/composables/core/stores/connection/types.ts";
import {
    type WaypointWithMetadata,
    type Dialogs,
    type DialogVariant,
} from "@/composables/core/stores/device/types.ts";
import { type MeshDevice, Protobuf, Types } from "@meshtastic/core";
import { createSharedComposable } from '@vueuse/core'
import { shallowRef } from 'vue'
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import { useEvictOldestEntries } from "@/composables/core/stores/utils/useEvictOldestEntries.ts";
import {
    type ChangeRegistry,
    type ConfigChangeKey,
    type ValidConfigType,
    type ValidModuleConfigType,
    createChangeRegistry,
    getAdminMessageChangeCount,
    getAllAdminMessages,
    getAllChannelChanges,
    getAllConfigChanges,
    getAllModuleConfigChanges,
    getChannelChangeCount,
    getConfigChangeCount,
    getModuleConfigChangeCount,
    hasChannelChange,
    hasConfigChange,
    hasModuleConfigChange,
    hasUserChange,
    serializeKey,
} from "@/composables/core/stores/device/changeRegistry.ts";

const DEVICESTORE_RETENTION_NUM = 10;
const TRACEROUTE_TARGET_RETENTION_NUM = 100; // Number of traceroutes targets to keep
const TRACEROUTE_ROUTE_RETENTION_NUM = 100; // Number of traceroutes to keep per target
const WAYPOINT_RETENTION_NUM = 100;

type IDeviceData = {
    id: number;
    myNodeNum: number | undefined;
    traceroutes: Map<number, Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[]>;
    waypoints: WaypointWithMetadata[];
    neighborInfo: Map<number, Protobuf.Mesh.NeighborInfo>;
};

export interface IDevice extends IDeviceData {
    status: Types.DeviceStatusEnum;
    connectionPhase: ConnectionPhase;
    connectionId: ConnectionId | null;
    channels: Map<Types.ChannelNumber, Protobuf.Channel.Channel>;
    config: Protobuf.LocalOnly.LocalConfig;
    moduleConfig: Protobuf.LocalOnly.LocalModuleConfig;
    changeRegistry: ChangeRegistry; // Unified change tracking
    hardware: Protobuf.Mesh.MyNodeInfo;
    metadata: Map<number, Protobuf.Mesh.DeviceMetadata>;
    connection?: MeshDevice;
    activeNode: number;
    pendingSettingsChanges: boolean;
    messageDraft: string;
    unreadCounts: Map<number, number>;
    dialog: Dialogs;
    clientNotifications: Protobuf.Mesh.ClientNotification[];

    setStatus: (status: Types.DeviceStatusEnum) => void;
    setConnectionPhase: (phase: ConnectionPhase) => void;
    setConnectionId: (id: ConnectionId | null) => void;
    setConfig: (config: Protobuf.Config.Config) => void;
    setModuleConfig: (config: Protobuf.ModuleConfig.ModuleConfig) => void;
    getEffectiveConfig<K extends ValidConfigType>(
        payloadVariant: K,
    ): Protobuf.LocalOnly.LocalConfig[K] | undefined;
    getEffectiveModuleConfig<K extends ValidModuleConfigType>(
        payloadVariant: K,
    ): Protobuf.LocalOnly.LocalModuleConfig[K] | undefined;
    setHardware: (hardware: Protobuf.Mesh.MyNodeInfo) => void;
    setActiveNode: (node: number) => void;
    setPendingSettingsChanges: (state: boolean) => void;
    addChannel: (channel: Protobuf.Channel.Channel) => void;
    addWaypoint: (
        waypoint: Protobuf.Mesh.Waypoint,
        channel: Types.ChannelNumber,
        from: number,
        rxTime: Date,
    ) => void;
    removeWaypoint: (waypointId: number, toMesh: boolean) => Promise<void>;
    getWaypoint: (waypointId: number) => WaypointWithMetadata | undefined;
    addConnection: (connection: MeshDevice) => void;
    addTraceRoute: (
        traceroute: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>,
    ) => void;
    addMetadata: (from: number, metadata: Protobuf.Mesh.DeviceMetadata) => void;
    setDialogOpen: (dialog: DialogVariant, open: boolean) => void;
    getDialogOpen: (dialog: DialogVariant) => boolean;
    setMessageDraft: (message: string) => void;
    incrementUnread: (nodeNum: number) => void;
    resetUnread: (nodeNum: number) => void;
    getUnreadCount: (nodeNum: number) => number;
    getAllUnreadCount: () => number;
    sendAdminMessage: (message: Protobuf.Admin.AdminMessage) => void;
    addClientNotification: (
        clientNotificationPacket: Protobuf.Mesh.ClientNotification,
    ) => void;
    removeClientNotification: (index: number) => void;
    getClientNotification: (
        index: number,
    ) => Protobuf.Mesh.ClientNotification | undefined;
    addNeighborInfo: (
        nodeNum: number,
        neighborInfo: Protobuf.Mesh.NeighborInfo,
    ) => void;
    getNeighborInfo: (nodeNum: number) => Protobuf.Mesh.NeighborInfo | undefined;

    // New unified change tracking methods
    setChange: (
        key: ConfigChangeKey,
        value: unknown,
        originalValue?: unknown,
    ) => void;
    removeChange: (key: ConfigChangeKey) => void;
    hasChange: (key: ConfigChangeKey) => boolean;
    getChange: (key: ConfigChangeKey) => unknown | undefined;
    clearAllChanges: () => void;
    hasConfigChange: (variant: ValidConfigType) => boolean;
    hasModuleConfigChange: (variant: ValidModuleConfigType) => boolean;
    hasChannelChange: (index: Types.ChannelNumber) => boolean;
    hasUserChange: () => boolean;
    getConfigChangeCount: () => number;
    getModuleConfigChangeCount: () => number;
    getChannelChangeCount: () => number;
    getAllConfigChanges: () => Protobuf.Config.Config[];
    getAllModuleConfigChanges: () => Protobuf.ModuleConfig.ModuleConfig[];
    getAllChannelChanges: () => Protobuf.Channel.Channel[];
    queueAdminMessage: (message: Protobuf.Admin.AdminMessage) => void;
    getAllQueuedAdminMessages: () => Protobuf.Admin.AdminMessage[];
    getAdminMessageChangeCount: () => number;
}

export interface DevicesDatabase extends DBSchema {
    devices: {
        value: IDevice;
        key: number;
        indexes: { 'by-id': number };
    };
}

class Device implements IDevice {
    id: number;
    myNodeNum: number | undefined;
    traceroutes: Map<number, Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[]>;
    waypoints: WaypointWithMetadata[];
    neighborInfo: Map<number, Protobuf.Mesh.NeighborInfo>;
    status: Types.DeviceStatusEnum;
    connectionPhase: ConnectionPhase;
    connectionId: ConnectionId | null;
    channels: Map<Types.ChannelNumber, Protobuf.Channel.Channel>;
    config: Protobuf.LocalOnly.LocalConfig;
    moduleConfig: Protobuf.LocalOnly.LocalModuleConfig;
    changeRegistry: ChangeRegistry;
    hardware: Protobuf.Mesh.MyNodeInfo;
    metadata: Map<number, Protobuf.Mesh.DeviceMetadata>;
    connection?: MeshDevice;
    activeNode: number;
    pendingSettingsChanges: boolean;
    messageDraft: string;
    unreadCounts: Map<number, number>;
    dialog: Dialogs;
    clientNotifications: Protobuf.Mesh.ClientNotification[];

    constructor(id: number, data?: Partial<IDeviceData>) {
        this.id = id;
        this.myNodeNum = data?.myNodeNum;
        this.traceroutes = data?.traceroutes ??
            new Map<number, Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[]>();
        this.waypoints = data?.waypoints ?? [];
        this.neighborInfo = data?.neighborInfo ?? new Map<number, Protobuf.Mesh.NeighborInfo>();
        this.status = Types.DeviceStatusEnum.DeviceDisconnected;
        this.connectionPhase = ConnectionPhase.Disconnected;
        this.connectionId = null;
        this.channels = new Map();
        this.config = create(Protobuf.LocalOnly.LocalConfigSchema);
        this.moduleConfig = create(Protobuf.LocalOnly.LocalModuleConfigSchema);
        this.changeRegistry = createChangeRegistry();
        this.hardware = create(Protobuf.Mesh.MyNodeInfoSchema);
        this.metadata = new Map();
        this.connection = undefined;
        this.activeNode = 0;
        this.pendingSettingsChanges = false;
        this.messageDraft = '';
        this.unreadCounts = new Map();
        this.dialog = {
            import: false,
            QR: false,
            shutdown: false,
            reboot: false,
            deviceName: false,
            nodeRemoval: false,
            pkiBackup: false,
            nodeDetails: false,
            unsafeRoles: false,
            refreshKeys: false,
            deleteMessages: false,
            managedMode: false,
            clientNotification: false,
            resetNodeDb: false,
            clearAllStores: false,
            factoryResetDevice: false,
            factoryResetConfig: false,
        };
        this.clientNotifications = [];
    }

    set(obj: Partial<Device>) {
        Object.assign(this, obj);
    }

    setStatus(status: Types.DeviceStatusEnum) {
        this.status = status;
    };

    setConnectionPhase(phase: ConnectionPhase) {
        this.connectionPhase = phase;
    };

    setConnectionId(connectionId: ConnectionId | null) {
        this.connectionId = connectionId
    };

    setConfig(config: Protobuf.Config.Config) {
        switch (config.payloadVariant.case) {
            case "device": {
                this.config.device = config.payloadVariant.value;
                break;
            }
            case "position": {
                this.config.position = config.payloadVariant.value;
                break;
            }
            case "power": {
                this.config.power = config.payloadVariant.value;
                break;
            }
            case "network": {
                this.config.network = config.payloadVariant.value;
                break;
            }
            case "display": {
                this.config.display = config.payloadVariant.value;
                break;
            }
            case "lora": {
                this.config.lora = config.payloadVariant.value;
                break;
            }
            case "bluetooth": {
                this.config.bluetooth = config.payloadVariant.value;
                break;
            }
            case "security": {
                this.config.security = config.payloadVariant.value;
            }
        }
    };

    setModuleConfig(config: Protobuf.ModuleConfig.ModuleConfig) {
        switch (config.payloadVariant.case) {
            case "mqtt": {
                this.moduleConfig.mqtt = config.payloadVariant.value;
                break;
            }
            case "serial": {
                this.moduleConfig.serial = config.payloadVariant.value;
                break;
            }
            case "externalNotification": {
                this.moduleConfig.externalNotification =
                    config.payloadVariant.value;
                break;
            }
            case "storeForward": {
                this.moduleConfig.storeForward = config.payloadVariant.value;
                break;
            }
            case "rangeTest": {
                this.moduleConfig.rangeTest = config.payloadVariant.value;
                break;
            }
            case "telemetry": {
                this.moduleConfig.telemetry = config.payloadVariant.value;
                break;
            }
            case "cannedMessage": {
                this.moduleConfig.cannedMessage = config.payloadVariant.value;
                break;
            }
            case "audio": {
                this.moduleConfig.audio = config.payloadVariant.value;
                break;
            }
            case "neighborInfo": {
                this.moduleConfig.neighborInfo = config.payloadVariant.value;
                break;
            }
            case "ambientLighting": {
                this.moduleConfig.ambientLighting =
                    config.payloadVariant.value;
                break;
            }
            case "detectionSensor": {
                this.moduleConfig.detectionSensor =
                    config.payloadVariant.value;
                break;
            }
            case "paxcounter": {
                this.moduleConfig.paxcounter = config.payloadVariant.value;
                break;
            }
        }
    };

    getEffectiveConfig<K extends ValidConfigType>(payloadVariant: K): Protobuf.LocalOnly.LocalConfig[K] | undefined {
        if (!payloadVariant) {
            return;
        }
        const workingValue = this.changeRegistry.changes.get(
            serializeKey({ type: "config", variant: payloadVariant }),
        )?.value as Protobuf.LocalOnly.LocalConfig[K] | undefined;

        return {
            ...this.config[payloadVariant],
            ...workingValue,
        };
    };

    getEffectiveModuleConfig<K extends ValidModuleConfigType>(payloadVariant: K,): Protobuf.LocalOnly.LocalModuleConfig[K] | undefined {
        const workingValue = this.changeRegistry.changes.get(
            serializeKey({ type: "moduleConfig", variant: payloadVariant }),
        )?.value as Protobuf.LocalOnly.LocalModuleConfig[K] | undefined;

        return {
            ...this.moduleConfig[payloadVariant],
            ...workingValue,
        };
    };

    setHardware(hardware: Protobuf.Mesh.MyNodeInfo) {
        this.myNodeNum = hardware.myNodeNum;
        this.hardware = hardware; // Always replace hardware with latest
        for (const [otherId, oldStore] of useDeviceStore().devices.value) {
            if (otherId === this.id || oldStore.myNodeNum !== hardware.myNodeNum) {
                continue;
            }
            this.traceroutes = oldStore.traceroutes;
            this.neighborInfo = oldStore.neighborInfo;

            // Take this opportunity to remove stale waypoints
            this.waypoints = oldStore.waypoints.filter(
                (waypoint) => !waypoint?.expire || waypoint.expire > Date.now(),
            );

            // Drop old device
            useDeviceStore().deleteDevice(otherId);
        }
    };

    setPendingSettingsChanges(state: boolean) {
        this.pendingSettingsChanges = state;
    };

    addChannel(channel: Protobuf.Channel.Channel) {
        this.channels.set(channel.index, channel);
    };

    addWaypoint(waypoint: any, channel: any, from: any, rxTime: any) {
        const index = this.waypoints.findIndex(
            (wp) => wp.id === waypoint.id,
        );

        if (index !== -1) {
            const created =
                this.waypoints[index]?.metadata.created ?? new Date();
            const updatedWaypoint = {
                ...waypoint,
                metadata: { created, updated: rxTime, from, channel },
            };

            // Remove existing waypoint
            this.waypoints.splice(index, 1);

            // Push new if no expiry or not expired
            if (waypoint.expire === 0 || waypoint.expire > Date.now()) {
                this.waypoints.push(updatedWaypoint);
            }
        } else if (
            // only add if set to never expire or not already expired
            waypoint.expire === 0 ||
            (waypoint.expire !== 0 && waypoint.expire < Date.now())
        ) {
            this.waypoints.push({
                ...waypoint,
                metadata: { created: rxTime, from, channel },
            });
        }

        // Enforce retention limit
        useEvictOldestEntries(this.waypoints, WAYPOINT_RETENTION_NUM);
    };

    async removeWaypoint(waypointId: number, toMesh: boolean) {
        const waypoint = this.waypoints.find((wp) => wp.id === waypointId);
        if (!waypoint) {
            return;
        }

        if (toMesh) {
            if (!this.connection) {
                return;
            }
            const waypointToBroadcast = create(Protobuf.Mesh.WaypointSchema, {
                id: waypoint.id, // Bare minimum to delete a waypoint
                lockedTo: 0,
                name: "",
                description: "",
                icon: 0,
                expire: 1,
            });
            await this.connection.sendWaypoint(
                waypointToBroadcast,
                "broadcast",
                waypoint.metadata.channel,
            );
        }
        // Remove from store
        const idx = this.waypoints.findIndex(
            (waypoint) => waypoint.id === waypointId,
        );
        if (idx >= 0) {
            this.waypoints.splice(idx, 1);
        }
    };

    getWaypoint(waypointId: number) {
        return this.waypoints.find((waypoint) => waypoint.id === waypointId);
    };

    setActiveNode(node: number) {
        this.activeNode = node;
    };

    addConnection(connection?: MeshDevice) {
        this.connection = connection;
    };

    addMetadata(from: number, metadata: Protobuf.Mesh.DeviceMetadata) {
        this.metadata.set(from, metadata);
    };

    addTraceRoute(traceroute: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>) {
        const routes = this.traceroutes.get(traceroute.from) ?? [];
        routes.push(traceroute);
        this.traceroutes.set(traceroute.from, routes);
        // Enforce retention limit, both in terms of targets (this.traceroutes) and routes per target (routes)
        useEvictOldestEntries(routes, TRACEROUTE_ROUTE_RETENTION_NUM);
        useEvictOldestEntries(this.traceroutes, TRACEROUTE_TARGET_RETENTION_NUM,);
    };

    setDialogOpen(dialog: DialogVariant, open: boolean) {
        this.dialog[dialog] = open;
    };

    getDialogOpen(dialog: DialogVariant) {
        return this.dialog[dialog];
    };

    setMessageDraft(message: string) {
        this.messageDraft = message;
    };

    incrementUnread(nodeNum: number) {
        const currentCount = this.unreadCounts.get(nodeNum) ?? 0;
        this.unreadCounts.set(nodeNum, currentCount + 1);
    };

    getUnreadCount(nodeNum: number): number {
        return this.unreadCounts.get(nodeNum) ?? 0;
    };

    getAllUnreadCount(): number {
        let totalUnread = 0;
        this.unreadCounts.forEach((count) => {
            totalUnread += count;
        });
        return totalUnread;
    };

    resetUnread(nodeNum: number) {
        this.unreadCounts.set(nodeNum, 0);
        if (this.unreadCounts.get(nodeNum) === 0) {
            this.unreadCounts.delete(nodeNum);
        }

    };

    sendAdminMessage(message: Protobuf.Admin.AdminMessage) {
        this.connection?.sendPacket(
            toBinary(Protobuf.Admin.AdminMessageSchema, message),
            Protobuf.Portnums.PortNum.ADMIN_APP,
            "self",
        );
    };

    addClientNotification(clientNotificationPacket: Protobuf.Mesh.ClientNotification) {

        this.clientNotifications.push(clientNotificationPacket);

    };

    removeClientNotification(index: number) {
        this.clientNotifications.splice(index, 1);
    };

    getClientNotification(index: number) {
        return this.clientNotifications[index];
    };

    addNeighborInfo(nodeId: number, neighborInfo: Protobuf.Mesh.NeighborInfo) {
        // Replace any existing neighbor info for this nodeId
        this.neighborInfo.set(nodeId, neighborInfo);
    };

    getNeighborInfo(nodeNum: number) {
        return this.neighborInfo.get(nodeNum);
    };

    // New unified change tracking methods
    setChange(key: ConfigChangeKey, value: unknown, originalValue?: unknown) {
        const keyStr = serializeKey(key);
        this.changeRegistry.changes.set(keyStr, {
            key,
            value,
            originalValue,
            timestamp: Date.now(),
        });
    };

    removeChange(key: ConfigChangeKey) {
        this.changeRegistry.changes.delete(serializeKey(key));
    };

    hasChange(key: ConfigChangeKey) {
        return this.changeRegistry.changes.has(serializeKey(key)) ?? false;
    };

    getChange(key: ConfigChangeKey) {
        return this.changeRegistry.changes.get(serializeKey(key))?.value;
    };

    clearAllChanges() {
        this.changeRegistry.changes.clear();
    };

    hasConfigChange(variant: ValidConfigType) {
        return hasConfigChange(this.changeRegistry, variant);
    };

    hasModuleConfigChange(variant: ValidModuleConfigType) {
        return hasModuleConfigChange(this.changeRegistry, variant);
    };

    hasChannelChange(index: Types.ChannelNumber) {
        return hasChannelChange(this.changeRegistry, index);
    };

    hasUserChange() {
        return hasUserChange(this.changeRegistry);
    };

    getConfigChangeCount() {
        return getConfigChangeCount(this.changeRegistry);
    };

    getModuleConfigChangeCount() {
        return getModuleConfigChangeCount(this.changeRegistry);
    };

    getChannelChangeCount() {
        return getChannelChangeCount(this.changeRegistry);
    };

    getAllConfigChanges() {
        const changes = getAllConfigChanges(this.changeRegistry);
        return changes
            .map((entry) => {
                if (entry.key.type !== "config") {
                    return null;
                }
                if (!entry.value) {
                    return null;
                }
                return create(Protobuf.Config.ConfigSchema, {
                    payloadVariant: {
                        case: entry.key.variant,
                        value: entry.value,
                    },
                });
            })
            .filter((c): c is Protobuf.Config.Config => c !== null);
    };

    getAllModuleConfigChanges() {
        const changes = getAllModuleConfigChanges(this.changeRegistry);
        return changes
            .map((entry) => {
                if (entry.key.type !== "moduleConfig") {
                    return null;
                }
                if (!entry.value) {
                    return null;
                }
                return create(Protobuf.ModuleConfig.ModuleConfigSchema, {
                    payloadVariant: {
                        case: entry.key.variant,
                        value: entry.value,
                    },
                });
            })
            .filter((c): c is Protobuf.ModuleConfig.ModuleConfig => c !== null);
    };

    getAllChannelChanges() {
        const changes = getAllChannelChanges(this.changeRegistry);
        return changes
            .map((entry) => entry.value as Protobuf.Channel.Channel)
            .filter((c): c is Protobuf.Channel.Channel => c !== undefined);
    };

    queueAdminMessage(message: Protobuf.Admin.AdminMessage) {
        // Generate a unique ID for this admin message
        const messageId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        // Determine the variant type
        const variant =
            message.payloadVariant.case === "setFixedPosition"
                ? "setFixedPosition"
                : "other";

        const keyStr = serializeKey({
            type: "adminMessage",
            variant,
            id: messageId,
        });

        this.changeRegistry.changes.set(keyStr, {
            key: { type: "adminMessage", variant, id: messageId },
            value: message,
            timestamp: Date.now(),
        });
    };

    getAllQueuedAdminMessages() {
        const changes = getAllAdminMessages(this.changeRegistry);
        return changes
            .map((entry) => entry.value as Protobuf.Admin.AdminMessage)
            .filter((m): m is Protobuf.Admin.AdminMessage => m !== undefined);
    };

    getAdminMessageChangeCount() {
        return getAdminMessageChangeCount(this.changeRegistry);
    };
};

export const useDeviceStore = createSharedComposable(() => {
    const devices = shallowRef<Map<number, Device>>(new Map());
    const activeConnectionId = shallowRef<ConnectionId | null>(null);

    async function init() {
        devices.value = await getDatabaseDevices();
    }

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Device Database Error', detail, life });
    }

    function getConnectionForDevice(deviceId: number) {
        return [...useConnectionStore().connections.value.values()].find(c => c.meshDeviceId === deviceId);
    };

    function getDeviceForConnection(id: number) {
        const connection = useConnectionStore().connections.value.get(id);
        if (!connection?.meshDeviceId) {
            return undefined;
        }
        return devices.value.get(connection.meshDeviceId);
    };

    function getDevices() {
        return devices.value;
    };

    function getDevice(id: number) {
        return devices.value.get(id);
    };

    async function getDatabaseDevices() {
        try {
            const all = await useIndexedDB().getAllFromStore(IDB_DEVICE_STORE);
            // IndexedDB stores only Object data.
            // Ensure that we return a map of Device class instances.
            const deviceMap = new Map();
            all.forEach((value: any, key: any) => {
                const device = new Device(key, value);
                deviceMap.set(key, device);
            });
            return deviceMap;
        } catch (e: any) {
            toast('error', e.message);
        }
        return new Promise<Map<number, Device>>(() => { return new Map(); });
    }

    async function addDevice(id: number): Promise<IDevice | undefined> {
        const existing = await getDevice(id);
        if (existing) {
            return existing;
        }

        const dev = new Device(id);
        const draft = new Map(devices.value);
        draft.set(id, dev);
        useEvictOldestEntries(draft, DEVICESTORE_RETENTION_NUM);
        devices.value = draft;

        try {
            const key = await useIndexedDB().insertIntoStore(IDB_DEVICE_STORE, dev);
            if (typeof key === 'number') {
                const stored = await useIndexedDB().getFromStore(IDB_DEVICE_STORE, key);
                if (stored) {
                    // IndexedDB stores only Object data.
                    // Keep class instance and just copy object data into.
                    dev.set(stored);
                    if (!(dev instanceof Device)) {
                        throw new Error(`Added device is not an instance of Device class.`);
                    }
                } else if (dev.id == null) {
                    dev.id = key;
                }
            }
            devices.value.set(id, dev);
        } catch (e: any) {
            toast('error', e.message);
        }
        return devices.value.get(id);
    }

    async function updateDevice(dev: Device) {
        try {
            await useIndexedDB().updateStore(IDB_DEVICE_STORE, dev);
            // reload revived value from the DB
            if (dev.id != null) {
                const stored = await useIndexedDB().getFromStore(IDB_DEVICE_STORE, dev.id as any);
                if (devices.value.has(dev.id))
                    devices.value.get(dev.id)?.set(stored);
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        return dev;
    }

    async function deleteDevice(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_DEVICE_STORE, id);
            devices.value.delete(id);
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    function getActiveConnectionId() {
        return activeConnectionId.value;
    };

    function getActiveConnection() {
        if (!activeConnectionId.value) {
            return undefined;
        }
        return useConnectionStore().connections.value.get(activeConnectionId.value);
    };

    function setActiveConnectionId(id: number) {
        activeConnectionId.value = id;
    };

    init();

    return {
        devices,
        addDevice,
        getDevices,
        getDevice,
        updateDevice,
        deleteDevice,
        getConnectionForDevice,
        getDeviceForConnection,
        getActiveConnectionId,
        setActiveConnectionId,
        getActiveConnection
    }
});
