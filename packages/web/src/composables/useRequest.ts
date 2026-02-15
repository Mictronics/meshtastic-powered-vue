import { toBinary, create } from "@bufbuild/protobuf";
import { Protobuf } from "@meshtastic/core";
import { useGlobalToast } from '@/composables/useGlobalToast';
import { useDeviceStore } from "@/composables/stores/device/useDeviceStore";
import { useNodeDBStore } from "@/composables/stores/nodeDB/useNodeDBStore"

export enum TelemetryType {
    DEVICE = 0,
    ENVIRONMENT = 1,
    AIR_QUALITY = 2,
    POWER = 3,
    LOCAL_STATS = 4,
    HOST = 5,
    PAX = 6,
    POSITION = 7,
}

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

    const requestTelemetry = async (nodeNumber: number, type: TelemetryType) => {
        if (!device) return;

        let byteData, payload, portNum;
        if (type === TelemetryType.PAX) {
            portNum = Protobuf.Portnums.PortNum.PAXCOUNTER_APP;
            payload = create(Protobuf.PaxCount.PaxcountSchema);
            byteData = toBinary(Protobuf.PaxCount.PaxcountSchema, payload);
        } else if (type === TelemetryType.POSITION) {
            portNum = Protobuf.Portnums.PortNum.POSITION_APP;
            payload = create(Protobuf.Mesh.PositionSchema);
            byteData = toBinary(Protobuf.Mesh.PositionSchema, payload);
        } else {
            portNum = Protobuf.Portnums.PortNum.TELEMETRY_APP;
            payload = create(Protobuf.Telemetry.TelemetrySchema);
            switch (type) {
                default:
                case TelemetryType.DEVICE:
                    payload.variant.case = 'deviceMetrics'
                    break;
                case TelemetryType.ENVIRONMENT:
                    payload.variant.case = 'environmentMetrics'
                    break;
                case TelemetryType.AIR_QUALITY:
                    payload.variant.case = 'airQualityMetrics'
                    break;
                case TelemetryType.POWER:
                    payload.variant.case = 'powerMetrics'
                    break;
                case TelemetryType.LOCAL_STATS:
                    payload.variant.case = 'localStats'
                    break;
                case TelemetryType.HOST:
                    payload.variant.case = 'hostMetrics'
                    break;
            }
            byteData = toBinary(Protobuf.Telemetry.TelemetrySchema, payload)
        }

        try {
            await device.connection?.sendPacket(
                byteData,
                portNum,
                nodeNumber,
                nodeDatabase?.getNode(nodeNumber)?.channel ?? 0,
                true,
                true,
            );

            useGlobalToast().add({
                severity: 'info',
                summary: 'Telemetry request',
                detail: `Telemetry requested for ${nodeNumber}.`,
                life: 3000
            });

        } catch (error) {
            useGlobalToast().add({
                severity: 'error',
                summary: 'Telemetry request',
                detail: `Failed to request telemetry for ${nodeNumber}.`,
                life: 6000
            });
            console.error(error);
        }
    }

    const requestDeviceTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.DEVICE);

    const requestEnvironmentTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.ENVIRONMENT);

    const requestAirQualityTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.AIR_QUALITY);

    const requestPowerTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.POWER);

    const requestLocalStatsTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.LOCAL_STATS);

    const requestHostTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.HOST);

    const requestPaxTelemetry = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.PAX);

    const requestPosition = (nodeNumber: number) =>
        requestTelemetry(nodeNumber, TelemetryType.POSITION);

    return {
        requestNodeInfo,
        requestTelemetry,
        requestDeviceTelemetry,
        requestEnvironmentTelemetry,
        requestAirQualityTelemetry,
        requestPowerTelemetry,
        requestLocalStatsTelemetry,
        requestHostTelemetry,
        requestPaxTelemetry,
        requestPosition,
    }
};