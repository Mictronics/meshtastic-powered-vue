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
    uptime: string | undefined;
    role: string | undefined;
    hasPosition: boolean;
}

type IFormattedNodeMap = { [key: string]: IFormattedNode };

export const useFormattedNodeDatabase = createSharedComposable(() => {
    const nodeDatabase = ref<IFormattedNodeMap>({});

    watchImmediate(useNodeDBStore().nodeDatabase, (ndb) => {
        if (!ndb?.nodeMap) return;

        for (const node of Object.values(ndb.nodeMap)) {
            if (node.$typeName !== 'meshtastic.NodeInfo') continue;
            const names = formatName(node.num, node.user?.shortName, node.user?.longName);
            const formatted: IFormattedNode = {
                nodeNumber: node.num,
                shortName: names.short,
                longName: names.long,
                macAddr: formatMacAddr(node.user?.macaddr),
                hopsAway: formatHops(node.hopsAway, node.viaMqtt),
                numHops: node.hopsAway,
                lastHeard: node.lastHeard,
                isEncrypted: formatEncryption(node.user?.publicKey),
                isFavorite: node.isFavorite,
                isUnmessagable: node.user?.isUnmessagable,
                viaMqtt: node.viaMqtt,
                snr: formatSnr(node.snr),
                numSnr: node.snr,
                hwModel: Protobuf.Mesh.HardwareModel[node.user?.hwModel ?? 0]?.replaceAll('_', ' '),
                batteryLevel: node.deviceMetrics?.batteryLevel,
                voltage: node.deviceMetrics?.voltage,
                channelUtilization: node.deviceMetrics?.channelUtilization,
                airUtilTx: node.deviceMetrics?.airUtilTx,
                uptime: formatUptime(node.deviceMetrics?.uptimeSeconds),
                role: Protobuf.Config.Config_DeviceConfig_Role[node.user?.role ?? 0]?.replaceAll('_', ' '),
                hasPosition: !!node.position,
            };
            nodeDatabase.value[node.num] = formatted;
        }
    }, { deep: true });

    function formatName(num: number, shortName?: string, longName?: string) {
        const short = shortName ?? num.toString(16).slice(-4).toUpperCase();
        const long = longName ?? short;
        return {
            short,
            long,
        };
    }

    function formatMacAddr(mac?: Uint8Array | ArrayBuffer): string {
        if (!mac) return 'Unknown';
        const u8 = mac instanceof Uint8Array ? mac : new Uint8Array(mac);
        return base16.stringify(u8).match(/.{1,2}/g)?.join(':') ?? 'Unknown';
    }

    function formatHops(hops?: number, viaMqtt?: boolean) {
        if (hops === undefined) return 'Unknown';
        const hopText = hops === 1 ? 'hop' : 'hops';
        const s1 = hops === 0 && !viaMqtt ? 'direct' : `${hops} ${hopText}`;
        const s2 = viaMqtt ? ' via MQTT' : '';
        return s1 + s2;
    }

    function formatEncryption(pki?: Uint8Array | ArrayBuffer): boolean {
        if (!pki) return false;
        const u8 = pki instanceof Uint8Array ? pki : new Uint8Array(pki);
        return u8.length > 0;
    }

    function formatSnr(snr: number) {
        return `${snr} dBm / ${Math.min(Math.max((snr + 10) * 5, 0), 100)} %`;
    }

    function formatUptime(t?: number) {
        if (t) {
            return humanizeDuration(t * 1000, { round: true, serialComma: false, language: "en", units: ["y", "mo", "w", "d", "h", "m"] })
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