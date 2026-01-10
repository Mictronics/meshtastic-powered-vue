import { create } from "@bufbuild/protobuf";
import { validateIncomingNode } from "@/composables/core/stores/nodeDB/nodeValidation";
import { Protobuf, type Types } from "@meshtastic/core";
import type { DBSchema } from "idb";
import {
    IDB_NODESDB_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import type { NodeError, NodeErrorType, ProcessPacketParams } from "@/composables/core/stores/nodeDB/types";
import { createSharedComposable } from '@vueuse/core'
import { shallowRef } from 'vue'
import { useGlobalToast, type ToastSeverity } from '@/composables/useGlobalToast';

const NODE_RETENTION_DAYS = 14; // Remove nodes not heard from in 14 days

type NodeMap = { [key: string]: Protobuf.Mesh.NodeInfo };
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
}
/*
export interface nodeDBState {
    addNodeDB: (id: number) => NodeDB;
    removeNodeDB: (id: number) => void;
    getNodeDBs: () => NodeDB[];
    getNodeDB: (id: number) => NodeDB | undefined;
}
*/
export interface NodeDatabase extends DBSchema {
    devices: {
        value: INodeDB;
        key: number;
        indexes: { 'by-id': number };
    };
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

    set(obj: Partial<NodeDB>) {
        Object.assign(this, obj);
    }

    addNode(node: Protobuf.Mesh.NodeInfo) {
        // Check if node already exists
        const existing = this.nodeMap[node.num];
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
        const merged = existing
            ? {
                ...existing,
                ...next,
                // Preserve existing fields if new node doesn't have them
                user: next.user ?? existing.user,
                position: next.position ?? existing.position,
                deviceMetrics: next.deviceMetrics ?? existing.deviceMetrics,
            }
            : next;

        // Use the validated node's num to ensure consistency
        this.nodeMap = { ...(this.nodeMap || {}), [String(merged.num)]: merged };

        if (isNew) {
            console.log(
                `[NodeDB] Adding new node from NodeInfo packet: ${merged.num} (${merged.user?.longName || "unknown"})`,
            );
        } else {
            console.log(
                `[NodeDB] Updating existing node from NodeInfo packet: ${merged.num} (${merged.user?.longName || "unknown"})`,
            );
        }
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
        for (const [nodeNum, node] of Object(this.nodeMap).entries()) {
            // Keep myNode regardless of lastHeard
            // Keep nodes that have been heard recently
            // Keep nodes without lastHeard (just in case)
            if (
                nodeNum === this.myNodeNum ||
                !node.lastHeard ||
                node.lastHeard >= cutoffSec
            ) {
                newNodeMap[nodeNum] = node;
            } else {
                prunedCount++;
                console.log(
                    `[NodeDB] Pruning stale node ${nodeNum} (last heard ${Math.floor((nowSec - node.lastHeard) / 86400)} days ago)`,
                );
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
        this.nodeErrors = {};
        this.nodeErrors[nodeNum] = {
            node: nodeNum,
            error,
        };
    };

    clearNodeError(nodeNum: number) {
        delete this.nodeErrors[nodeNum];
    };

    removeAllNodeErrors() {
        this.nodeErrors = {};
    };

    processPacket(data: ProcessPacketParams) {
        const node = this.nodeMap[data.from];
        const nowSec = Math.floor(Date.now() / 1000); // lastHeard is in seconds(!)
        if (node) {
            const updated = {
                ...node,
                lastHeard: data.time > 0 ? data.time : nowSec,
                snr: data.snr,
            };
            this.nodeMap = { ...(this.nodeMap || {}), [String(data.from)]: updated };
        } else {
            this.nodeMap = {
                ...(this.nodeMap || {}), [String(data.from)]: create(Protobuf.Mesh.NodeInfoSchema, {
                    num: data.from,
                    lastHeard: data.time > 0 ? data.time : nowSec, // fallback to now if time is 0 or negative,
                    snr: data.snr,
                })
            };
        }
    };

    addUser(user: Types.PacketMetadata<Protobuf.Mesh.User>) {
        const current = this.nodeMap[user.from];
        const isNew = !current;
        const updated = {
            ...(current ?? create(Protobuf.Mesh.NodeInfoSchema)),
            user: user.data,
            num: user.from,
        };
        this.nodeMap = { ...(this.nodeMap || {}), [String(user.from)]: updated };
        if (isNew) {
            console.log(
                `[NodeDB] Adding new node from user packet: ${user.from} (${user.data.longName || "unknown"})`,
            );
        }
    };

    addPosition(position: Types.PacketMetadata<Protobuf.Mesh.Position>) {
        const current = this.nodeMap[position.from];
        const isNew = !current;
        const updated = {
            ...(current ?? create(Protobuf.Mesh.NodeInfoSchema)),
            position: position.data,
            num: position.from,
        };
        this.nodeMap = { ...(this.nodeMap || {}), [String(position.from)]: updated };
        if (isNew) {
            console.log(
                `[NodeDB] Adding new node from position packet: ${position.from}`,
            );
        }
    };

    setNodeNum(nodeNum: number) {
        const newDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!newDB) {
            throw new Error(`No nodeDB found for id: ${this.id}`);
        }
        newDB.myNodeNum = nodeNum;

        for (const [key, oldDB] of useNodeDBStore().nodeDBs.value) {
            if (key === this.id) continue;
            if (oldDB.myNodeNum === nodeNum) {
                // Start with shallow clones of plain-object maps
                const mergedNodes: NodeMap = { ...(oldDB.nodeMap || {}) };
                const mergedErrors: NodeErrors = { ...(oldDB.nodeErrors || {}) };

                const getNodesProxy = (filter?: (node: Protobuf.Mesh.NodeInfo) => boolean): Protobuf.Mesh.NodeInfo[] => {
                    const arr = Object.values(mergedNodes);
                    return filter ? arr.filter(filter) : arr;
                };

                const setErrorProxy = (n: number, err: NodeErrorType) => {
                    mergedErrors[String(n)] = { node: n, error: err };
                };

                // iterate newDB.nodeMap (plain object)
                for (const [numStr, newNode] of Object.entries(newDB.nodeMap || {})) {
                    const num = Number(numStr);
                    const next = validateIncomingNode(newNode, setErrorProxy, getNodesProxy);
                    if (next) {
                        mergedNodes[String(num)] = next;
                    }

                    const err = newDB.getNodeError(num);
                    if (err && !oldDB.hasNodeError(num)) {
                        mergedErrors[String(num)] = err;
                    }
                }

                // finalize: assign plain objects into this (was Maps)
                this.nodeMap = mergedNodes;
                this.nodeErrors = mergedErrors;
                useNodeDBStore().nodeDBs.value.delete(oldDB.id);
            }
        }
    }

    updateFavorite(nodeNum: number, isFavorite: boolean) {
        const node = this.nodeMap[nodeNum];
        if (node) {
            this.nodeMap = { ...(this.nodeMap || {}), [String(nodeNum)]: { ...node, isFavorite } };
        }
    };

    updateIgnore(nodeNum: number, isIgnored: boolean) {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }

        const node = nodeDB.nodeMap[nodeNum];
        if (node) {
            this.nodeMap = { ...(this.nodeMap || {}), [String(nodeNum)]: { ...node, isIgnored } };
        }
    };

    getNodesLength() {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return Object(nodeDB.nodeMap).size;
    };

    getNode(nodeNum: number) {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return nodeDB.nodeMap[nodeNum];
    };

    getNodes(filter?: ((node: Protobuf.Mesh.NodeInfo) => boolean), includeSelf?: boolean) {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) throw new Error(`No nodeDB found (id: ${this.id})`);

        const all = Object.values(nodeDB.nodeMap || {}).filter(n =>
            includeSelf ? true : n.num !== nodeDB.myNodeNum
        );

        return filter ? all.filter(filter) : all;
    }

    getMyNode() {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        if (nodeDB.myNodeNum) {
            return (
                nodeDB.nodeMap[nodeDB.myNodeNum] ??
                create(Protobuf.Mesh.NodeInfoSchema)
            );
        }
    };

    getNodeError(nodeNum: number) {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return nodeDB.nodeErrors[nodeNum];
    };

    hasNodeError(nodeNum: number) {
        const nodeDB = useNodeDBStore().nodeDBs.value.get(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return Object(nodeDB.nodeErrors).has(nodeNum);
    }
}

export const useNodeDBStore = createSharedComposable(() => {
    const nodeDBs = shallowRef<Map<number, NodeDB>>(new Map());

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Nodes Database Error', detail, life: life || 6000 });
    }

    async function init() {
        nodeDBs.value = await getNodeDBsFromDatabase();
    }

    async function getNodeDBsFromDatabase(): Promise<Map<number, NodeDB>> {
        try {
            const all = await useIndexedDB().getAllFromStore(IDB_NODESDB_STORE);
            // IndexedDB stores only Object data.
            // Ensure that we return a map of Device class instances.
            const ndbMap = new Map();
            all.forEach((value: any, key: any) => {
                const ndb = new NodeDB(key, value);
                ndbMap.set(key, ndb);
            });
            return ndbMap;
        } catch (e: any) {
            toast('error', e.message);
        }
        return new Map();
    }

    function getNodeDBs() {
        return nodeDBs.value;
    };

    function getNodeDB(id: number) {
        return nodeDBs.value.get(id);
    };

    async function addNodeDB(id: number) {
        const existing = await getNodeDB(id);
        if (existing) {
            // Prune stale nodes when accessing existing nodeDB
            existing.pruneStaleNodes();
            return existing;
        }

        const nodeDB = new NodeDB(id);
        const draft = new Map(nodeDBs.value);
        draft.set(id, nodeDB);
        nodeDBs.value = draft;

        try {
            const key = await useIndexedDB().insertIntoStore(IDB_NODESDB_STORE, nodeDB);
            if (typeof key === 'number') {
                const stored = await useIndexedDB().getFromStore(IDB_NODESDB_STORE, key);
                if (stored) {
                    // IndexedDB stores only Object data.
                    // Keep class instance and just copy object data into.
                    nodeDB.set(stored);
                    if (!(nodeDB instanceof NodeDB)) {
                        throw new Error(`Added nodeDB is not an instance of NodeDB class.`);
                    }
                } else if (nodeDB.id == null) {
                    nodeDB.id = key;
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        nodeDBs.value.set(id, nodeDB);
        // Prune stale nodes on creation (useful when rehydrating from storage)
        nodeDB.pruneStaleNodes();
        return nodeDB;
    }

    async function updateNodeDB(db: NodeDB) {
        try {
            await useIndexedDB().updateStore(IDB_NODESDB_STORE, db);
            // reload revived value from the DB
            if (db.id != null) {
                const stored = await useIndexedDB().getFromStore(IDB_NODESDB_STORE, db.id as any);
                if (nodeDBs.value.has(db.id))
                    nodeDBs.value.get(db.id)?.set(stored);
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        return db;
    }

    async function deleteNodeDB(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_NODESDB_STORE, id);
            nodeDBs.value.delete(id);
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    init();

    return {
        nodeDBs,
        addNodeDB,
        getNodeDB,
        getNodeDBs,
        updateNodeDB,
        deleteNodeDB,
    }
});
