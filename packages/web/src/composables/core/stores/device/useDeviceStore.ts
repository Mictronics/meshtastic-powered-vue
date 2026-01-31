import { create, toBinary } from "@bufbuild/protobuf";
import type { DBSchema } from "idb";
import {
    IDB_DEVICE_STORE,
    useIndexedDB
} from "../indexedDB.ts";
import {
    ConnectionPhase,
    type ConnectionId,
} from "@/composables/core/stores/connection/types.ts";
import {
    type WaypointWithMetadata,
} from "@/composables/core/stores/device/types.ts";
import { type MeshDevice, Protobuf, Types } from "@meshtastic/core";
import { createSharedComposable, watchThrottled } from '@vueuse/core'
import { toRaw, isReactive, ref } from 'vue'
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import { useEvictOldestEntries } from "@/composables/core/stores/utils/useEvictOldestEntries.ts";
import { purgeUncloneableProperties } from "@/composables/core/stores/utils/purgeUncloneable";
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

export interface IDevice {
    id: number;
    myNodeNum: number | undefined;
    traceroutes: { [key: string]: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[] };
    waypoints: WaypointWithMetadata[];
    neighborInfo: { [key: string]: Protobuf.Mesh.NeighborInfo };
    status: Types.DeviceStatusEnum;
    connectionPhase: ConnectionPhase;
    connectionId: ConnectionId | null;
    channels: { [K in Types.ChannelNumber & (string | number)]: Protobuf.Channel.Channel };
    config: Protobuf.LocalOnly.LocalConfig;
    moduleConfig: Protobuf.LocalOnly.LocalModuleConfig;
    changeRegistry: ChangeRegistry; // Unified change tracking
    hardware: Protobuf.Mesh.MyNodeInfo;
    metadata: Protobuf.Mesh.DeviceMetadata;
    connection?: MeshDevice;
    activeNode: number;
    pendingSettingsChanges: boolean;
    messageDraft: string;
    unreadCounts: { [key: string]: number };
    clientNotifications: Protobuf.Mesh.ClientNotification[];

    set: (obj: Partial<IDevice>) => void;
    get: () => any;
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
    addMetadata: (metadata: Protobuf.Mesh.DeviceMetadata) => void;
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
    traceroutes: { [key: string]: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>[] };
    waypoints: WaypointWithMetadata[];
    neighborInfo: { [key: string]: Protobuf.Mesh.NeighborInfo };
    status: Types.DeviceStatusEnum;
    connectionPhase: ConnectionPhase;
    connectionId: ConnectionId | null;
    channels: { [K in Types.ChannelNumber & (string | number)]: Protobuf.Channel.Channel };
    config: Protobuf.LocalOnly.LocalConfig;
    moduleConfig: Protobuf.LocalOnly.LocalModuleConfig;
    changeRegistry: ChangeRegistry;
    hardware: Protobuf.Mesh.MyNodeInfo;
    metadata: Protobuf.Mesh.DeviceMetadata;
    connection?: MeshDevice;
    activeNode: number;
    pendingSettingsChanges: boolean;
    messageDraft: string;
    unreadCounts: { [key: string]: number };
    clientNotifications: Protobuf.Mesh.ClientNotification[];

    constructor(id: number, data?: Partial<IDevice>) {
        this.id = id;
        this.myNodeNum = data?.myNodeNum;
        this.traceroutes = data?.traceroutes ?? {};
        this.waypoints = data?.waypoints ?? [];
        this.neighborInfo = data?.neighborInfo ?? {};
        this.status = Types.DeviceStatusEnum.DeviceDisconnected;
        this.connectionPhase = ConnectionPhase.Disconnected;
        this.connectionId = null;
        this.channels = {
            0: create(Protobuf.Channel.ChannelSchema),
            1: create(Protobuf.Channel.ChannelSchema),
            2: create(Protobuf.Channel.ChannelSchema),
            3: create(Protobuf.Channel.ChannelSchema),
            4: create(Protobuf.Channel.ChannelSchema),
            5: create(Protobuf.Channel.ChannelSchema),
            6: create(Protobuf.Channel.ChannelSchema),
            7: create(Protobuf.Channel.ChannelSchema),
        };
        this.config = create(Protobuf.LocalOnly.LocalConfigSchema);
        this.moduleConfig = create(Protobuf.LocalOnly.LocalModuleConfigSchema);
        this.changeRegistry = createChangeRegistry();
        this.hardware = create(Protobuf.Mesh.MyNodeInfoSchema);
        this.metadata = create(Protobuf.Mesh.DeviceMetadataSchema);
        this.connection = undefined;
        this.activeNode = 0;
        this.pendingSettingsChanges = false;
        this.messageDraft = '';
        this.unreadCounts = {};
        this.clientNotifications = [];
    }

    // Set class properties from [IndexedDB] object
    set(obj: Partial<IDevice>) {
        Object.assign(this, obj);
    };

    get() {
        // Remove connection from this object. No need to stored in IndexedDB.
        const { ['connection']: _, ...rest } = Object.fromEntries(Object.entries(this)) as IDevice;
        return rest;
    };

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
        const workingValue = this.changeRegistry.changes[
            serializeKey({ type: "config", variant: payloadVariant }
            )]?.value as Protobuf.LocalOnly.LocalConfig[K] | undefined;

        return {
            ...this.config[payloadVariant],
            ...workingValue,
        };
    };

    getEffectiveModuleConfig<K extends ValidModuleConfigType>(payloadVariant: K,): Protobuf.LocalOnly.LocalModuleConfig[K] | undefined {
        const workingValue = this.changeRegistry.changes[
            serializeKey({ type: "moduleConfig", variant: payloadVariant })
        ]?.value as Protobuf.LocalOnly.LocalModuleConfig[K] | undefined;

        return {
            ...this.moduleConfig[payloadVariant],
            ...workingValue,
        };
    };

    setHardware(hardware: Protobuf.Mesh.MyNodeInfo) {
        this.myNodeNum = hardware.myNodeNum;
        this.hardware = hardware; // Always replace hardware with latest
        useDeviceStore().cleanDeviceStore(this.myNodeNum);
    };

    setPendingSettingsChanges(state: boolean) {
        this.pendingSettingsChanges = state;
    };

    addChannel(channel: Protobuf.Channel.Channel) {
        this.channels[channel.index as Types.ChannelNumber] = channel;
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

    addMetadata(metadata: Protobuf.Mesh.DeviceMetadata) {
        this.metadata = metadata;
    };

    addTraceRoute(traceroute: Types.PacketMetadata<Protobuf.Mesh.RouteDiscovery>) {
        const routes = this.traceroutes[traceroute.from] ?? [];
        routes.push(traceroute);
        this.traceroutes[traceroute.from] = routes;
        // Enforce retention limit, both in terms of targets (this.traceroutes) and routes per target (routes)
        useEvictOldestEntries(routes, TRACEROUTE_ROUTE_RETENTION_NUM);
        useEvictOldestEntries(this.traceroutes, TRACEROUTE_TARGET_RETENTION_NUM,);
    };

    setMessageDraft(message: string) {
        this.messageDraft = message;
    };

    incrementUnread(nodeNum: number) {
        const currentCount = this.unreadCounts[nodeNum] ?? 0;
        this.unreadCounts[nodeNum] = currentCount + 1;
    };

    getUnreadCount(nodeNum: number): number {
        return this.unreadCounts[nodeNum] ?? 0;
    };

    getAllUnreadCount(): number {
        let totalUnread = 0;
        Object.values(this.unreadCounts).forEach((count) => {
            totalUnread += count;
        });
        return totalUnread;
    };

    resetUnread(nodeNum: number) {
        this.unreadCounts[nodeNum] = 0;
        if (this.unreadCounts[nodeNum] === 0) {
            delete this.unreadCounts.nodeNum;
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
        this.neighborInfo[nodeId] = neighborInfo;
    };

    getNeighborInfo(nodeNum: number) {
        return this.neighborInfo[nodeNum];
    };

    // New unified change tracking methods
    setChange(key: ConfigChangeKey, value: unknown, originalValue?: unknown) {
        const keyStr = serializeKey(key);
        this.changeRegistry.changes[keyStr] = {
            key,
            value,
            originalValue,
            timestamp: Date.now(),
        };
    };

    removeChange(key: ConfigChangeKey) {
        delete this.changeRegistry.changes[serializeKey(key)];
    };

    hasChange(key: ConfigChangeKey) {
        return this.changeRegistry.changes.hasOwnProperty(serializeKey(key)) ?? false;
    };

    getChange(key: ConfigChangeKey) {
        return this.changeRegistry.changes[serializeKey(key)]?.value;
    };

    clearAllChanges() {
        this.changeRegistry.changes = {};
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

        this.changeRegistry.changes[keyStr] = {
            key: { type: "adminMessage", variant, id: messageId },
            value: message,
            timestamp: Date.now(),
        };
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
    const device = ref<IDevice>();

    watchThrottled(device, (updated) => {
        // Write new value back into IndexedDB. Throttled to avoid writes on any change.
        if (isReactive(updated)) {
            updateDevice(toRaw(updated));
        }
    }, {
        deep: true,
        throttle: 3000
    })

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Device Database Error', detail, life: life || 6000 });
    }

    async function getDeviceForConnection(connectionId: ConnectionId) {
        if (device.value?.connectionId === connectionId) {
            return device.value;
        }
        const all = await useIndexedDB().getAllFromStore(IDB_DEVICE_STORE);
        const devObj = ([...all] as IDevice[]).find(c => c.connectionId === connectionId);
        const dev = new Device(0);
        if (devObj) {
            dev.set(devObj);
            return dev;
        }
        return undefined;
    }

    async function getDevice(deviceId: number) {
        if (device.value?.id === deviceId) {
            // device with id is already loaded.
            return device.value;
        }
        try {
            // Try to load device with id from database
            const devObj = await useIndexedDB().getFromStore(IDB_DEVICE_STORE, deviceId);
            // IndexedDB stores only Object data.
            if (devObj) {
                device.value = new Device(deviceId, devObj);
                return device.value;
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        // Not in database, create new one.
        return undefined;
    }

    async function addDevice(id: number): Promise<IDevice | undefined> {
        if (device.value?.id === id) {
            // Device with id already loaded
            return device.value;
        }
        // Try to load from database
        let dev = await getDevice(id);
        if (dev) {
            // found
            return device.value;
        }
        // Not in database, create new one
        dev = new Device(id);

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
        } catch (e: any) {
            toast('error', e.message);
        }
        device.value = dev;
        return dev;
    }

    async function updateDevice(dev: IDevice | undefined) {
        if (!dev) return;
        try {
            const o = dev.get();
            await useIndexedDB().updateStore(IDB_DEVICE_STORE, o);
        } catch (e: any) {
            toast('error', e.message);
            purgeUncloneableProperties(dev);
        }
        device.value = dev;
        return dev;
    }

    async function deleteDevice(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_DEVICE_STORE, id);
            if (device.value?.id === id) {
                device.value = undefined;
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    async function cleanDeviceStore(myNodeNum: number) {
        try {
            const devs = await useIndexedDB().getAllFromStore(IDB_DEVICE_STORE);
            if (device.value) {
                for (const [otherId, otherDev] of devs) {
                    if (otherId === device.value.id || otherDev.myNodeNum !== myNodeNum) {
                        continue;
                    }
                    device.value.traceroutes = otherDev.traceroutes;
                    device.value.neighborInfo = otherDev.neighborInfo;
                    // Take this opportunity to remove stale waypoints
                    device.value.waypoints = otherDev.waypoints.filter(
                        (waypoint: WaypointWithMetadata) => !waypoint?.expire || waypoint.expire > Date.now(),
                    );
                    // Drop old device
                    await deleteDevice(otherId);
                }
            }
            // Trim device store from the front (assuming oldest entries are at the start)
            while (devs.length > DEVICESTORE_RETENTION_NUM) {
                const first: IDevice = devs.shift();
                deleteDevice(first.id);
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    return {
        device,
        addDevice,
        getDevice,
        updateDevice,
        deleteDevice,
        getDeviceForConnection,
        cleanDeviceStore
    }
});
