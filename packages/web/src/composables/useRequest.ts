import { toBinary } from "@bufbuild/protobuf";
import { Protobuf } from "@meshtastic/core";
import { useGlobalToast } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore"

export const useRequest = () => {
    const device = useDeviceStore().device.value;
    const nodeDatabase = useNodeDBStore().nodeDatabase.value;

    const requestNodeInfo = async (nodeNumber: number) => {
        const myNodeInfo = nodeDatabase?.getMyNode();
        if (!myNodeInfo || !device) return;

        try {
            await device.connection?.sendPacket(
                toBinary(Protobuf.Mesh.NodeInfoSchema, myNodeInfo),
                Protobuf.Portnums.PortNum.NODEINFO_APP,
                nodeNumber,
                nodeDatabase?.getNode(nodeNumber)?.channel ?? 0,
                true,
                true,
            );

            useGlobalToast().add({
                severity: 'info',
                summary: 'Node info request',
                detail: `Node info requested for ${nodeNumber}.`,
                life: 3000
            });

        } catch (error) {
            useGlobalToast().add({
                severity: 'error',
                summary: 'Node info request',
                detail: `Failed to request node info for ${nodeNumber}.`,
                life: 6000
            });
            console.error(error);
        }
    };

    return {
        requestNodeInfo,
    }
};