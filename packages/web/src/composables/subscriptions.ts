import PacketToMessageDTO from "@/composables/PacketToMessageDTO";
import { useNewNodeNum } from "@/composables/useNewNodeNum";
import { type IDevice } from '@/composables/stores/device/useDeviceStore'
import { type IMessageStore, MessageType } from '@/composables/stores/message/useMessageStore'
import { type INodeDB } from '@/composables/stores/nodeDB/useNodeDBStore'
import { type MeshDevice, Protobuf } from "@meshtastic/core";
import { useGlobalToast } from '@/composables/useGlobalToast';
export const subscribeAll = (
  device: IDevice,
  connection: MeshDevice,
  messageStore: IMessageStore,
  nodeDB: INodeDB,
) => {
  let myNodeNum = 0;
  const toast = useGlobalToast();

  connection.events.onDeviceMetadataPacket.subscribe((metadataPacket) => {
    device.addMetadata(metadataPacket.data);
  });

  connection.events.onTelemetryPacket.subscribe((telemetryPacket) => {
    nodeDB.setMetrics(telemetryPacket);
  });

  connection.events.onDeviceStatus.subscribe((status) => {
    device.setStatus(status);
  });

  connection.events.onWaypointPacket.subscribe((waypoint) => {
    console.log("onWaypointPacket");
    const { data, channel, from, rxTime } = waypoint;
    device.addWaypoint(data, channel, from, rxTime);
  });

  connection.events.onMyNodeInfo.subscribe((nodeInfo) => {
    console.log("onMyNodeInfo");
    useNewNodeNum(device.id, nodeInfo);
    myNodeNum = nodeInfo.myNodeNum;
  });

  connection.events.onUserPacket.subscribe((user) => {
    nodeDB.addUser(user);
  });

  connection.events.onPositionPacket.subscribe((position) => {
    console.log("onPositionPacket");
    nodeDB.addPosition(position);
  });

  // NOTE: Node handling is managed by the nodeDB
  // Nodes are added via subscriptions.ts and stored in nodeDB
  // Configuration is handled directly by meshDevice.configure() in useConnections
  connection.events.onNodeInfoPacket.subscribe((nodeInfo) => {
    nodeDB.addNode(nodeInfo);
  });

  connection.events.onChannelPacket.subscribe((channel) => {
    console.log("onChannelPacket");
    device.addChannel(channel);
  });
  connection.events.onConfigPacket.subscribe((config) => {
    console.log("onConfigPacket");
    device.setConfig(config);
  });
  connection.events.onModuleConfigPacket.subscribe((moduleConfig) => {
    console.log("onModuleConfigPacket");
    device.setModuleConfig(moduleConfig);
  });

  connection.events.onMessagePacket.subscribe((messagePacket) => {
    console.log("onMessagePacket");
    // incoming and outgoing messages are handled by this event listener
    const dto = new PacketToMessageDTO(messagePacket, myNodeNum);
    const message = dto.toMessage();
    messageStore.saveMessage(message);

    if (message.type === MessageType.Direct) {
      if (message.to === myNodeNum) {
        device.incrementUnread(messagePacket.from);
      }
    } else if (message.type === MessageType.Broadcast) {
      if (message.from !== myNodeNum) {
        device.incrementUnread(message.channel);
      }
    }
  });

  connection.events.onTraceRoutePacket.subscribe((traceRoutePacket) => {
    console.log("onTraceroutePacket");
    device.addTraceRoute({
      ...traceRoutePacket,
    });
  });

  connection.events.onPendingSettingsChange.subscribe((state) => {
    console.log("onPendingSettingsChange");
    device.setPendingSettingsChanges(state);
  });

  connection.events.onMeshPacket.subscribe((meshPacket) => {
    console.log("onMeshPacket");
    nodeDB.processPacket({
      from: meshPacket.from,
      snr: meshPacket.rxSnr,
      time: meshPacket.rxTime,
    });
  });

  connection.events.onClientNotificationPacket.subscribe(
    (clientNotificationPacket) => {
      console.log("onClientNotificationPacket");
      device.addClientNotification(clientNotificationPacket);
    },
  );

  connection.events.onNeighborInfoPacket.subscribe((neighborInfo) => {
    console.log("onNeighborInfoPacket");
    device.addNeighborInfo(neighborInfo.from, neighborInfo.data);
  });

  connection.events.onRoutingPacket.subscribe((routingPacket) => {
    switch (routingPacket.data.variant.case) {
      case "errorReason": {
        switch (routingPacket.data.variant.value) {
          case Protobuf.Mesh.Routing_Error.NO_CHANNEL:
          case Protobuf.Mesh.Routing_Error.PKI_UNKNOWN_PUBKEY:
            nodeDB.setNodeError(
              routingPacket.from,
              routingPacket.data.variant.value,
            );
            break;
          default:
            break;
        }

        const errorValue = routingPacket.data.variant.value;
        if (errorValue !== Protobuf.Mesh.Routing_Error.NONE) {
          const errorName = (Protobuf.Mesh.Routing_Error[errorValue] || 'Unknown error').replaceAll('_', ' ');
          console.error(`Routing Error: ${errorName}`);
          toast.add({
            severity: 'error',
            summary: 'Routing Error',
            detail: `Routing Error: ${errorName}`,
            life: 6000,
          });
        }
        break;
      }
      case "routeReply":
        console.info(`Route Reply: ${routingPacket.data.variant.value}`);
        break;
      case "routeRequest":
        console.info(`Route Request: ${routingPacket.data.variant.value}`);
        break;
      default:
        break;
    }
  });
};
