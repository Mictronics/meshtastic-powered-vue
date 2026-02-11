import { create } from "@bufbuild/protobuf";
import { validateIncomingNode } from "@/composables/stores/nodeDB/nodeValidation";
import { Protobuf, type Types } from "@meshtastic/core";
import type { DBSchema } from "idb";
import {
    IDB_NODESDB_STORE,
    useIndexedDB
} from "@/composables/stores/indexedDB";
import type { NodeError, NodeErrorType, ProcessPacketParams } from "@/composables/stores/nodeDB/types";
import {
    createSharedComposable,
    watchThrottled,
} from '@vueuse/core'
import { ref, isReactive, toRaw, isProxy } from 'vue'
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';
import { purgeUncloneableProperties } from "@/composables/stores/utils/purgeUncloneable";

const NODE_RETENTION_DAYS = 14; // Remove nodes not heard from in 14 days

type NodeInfoExtented = Protobuf.Mesh.NodeInfo & {
    environmentMetrics?: Protobuf.Telemetry.EnvironmentMetrics;
    powerMetrics?: Protobuf.Telemetry.PowerMetrics;
    hostMetrics?: Protobuf.Telemetry.HostMetrics;
    airQualityMetrics?: Protobuf.Telemetry.AirQualityMetrics;
    localStats?: Protobuf.Telemetry.LocalStats;
}

type NodeMap = { [key: string]: NodeInfoExtented };
type NodeErrors = { [key: string]: NodeError };

export interface INodeDB {
    id: number;
    myNodeNum: number | undefined;
    nodeMap: NodeMap;
    nodeErrors: NodeErrors;

    addNode: (nodeInfo: Protobuf.Mesh.NodeInfo) => void;
    removeNode: (nodeNum: number) => void;
    removeAllNodes: (keepMyNode?: boolean) => void;
    pruneStaleNodes: () => number;
    processPacket: (data: ProcessPacketParams) => void;
    addUser: (user: Types.PacketMetadata<Protobuf.Mesh.User>) => void;
    addPosition: (position: Types.PacketMetadata<Protobuf.Mesh.Position>) => void;
    updateFavorite: (nodeNum: number, isFavorite: boolean) => void;
    updateIgnore: (nodeNum: number, isIgnored: boolean) => void;
    setNodeNum: (nodeNum: number) => void;
    setNodeError: (nodeNum: number, error: NodeErrorType) => void;
    clearNodeError: (nodeNum: number) => void;
    removeAllNodeErrors: () => void;

    getNodesLength: () => number;
    getNode: (nodeNum: number) => Protobuf.Mesh.NodeInfo | undefined;
    getNodes: (
        filter?: (node: Protobuf.Mesh.NodeInfo) => boolean,
        includeSelf?: boolean,
    ) => Protobuf.Mesh.NodeInfo[];
    getMyNode: () => Protobuf.Mesh.NodeInfo | undefined;

    getNodeError: (nodeNum: number) => NodeError | undefined;
    hasNodeError: (nodeNum: number) => boolean;
    setMetrics: (data: Types.PacketMetadata<Protobuf.Telemetry.Telemetry>) => void;
}

class NodeDB implements INodeDB {
    id: number;
    myNodeNum: number | undefined;
    nodeMap: NodeMap;
    nodeErrors: NodeErrors;

    constructor(id: number, data?: Partial<INodeDB>) {
        this.id = id;
        this.nodeMap = data?.nodeMap ?? {};
        this.nodeErrors = data?.nodeErrors ?? {};
        this.myNodeNum = data?.myNodeNum;
    }

    set(obj: Partial<INodeDB>) {
        Object.assign(this, obj);
    }

    get() {
        return Object.fromEntries(Object.entries(this));
    }

    addNode(node: Protobuf.Mesh.NodeInfo) {
        // Check if node already exists
        const existing = toRaw(this.nodeMap[node.num]);
        const isNew = !existing;

        // Use validation to check the new node before adding
        const next = validateIncomingNode(
            node,
            (nodeNum: number, err: NodeErrorType) => {
                this.setNodeError(nodeNum, err);
            },
            (filter?: (node: Protobuf.Mesh.NodeInfo) => boolean) =>
                this.getNodes(filter, true),
        );

        if (!next) {
            // Validation failed and error has been set inside validateIncomingNode
            return;
        }

        // Merge with existing node data if it exists
        let merged;
        if (existing) {
            // shallow clone into a new plain object without using spread
            merged = Object.assign({}, existing, next);
            // apply the nullish-coalescing fallbacks explicitly
            merged.user = next.user ?? existing.user;
            merged.position = next.position ?? existing.position;
            let ndm = next.deviceMetrics;
            let edm = existing.deviceMetrics;
            if (isProxy(ndm)) {
                ndm = toRaw(next.deviceMetrics);
            }
            if (isProxy(edm)) {
                edm = toRaw(existing.deviceMetrics);
            }
            merged.deviceMetrics = ndm ?? edm;
        } else {
            merged = next;
        }
        // Use the validated node's num to ensure consistency
        this.nodeMap[String(merged.num)] = merged;

        if (isNew) {
            console.log(
                `[NodeDB] Adding new node from NodeInfo packet: ${merged.num} (${merged.user?.longName || "unknown"})`,
            );
        }
        /* else {
            console.log(
                `[NodeDB] Updating existing node from NodeInfo packet: ${merged.num} (${merged.user?.longName || "unknown"})`,
            );
        }
        */
    };

    removeNode(nodeNum: number) {
        delete this.nodeMap[nodeNum];
    };

    removeAllNodes(keepMyNode?: boolean) {
        const newNodeMap: NodeMap = {};
        if (
            keepMyNode &&
            this.myNodeNum !== undefined &&
            Object(this.nodeMap).has(this.myNodeNum)
        ) {
            newNodeMap[this.myNodeNum] = this.nodeMap[this.myNodeNum] ?? create(Protobuf.Mesh.NodeInfoSchema);
        }
        this.nodeMap = newNodeMap;
    };

    pruneStaleNodes() {
        const nowSec = Math.floor(Date.now() / 1000);
        const cutoffSec = nowSec - NODE_RETENTION_DAYS * 24 * 60 * 60;
        let prunedCount = 0;
        const newNodeMap: NodeMap = {};
        for (const [nodeNum, node] of Object.entries(this.nodeMap)) {
            // Keep myNode regardless of lastHeard
            // Keep nodes that have been heard recently
            // Keep nodes without lastHeard (just in case)
            if (
                nodeNum === String(this.myNodeNum) ||
                !node.lastHeard ||
                node.lastHeard >= cutoffSec
            ) {
                newNodeMap[nodeNum] = node;
            } else {
                prunedCount++;
            }
        }
        this.nodeMap = newNodeMap;
        if (prunedCount > 0) {
            console.log(
                `[NodeDB] Pruned ${prunedCount} stale node(s) older than ${NODE_RETENTION_DAYS} days`,
            );
        }
        return prunedCount;
    };

    setNodeError(nodeNum: number, error: NodeErrorType) {
        let e: NodeErrorType;
        if (typeof error === 'number') {
            const enumName = (Protobuf.Mesh as any).Routing_Error?.[error];
            e = enumName ?? (error as any);
        } else {
            e = error;
        }
        this.nodeErrors[String(nodeNum)] = { node: nodeNum, error: e };
    }

    clearNodeError(nodeNum: number) {
        delete this.nodeErrors[nodeNum];
    };

    removeAllNodeErrors() {
        this.nodeErrors = {};
    };

    processPacket(data: ProcessPacketParams) {
        const node = toRaw(this.nodeMap[data.from]);
        const nowSec = Math.floor(Date.now() / 1000); // lastHeard is in seconds(!)
        if (node) {
            const updated = Object.assign({}, node, {
                lastHeard: data.time > 0 ? data.time : nowSec,
                snr: data.snr,
            });
            this.nodeMap[String(data.from)] = updated;
        } else {
            this.nodeMap[String(data.from)] = create(Protobuf.Mesh.NodeInfoSchema, {
                num: data.from,
                lastHeard: data.time > 0 ? data.time : nowSec, // fallback to now if time is 0 or negative,
                snr: data.snr,
            });
        }
    };

    addUser(user: Types.PacketMetadata<Protobuf.Mesh.User>) {
        const current = toRaw(this.nodeMap[user.from]);
        const isNew = !current;
        const base = current ?? create(Protobuf.Mesh.NodeInfoSchema);
        const updated = Object.assign({}, base, {
            user: user.data,
            num: user.from,
        });
        this.nodeMap[String(user.from)] = updated;
        if (isNew) {
            console.log(
                `[NodeDB] Adding new node from user packet: ${user.from} (${user.data.longName || "unknown"})`,
            );
        }
    };

    addPosition(position: Types.PacketMetadata<Protobuf.Mesh.Position>) {
        const current = toRaw(this.nodeMap[position.from]);
        const isNew = !current;
        const base = current ?? create(Protobuf.Mesh.NodeInfoSchema);
        const updated = Object.assign({}, base, {
            position: position.data,
            num: position.from,
        });
        this.nodeMap[String(position.from)] = updated;
        if (isNew) {
            console.log(
                `[NodeDB] Adding new node from position packet: ${position.from}`,
            );
        }
    };

    setNodeNum(nodeNum: number) {
        this.myNodeNum = nodeNum;
        useNodeDBStore().cleanNodeDBStore(this.id, this.myNodeNum);
    }

    updateFavorite(nodeNum: number, isFavorite: boolean) {
        const node = toRaw(this.nodeMap[nodeNum]);
        if (node) {
            this.nodeMap[String(nodeNum)] = Object.assign({}, node, { isFavorite });
        }
    };

    updateIgnore(nodeNum: number, isIgnored: boolean) {
        const node = toRaw(this.nodeMap[nodeNum]);
        if (node) {
            this.nodeMap[String(nodeNum)] = Object.assign({}, node, { isIgnored });
        }
    };

    getNodesLength() {
        return Object.entries(this.nodeMap).length;
    };

    getNode(nodeNum: number) {
        return this.nodeMap[nodeNum];
    };

    getNodes(filter?: ((node: Protobuf.Mesh.NodeInfo) => boolean), includeSelf?: boolean) {
        const all = Object.values(this.nodeMap || {}).filter(n =>
            includeSelf ? true : n.num !== this.myNodeNum
        );

        return filter ? all.filter(filter) : all;
    }

    getMyNode(): NodeInfoExtented | undefined {
        if (this.myNodeNum) {
            return (
                this.nodeMap[this.myNodeNum] ??
                create(Protobuf.Mesh.NodeInfoSchema)
            );
        }
    };

    getNodeError(nodeNum: number) {
        return this.nodeErrors[nodeNum];
    };

    hasNodeError(nodeNum: number) {
        return this.nodeErrors.hasOwnProperty(nodeNum) || false;
    }

    setMetrics(packet: Types.PacketMetadata<Protobuf.Telemetry.Telemetry>) {
        // Check if node already exists
        const existing = toRaw(this.nodeMap[packet.from]);
        if (!existing || packet.data.$typeName !== 'meshtastic.Telemetry') return;
        // Merge with existing node data if it exists
        const merged = Object.assign({}, existing);
        let metrics;
        const val = packet.data.variant.value;
        switch (packet.data.variant.case) {
            case 'deviceMetrics':
                metrics = existing.deviceMetrics;
                if (isProxy(metrics)) {
                    metrics = toRaw(existing.deviceMetrics);
                }
                merged.deviceMetrics = (val as Protobuf.Telemetry.DeviceMetrics) ?? metrics;
                break;
            case 'environmentMetrics':
                metrics = existing.environmentMetrics;
                if (isProxy(metrics)) {
                    metrics = toRaw(existing.environmentMetrics);
                }
                merged.environmentMetrics = (val as Protobuf.Telemetry.EnvironmentMetrics) ?? metrics;
                break;
            case 'powerMetrics':
                metrics = existing.powerMetrics;
                if (isProxy(metrics)) {
                    metrics = toRaw(existing.powerMetrics);
                }
                merged.powerMetrics = (val as Protobuf.Telemetry.PowerMetrics) ?? metrics;
                break;
            case 'hostMetrics':
                metrics = existing.hostMetrics;
                if (isProxy(metrics)) {
                    metrics = toRaw(existing.hostMetrics);
                }
                merged.hostMetrics = (val as Protobuf.Telemetry.HostMetrics) ?? metrics;
                break;
            case 'airQualityMetrics':
                metrics = existing.airQualityMetrics;
                if (isProxy(metrics)) {
                    metrics = toRaw(existing.airQualityMetrics);
                }
                merged.airQualityMetrics = (val as Protobuf.Telemetry.AirQualityMetrics) ?? metrics;
                break;
            case 'localStats':
                metrics = existing.localStats;
                if (isProxy(metrics)) {
                    metrics = toRaw(existing.localStats);
                }
                merged.localStats = (val as Protobuf.Telemetry.LocalStats) ?? metrics;
                break;
            default:
                return;
        }
        this.nodeMap[String(merged.num)] = merged;
    }
}

export const useNodeDBStore = createSharedComposable(() => {
    const nodeDatabase = ref<NodeDB>();

    loadAllNodeDBs();

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Nodes Database Error', detail, life: life || 6000 });
    }

    watchThrottled(nodeDatabase, (updated) => {
        // Write new value back into IndexedDB. Throttled to avoid writes on any change.
        if (isReactive(updated)) {
            updateNodeDB(toRaw(updated));
        }
    }, {
        deep: true,
        throttle: 3000
    })

    async function getNodeDB(nodeId: number) {
        if (nodeDatabase.value?.id === nodeId) {
            // Node database with id is already loaded.
            return nodeDatabase.value;
        }
        try {
            // Try to load node database with id from database
            const ndbObj = await useIndexedDB().getFromStore(IDB_NODESDB_STORE, nodeId);
            // IndexedDB stores only Object data.
            if (ndbObj) {
                nodeDatabase.value = new NodeDB(nodeId, ndbObj);
                return nodeDatabase.value;
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        // Not in database, create new one.
        return undefined;
    };

    async function addNodeDB(id: number) {
        if (nodeDatabase.value?.id === id) {
            // Node database with id already loaded
            return nodeDatabase.value;
        }
        // Try to load from database
        let db = await getNodeDB(id);
        if (db) {
            // found
            return nodeDatabase.value;
        }
        // Not in database, create new one
        db = new NodeDB(id);

        try {
            const key = await useIndexedDB().insertIntoStore(IDB_NODESDB_STORE, db);
            if (typeof key === 'number') {
                const stored = await useIndexedDB().getFromStore(IDB_NODESDB_STORE, key);
                if (stored) {
                    // IndexedDB stores only Object data.
                    // Keep class instance and just copy object data into.
                    db.set(stored);
                    if (!(db instanceof NodeDB)) {
                        throw new Error(`Added device is not an instance of NodeDB class.`);
                    }
                } else if (db.id == null) {
                    db.id = key;
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        // Prune stale nodes on creation
        db.pruneStaleNodes();
        nodeDatabase.value = db;
        return db;
    }

    async function updateNodeDB(db: NodeDB | undefined) {
        if (!db) return;
        const o = db.get();
        try {
            await useIndexedDB().updateStore(IDB_NODESDB_STORE, o);
        } catch (e: any) {
            toast('error', e.message);
            purgeUncloneableProperties(db);
        }
        return db;
    }

    async function deleteNodeDB(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_NODESDB_STORE, id);
            if (nodeDatabase.value?.id === id) {
                nodeDatabase.value = undefined;
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    async function cleanNodeDBStore(id: number, myNodeNum: number) {
        try {
            const nodeDBs = await useIndexedDB().getAllFromStore(IDB_NODESDB_STORE);
            if (nodeDBs) {
                for (const oldDB of nodeDBs) {
                    if (oldDB.id === id) continue;
                    if (oldDB.myNodeNum === myNodeNum) {
                        // Start with shallow clones of plain-object maps
                        const mergedNodes: NodeMap = Object.assign({}, oldDB.nodeMap || {});
                        const mergedErrors: NodeErrors = Object.assign({}, oldDB.nodeErrors || {});

                        const getNodesProxy = (filter?: (node: Protobuf.Mesh.NodeInfo) => boolean): Protobuf.Mesh.NodeInfo[] => {
                            const arr = Object.values(mergedNodes);
                            return filter ? arr.filter(filter) : arr;
                        };

                        const setErrorProxy = (n: number, err: NodeErrorType) => {
                            mergedErrors[String(n)] = { node: n, error: err };
                        };

                        // iterate newDB.nodeMap (plain object)
                        for (const [numStr, newNode] of Object.entries(nodeDatabase.value?.nodeMap || {})) {
                            const num = Number(numStr);
                            const next = validateIncomingNode(newNode as Protobuf.Mesh.NodeInfo, setErrorProxy, getNodesProxy);
                            if (next) {
                                mergedNodes[String(num)] = next;
                            }

                            const err = nodeDatabase.value?.getNodeError(num);
                            if (err && !oldDB.hasNodeError(num)) {
                                mergedErrors[String(num)] = err;
                            }
                        }

                        // finalize: assign plain objects into this (was Maps)
                        if (nodeDatabase.value) {
                            nodeDatabase.value.nodeMap = mergedNodes;
                            nodeDatabase.value.nodeErrors = mergedErrors;
                        }
                        await useNodeDBStore().deleteNodeDB(oldDB.id);
                    }
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    async function loadAllNodeDBs() {
        try {
            const all: NodeDB[] = await useIndexedDB().getAllFromStore(IDB_NODESDB_STORE);

            if (!all || all.length === 0) {
                return;
            }
            const preferred =
                all.values().find(db => db.myNodeNum !== undefined) ??
                all[all.length - 1];
            if (preferred) {
                nodeDatabase.value = new NodeDB(preferred.id, preferred);
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    return {
        nodeDatabase,
        addNodeDB,
        getNodeDB,
        updateNodeDB,
        deleteNodeDB,
        cleanNodeDBStore,
    }
});
