import type { NodeErrorType } from "@/composables/core/stores/nodeDB/types";
import type { Protobuf } from "@meshtastic/core";
import { fromByteArray } from "base64-js";

export function equalKey(a?: Uint8Array | null, b?: Uint8Array | null): boolean {
    if (!a || !b) return false;
    if (a.byteLength !== b.byteLength) return false;
    for (let i = 0; i < a.byteLength; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function validateIncomingNode(
    newNode: Protobuf.Mesh.NodeInfo,
    setNodeError: (nodeNum: number, error: NodeErrorType) => void,
    getNodes: (filter?: (node: Protobuf.Mesh.NodeInfo) => boolean) => Protobuf.Mesh.NodeInfo[],
): Protobuf.Mesh.NodeInfo | undefined {
    const num = newNode.num;
    const existingNodes = getNodes(n => n.num === num);

    const incomingKey = newNode.user?.publicKey;

    // No existing node with this number
    if (existingNodes.length === 0) {
        if (incomingKey && incomingKey.length > 0) {
            const conflict = getNodes(n => equalKey(n.user?.publicKey, incomingKey));
            if (conflict.length > 0) {
                console.warn(
                    `[Node ${num}] Rejected: Public key already claimed by another node. Key:`,
                    fromByteArray(incomingKey)
                );
                setNodeError(num, "DUPLICATE_PKI");
                return undefined;
            }
        }
        return newNode;
    }

    // Exactly one existing node
    if (existingNodes.length === 1) {
        const oldNode = existingNodes[0];
        if (!oldNode) return undefined;

        const oldKey = oldNode.user?.publicKey;

        const keyMatches = !oldKey || equalKey(oldKey, incomingKey);

        if (keyMatches) {
            // Accept updates from new node
            return newNode;
        }

        if (incomingKey && incomingKey.length > 0) {
            console.warn(
                `[Node ${num}] Rejected: existing key does not match incoming key. Old: ${fromByteArray(oldKey ?? new Uint8Array())}, New: ${fromByteArray(incomingKey)}`
            );
            setNodeError(num, "MISMATCH_PKI");
            return oldNode;
        }

        console.warn(`[Node ${num}] Rejected: incoming node has no public key, but existing does.`);
        return oldNode;
    }

    // Multiple nodes with same number (should never happen)
    console.warn(`[Node ${num}] Rejected: Multiple existing nodes with this node number.`);
    setNodeError(num, "DUPLICATE_PKI");
    return undefined;
}
