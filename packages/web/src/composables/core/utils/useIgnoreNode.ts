import { create } from "@bufbuild/protobuf";
import { Protobuf } from "@meshtastic/core";
import { useGlobalToast } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore"

export const useIgnoreNode = () => {
  const device = useDeviceStore().device.value;
  const nodeDatabase = useNodeDBStore().nodeDatabase.value;

  function updateIgnore(nodeNumber: number, isIgnored: boolean) {
    const node = nodeDatabase?.getNode(nodeNumber);
    if (!node) {
      return;
    }

    device?.sendAdminMessage(
      create(Protobuf.Admin.AdminMessageSchema, {
        payloadVariant: {
          case: isIgnored ? "setIgnoredNode" : "removeIgnoredNode",
          value: nodeNumber,
        },
      }),
    );

    nodeDatabase?.updateIgnore(nodeNumber, isIgnored);

    useGlobalToast().add({
      severity: 'info',
      summary: node?.user?.longName,
      detail: isIgnored ? 'Will be ignored.' : 'Will be monitored.',
      life: 3000
    });
  }

  return {
    updateIgnore
  }
}
