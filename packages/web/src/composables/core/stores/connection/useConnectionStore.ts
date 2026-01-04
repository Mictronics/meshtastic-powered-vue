import type { DBSchema } from "idb";
import {
    ConnectionStatus,
    ConnectionType,
    type INewConnection,
    type IConnection,
    type ConnectionId
} from "@/composables/core/stores/connection/types";
import {
    IDB_CONNECTION_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import { createSharedComposable } from '@vueuse/core'
import { ref } from "vue";
import { useRandomId } from "@/composables/core/useRandomId";
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import { useMessageStore } from "@/composables/core/stores/message/useMessageStore";
import { useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore";

export interface ConnectionsDatabase extends DBSchema {
    connections: {
        value: IConnection;
        key: number;
        indexes: { 'by-id': number };
    };
}

class Connection implements IConnection {
    id: ConnectionId;
    type: ConnectionType;
    name: string;
    createdAt: number;
    lastConnectedAt?: number;
    isDefault: boolean;
    status: ConnectionStatus;
    error?: string;
    meshDeviceId?: number;

    // Properties for the NewConnection union
    url: string;
    deviceId: string;
    deviceName: string;
    gattServiceUUID: string;
    usbVendorId: number;
    usbProductId: number;

    constructor() {
        this.id = 0;
        this.type = ConnectionType.Unknown;
        this.name = '';
        this.createdAt = 0;
        this.lastConnectedAt = 0;
        this.isDefault = false;
        this.status = ConnectionStatus.Disconnected;
        this.error = undefined;
        this.meshDeviceId = undefined;
        this.url = '';
        this.deviceId = '';
        this.deviceName = '';
        this.gattServiceUUID = '';
        this.usbVendorId = 0;
        this.usbProductId = 0;
    }

    set(obj: Partial<IConnection>) {
        Object.assign(this, obj);
    }

    get() {
        return Object.fromEntries(Object.entries(this));
    }

    createConnectionFromInput(input: INewConnection) {
        this.id = useRandomId();
        this.name = input.name;
        this.createdAt = Math.ceil(Date.now() / 1000);
        this.status = ConnectionStatus.Disconnected;

        if (input.type === ConnectionType.Http) {
            this.type = ConnectionType.Http;
            this.url = input.url;
            this.isDefault = false;
            this.name = input.name.length === 0 ? input.url : input.name;
        }
        else if (input.type === ConnectionType.Bluetooth) {
            this.type = ConnectionType.Bluetooth;
            this.deviceId = input.deviceId || '';
            this.deviceName = input.deviceName || '';
            this.gattServiceUUID = input.gattServiceUUID || '';
        }
        else if (input.type === ConnectionType.Serial) {
            this.type = ConnectionType.Serial;
            this.usbVendorId = input.usbVendorId || 0;
            this.usbProductId = input.usbProductId || 0;
        }
        else {
            this.type = ConnectionType.Unknown;
        }
    }
}

export const useConnectionStore = createSharedComposable(() => {
    const connections = ref<Map<number, IConnection>>(new Map());

    async function init() {
        connections.value = await getDatabaseConnections();
    }

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Connection Database Error', detail, life: 5000 });
    }

    async function addConnection(input: INewConnection) {
        const conn = new Connection();
        conn.createConnectionFromInput(input);
        try {
            const key = useIndexedDB().insertIntoStore(IDB_CONNECTION_STORE, conn);
            if (typeof key === 'number') {
                const stored = await useIndexedDB().getFromStore(IDB_CONNECTION_STORE, key);
                if (stored) {
                    // respect revived object
                    Object.assign(conn, stored as Partial<IConnection>);
                    conn.id = (stored as any).id ?? key;
                } else if (conn.id == null) {
                    conn.id = key;
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        connections.value.set(conn.id, conn);
        return conn;
    }

    async function getDatabaseConnections() {
        try {
            const all = await useIndexedDB().getAllFromStore(IDB_CONNECTION_STORE);
            // IndexedDB stores only Object data.
            // Ensure that we return a map of Device class instances.
            const connMap = new Map();
            all.forEach((value: any, key: any) => {
                const conn = new Connection();
                conn.set(value);
                connMap.set(key, conn);
            });
            return connMap;
        } catch (e: any) {
            toast('error', e.message);
        }
        return new Promise<Map<number, IConnection>>(() => { return new Map(); });
    }

    async function updateConnection(id: number, updates: Partial<IConnection>) {
        const conn = connections.value.get(id);
        try {
            if (conn) {
                for (const key in updates) {
                    if (Object.hasOwn(updates, key)) {
                        (conn as Record<string, unknown>)[key] =
                            updates[key as keyof typeof updates];
                    }
                }
                await useIndexedDB().updateStore(IDB_CONNECTION_STORE, (conn as any).get());
                if (conn.id != null) {
                    const stored = await useIndexedDB().getFromStore(IDB_CONNECTION_STORE, conn.id as any);
                    if (connections.value.has(conn.id))
                        (connections.value.get(conn.id) as any).set(stored);
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        return conn;
    }

    async function deleteConnection(id: number) {
        try {
            const conn = connections.value.get(id);
            if (conn) {
                const meshDeviceId = conn.meshDeviceId;
                if (meshDeviceId) {
                    await useMessageStore().deleteMessageStore(meshDeviceId)
                    await useNodeDBStore().deleteNodeDB(meshDeviceId)
                    await useDeviceStore().deleteDevice(meshDeviceId)
                }
                await useIndexedDB().deleteFromStore(IDB_CONNECTION_STORE, id);
                connections.value = await getDatabaseConnections();
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    function setDefaultConnection(id: number, isDefault = true) {
        for (const [key, value] of connections.value.entries()) {
            // Set isDefault to true for the specified entry and false for others
            if (key === id) {
                value.isDefault = isDefault;
            } else {
                value.isDefault = false;
            }
            updateConnection(key, { isDefault: value.isDefault });
        }
    };

    init();

    return {
        connections,
        addConnection,
        updateConnection,
        deleteConnection,
        setDefaultConnection,
    }
});
