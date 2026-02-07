import { useGlobalToast } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore";
import { useFormattedNodeDatabase } from "@/composables/stores/nodeDB/useFormattedNodeDatabase"

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
            nodeDatabase?.clearNodeError(nodeNumber);

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
