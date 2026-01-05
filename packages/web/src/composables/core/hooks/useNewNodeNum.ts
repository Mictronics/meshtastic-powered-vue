import { useMessageStore, useDeviceStore, useNodeDBStore } from "@/composables/core/stores";
import type { Protobuf } from "@meshtastic/core";

export async function useNewNodeNum(
  id: number,
  nodeInfo: Protobuf.Mesh.MyNodeInfo,
) {
  useDeviceStore().getDevice(id)?.setHardware(nodeInfo);
  useNodeDBStore().getNodeDB(id)?.setNodeNum(nodeInfo.myNodeNum);
  useMessageStore().getMessageStore(id)?.setNodeNum(nodeInfo.myNodeNum);
}
