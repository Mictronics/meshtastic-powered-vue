import { useMessageStore } from "@/composables/core/stores/message/useMessageStore";
import { useDeviceStore } from "@/composables/core/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/core/stores/nodeDB/useNodeDBStore";
import type { Protobuf } from "@meshtastic/core";

export async function useNewNodeNum(
  id: number,
  nodeInfo: Protobuf.Mesh.MyNodeInfo,
) {
  (await useDeviceStore().getDevice(id))?.setHardware(nodeInfo);
  (await useNodeDBStore().getNodeDB(id))?.setNodeNum(nodeInfo.myNodeNum);
  useMessageStore().getMessageStore(id)?.setNodeNum(nodeInfo.myNodeNum);
}
