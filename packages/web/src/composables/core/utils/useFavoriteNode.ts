import { create } from "@bufbuild/protobuf";
import { Protobuf } from "@meshtastic/core";
import { useGlobalToast } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore"

export const useFavoriteNode = () => {
  const device = useDeviceStore().device.value;
  const nodeDatabase = useNodeDBStore().nodeDatabase.value;

  function updateFavorite(nodeNumber: number, isFavorite: boolean) {
    const node = nodeDatabase?.getNode(nodeNumber);
    if (!node) {
      return;
    }

    device?.sendAdminMessage(
      create(Protobuf.Admin.AdminMessageSchema, {
        payloadVariant: {
          case: isFavorite ? "setFavoriteNode" : "removeFavoriteNode",
          value: nodeNumber,
        },
      }),
    );

    nodeDatabase?.updateFavorite(nodeNumber, isFavorite);

    useGlobalToast().add({
      severity: 'info',
      summary: node?.user?.longName,
      detail: isFavorite ? 'Marked favorite.' : 'Unmarked favorite.',
      life: 3000
    });
  }

  return {
    updateFavorite
  }
}
