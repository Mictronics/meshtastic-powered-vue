import { create } from "@bufbuild/protobuf";
import { Protobuf } from "@meshtastic/core";
import { useGlobalToast } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore";
import { useFormattedNodeDatabase } from "@/composables/core/utils/useFormattedNodeDatabase"

export const useDeleteNode = () => {
    const device = useDeviceStore().device.value;
    const nodeDatabase = useNodeDBStore().nodeDatabase.value;
    const formattedNodeDatabase = useFormattedNodeDatabase();

    function deleteNode(nodeNumber: number) {
        const node = nodeDatabase?.getNode(nodeNumber);
        if (!node) {
            return;
        }
        device?.connection?.removeNodeByNum(nodeNumber).then(() => {
            formattedNodeDatabase.deleteNode(nodeNumber);
            nodeDatabase?.removeNode(nodeNumber);

            useGlobalToast().add({
                severity: 'info',
                summary: node?.user?.longName,
                detail: 'Node deleted.',
                life: 3000
            });
        })
    }

    return {
        deleteNode
    }
}
