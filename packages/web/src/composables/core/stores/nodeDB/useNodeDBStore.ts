import { create } from "@bufbuild/protobuf";
import { validateIncomingNode } from "@/composables/core/stores/nodeDB/nodeValidation";
import { Protobuf, type Types } from "@meshtastic/core";
import type { DBSchema } from "idb";
import {
    IDB_NODESDB_STORE,
    useIndexedDB
} from "@/composables/core/stores/indexedDB";
import type { NodeError, NodeErrorType, ProcessPacketParams } from "@/composables/core/stores/nodeDB/types";
import {
    createSharedComposable,
    useArrayUnique,
    useArrayFind,
    watchThrottled,
} from '@vueuse/core'
import { ref, isReactive, toRaw, type DebuggerEvent } from 'vue'
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
        const newDB = useNodeDBStore().getNodeDB(this.id).value;
        if (!newDB) {
            throw new Error(`No nodeDB found for id: ${this.id}`);
        }
        newDB.myNodeNum = nodeNum;

        for (const oldDB of useNodeDBStore().nodeDBs.value) {
            if (oldDB.id === this.id) continue;
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
                    const next = validateIncomingNode(newNode as Protobuf.Mesh.NodeInfo, setErrorProxy, getNodesProxy);
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
                useNodeDBStore().deleteNodeDB(oldDB.id);
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
        const nodeDB = useNodeDBStore().getNodeDB(this.id).value;
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }

        const node = nodeDB.nodeMap[nodeNum];
        if (node) {
            this.nodeMap = { ...(this.nodeMap || {}), [String(nodeNum)]: { ...node, isIgnored } };
        }
    };

    getNodesLength() {
        const nodeDB = useNodeDBStore().getNodeDB(this.id).value;
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return Object.entries(nodeDB.nodeMap).length;
    };

    getNode(nodeNum: number) {
        const nodeDB = useNodeDBStore().getNodeDB(this.id).value;
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return nodeDB.nodeMap[nodeNum];
    };

    getNodes(filter?: ((node: Protobuf.Mesh.NodeInfo) => boolean), includeSelf?: boolean) {
        const nodeDB = useNodeDBStore().getNodeDB(this.id).value;
        if (!nodeDB) throw new Error(`No nodeDB found (id: ${this.id})`);

        const all = Object.values(nodeDB.nodeMap || {}).filter(n =>
            includeSelf ? true : n.num !== nodeDB.myNodeNum
        );

        return filter ? all.filter(filter) : all;
    }

    getMyNode() {
        const nodeDB = useNodeDBStore().getNodeDB(this.id).value;
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
        const nodeDB = useNodeDBStore().getNodeDB(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return nodeDB.value?.nodeErrors[nodeNum];
    };

    hasNodeError(nodeNum: number) {
        const nodeDB = useNodeDBStore().getNodeDB(this.id);
        if (!nodeDB) {
            throw new Error(`No nodeDB found (id: ${this.id})`);
        }
        return nodeDB.value?.nodeErrors.hasOwnProperty(nodeNum) || false;
    }
}

export const useNodeDBStore = createSharedComposable(() => {
    const _nodeDatabases = ref<NodeDB[]>([]);
    const nodeDatabases = useArrayUnique(_nodeDatabases, (a, b) => a.id === b.id)

    function toast(severity: ToastSeverity, detail: string, life?: number) {
        useGlobalToast().add({ severity, summary: 'Nodes Database Error', detail, life: life || 6000 });
    }

    watchThrottled(_nodeDatabases, (updated) => {
        // Write new value back into IndexedDB. Throttled to avoid writes on any change.
        if (isReactive(updated)) {
            console.log('###', toRaw(updated));
        }
    }, {
        onTrigger: (e: DebuggerEvent) => {
            // Trigger is called prior watch callback.
            // Get property and new value of what has changed.
            console.log('### 2', e);
        },
        deep: true,
        throttle: 3000
    })


    async function init() {
        await getNodeDBsFromDatabase();
    }

    async function getNodeDBsFromDatabase(): Promise<void> {
        try {
            const all = await useIndexedDB().getAllFromStore(IDB_NODESDB_STORE);
            // IndexedDB stores only Object data.
            _nodeDatabases.value.splice(0);
            all.forEach((value: any, key: any) => {
                _nodeDatabases.value.push(new NodeDB(key, value));
            });
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    function getNodeDBs() {
        return nodeDatabases;
    };

    function getNodeDB(id: number) {
        return useArrayFind(_nodeDatabases, db => db.id === id);
    };

    async function addNodeDB(id: number) {
        const existing = getNodeDB(id).value;
        if (existing) {
            // Prune stale nodes when accessing existing nodeDB
            existing.pruneStaleNodes();
            return existing;
        }

        const nodeDB = new NodeDB(id);
        try {
            await useIndexedDB().insertIntoStore(IDB_NODESDB_STORE, nodeDB);
        } catch (e: any) {
            toast('error', e.message);
        }
        _nodeDatabases.value.push(nodeDB);
        // Prune stale nodes on creation
        nodeDB.pruneStaleNodes();
        return nodeDB;
    }

    async function updateNodeDB(db: NodeDB) {
        try {
            await useIndexedDB().updateStore(IDB_NODESDB_STORE, db);
            // reload revived value from the DB
            if (db.id != null) {
                const stored = await useIndexedDB().getFromStore(IDB_NODESDB_STORE, db.id as any);
                const i = _nodeDatabases.value.findIndex((a) => a.id === db.id)
                if (i > 0) {
                    nodeDatabases.value[i] = stored;
                }
            }
        } catch (e: any) {
            toast('error', e.message);
        }
        return db;
    }

    async function deleteNodeDB(id: number) {
        try {
            await useIndexedDB().deleteFromStore(IDB_NODESDB_STORE, id);
            const i = _nodeDatabases.value.findIndex((db) => db.id === id)
            if (i > 0) {
                nodeDatabases.value.splice(i, 1);
            }
        } catch (e: any) {
            toast('error', e.message);
        }
    }

    init();

    return {
        nodeDBs: nodeDatabases,
        addNodeDB,
        getNodeDB,
        getNodeDBs,
        updateNodeDB,
        deleteNodeDB,
    }
});
