import { createSharedComposable, watchThrottled } from '@vueuse/core'
import { toRaw, isReactive, ref, type DebuggerEvent } from 'vue'
import { watchImmediate } from '@vueuse/core';
import { base16 } from 'rfc4648';
import humanizeDuration from 'humanize-duration';
import { Protobuf } from "@meshtastic/core";
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';

export interface IFormattedNode {
    nodeNumber: number;
    shortName: string;
    longName: string;
    hopsAway: string;
    numHops: number | undefined;
    macAddr: string;
    lastHeard: number;
    isEncrypted: boolean;
    isFavorite: boolean;
    isUnmessagable: boolean | undefined;
    viaMqtt: boolean;
    snr: string;
    numSnr: number;
    hwModel: string | undefined;
    batteryLevel: number | undefined;
    voltage: number | undefined;
    channelUtilization: number | undefined;
    airUtilTx: number | undefined;
    uptimeSeconds: string | undefined;
    role: string | undefined;
}

type IFormattedNodeMap = { [key: string]: IFormattedNode };

export const useFormattedNodeDatabase = createSharedComposable(() => {
    const nodeDatabase = ref<IFormattedNodeMap>({});

    watchImmediate(
        useNodeDBStore().nodeDatabase,
        () => { },
        {
            onTrigger: (e: DebuggerEvent) => {
                // Trigger is called prior watch callback.
                // Get property and new value of what has changed.
                const n: Protobuf.Mesh.NodeInfo = e.newValue;
                if (Object.hasOwn(n, '$typeName') === false) return;
                if (n.$typeName === 'meshtastic.NodeInfo') {
                    const names = formatName(n.num, n.user?.shortName, n.user?.longName)
                    const node: Protobuf.Mesh.NodeInfo | {} = nodeDatabase.value[n.num] || {};
                    Object.assign<IFormattedNode | {}, IFormattedNode>(node, {
                        nodeNumber: n.num,
                        shortName: names.short,
                        longName: names.long,
                        macAddr: formatMacAddr(n.user?.macaddr),
                        hopsAway: formatHops(n.hopsAway, n.viaMqtt),
                        numHops: n.hopsAway,
                        lastHeard: n.lastHeard,
                        isEncrypted: formatEncryption(n.user?.publicKey),
                        isFavorite: n.isFavorite,
                        isUnmessagable: n.user?.isUnmessagable,
                        viaMqtt: n.viaMqtt,
                        snr: formatSnr(n.snr),
                        numSnr: n.snr,
                        hwModel: Protobuf.Mesh.HardwareModel[n.user?.hwModel ?? 0]?.replaceAll('_', ' '),
                        batteryLevel: n.deviceMetrics?.batteryLevel,
                        voltage: n.deviceMetrics?.voltage,
                        channelUtilization: n.deviceMetrics?.airUtilTx,
                        airUtilTx: n.deviceMetrics?.airUtilTx,
                        uptimeSeconds: formatUptime(n.deviceMetrics?.uptimeSeconds),
                        role: Protobuf.Config.Config_DeviceConfig_Role[n.user?.role ?? 0]?.replaceAll('_', ' ')
                    });
                    nodeDatabase.value[n.num] = node as IFormattedNode;
                }
            },
            deep: true,
        }
    );

    function formatName(num: number, shortName?: string, longName?: string) {
        const short = shortName ?? num.toString(16).slice(-4).toUpperCase();
        const long = longName ?? short;
        return {
            short,
            long,
        };
    }

    function formatMacAddr(mac: Uint8Array<ArrayBufferLike> | undefined) {
        return (
            base16
                .stringify(mac ?? [])
                .match(/.{1,2}/g)
                ?.join(':') ?? 'Unknown'
        );
    }

    function formatHops(hops?: number, viaMqtt?: boolean) {
        const s1 =
            hops !== undefined
                ? viaMqtt === false && hops === 0
                    ? 'direct'
                    : `${hops?.toString()} ${hops ?? 0 > 1 ? 'hops' : 'hop'}`
                : 'Unknown';
        const s2 = viaMqtt === true ? ' via MQTT' : '';
        return s1 + s2;
    }

    function formatEncryption(pki?: Uint8Array<ArrayBufferLike> | undefined) {
        if (pki && pki.length > 0) {
            return true;
        }
        return false;
    }

    function formatSnr(snr: number) {
        return `${snr} dBm / ${Math.min(Math.max((snr + 10) * 5, 0), 100)} %`;
    }

    function formatUptime(t?: number) {
        if (t) {
            return humanizeDuration(t * 1000, { round: true, serialComma: false, language: "en" })
        }
        return undefined;
    }

    function getNodesLength() {
        return Object.entries(nodeDatabase.value).length;
    };

    function getNode(nodeNum: number) {
        return nodeDatabase.value[nodeNum];
    };

    function getNodes() {
        return Object.values(nodeDatabase.value || {});
    }

    return {
        nodeDatabase,
        getNodesLength,
        getNode,
        getNodes,
    };
});