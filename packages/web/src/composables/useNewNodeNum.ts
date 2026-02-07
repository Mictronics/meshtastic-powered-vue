import { useMessageStore } from "@/composables/stores/message/useMessageStore";
import { useDeviceStore } from "@/composables/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore";
import type { Protobuf } from "@meshtastic/core";

export async function useNewNodeNum(
  id: number,
  nodeInfo: Protobuf.Mesh.MyNodeInfo,
) {
  (await useDeviceStore().getDevice(id))?.setHardware(nodeInfo);
  (await useNodeDBStore().getNodeDB(id))?.setNodeNum(nodeInfo.myNodeNum);
  (await useMessageStore().getMessageStore(id))?.setNodeNum(nodeInfo.myNodeNum);
}
