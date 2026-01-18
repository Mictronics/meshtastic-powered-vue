import { createSharedComposable, watchThrottled } from '@vueuse/core'
import { ref, type DebuggerEvent } from 'vue'
import { watchImmediate } from '@vueuse/core';
import { base16 } from 'rfc4648';
import humanizeDuration from 'humanize-duration';
import { fromByteArray } from 'base64-js';
import { Protobuf } from "@meshtastic/core";
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';
import type { FormattedEnvironmentMetrics, FormattedPowerMetrics, FormattedNode, FormattedNodeMap } from './types'

export enum EncryptionStatus {
    Encrypted = 0,
    NotEncrypted,
    DuplicateKey,
    KeyMismatch
}

export const useFormattedNodeDatabase = createSharedComposable(() => {
    const nodeDatabase = ref<FormattedNodeMap>({});

    watchImmediate(useNodeDBStore().nodeDatabase, (ndb) => {
        if (!ndb?.nodeMap) return;

        for (const node of Object.values(ndb.nodeMap)) {
            if (node.$typeName !== 'meshtastic.NodeInfo') continue;
            const names = formatName(node.num, node.user?.shortName, node.user?.longName);
            const formatted: FormattedNode = {
                nodeNumber: node.num,
                shortName: names.short,
                longName: names.long,
                macAddr: formatMacAddr(node.user?.macaddr),
                hopsAway: formatHops(node.hopsAway, node.viaMqtt),
                numHops: node.hopsAway,
                lastHeard: node.lastHeard,
                encryptionStatus: formatEncryption(node.user?.publicKey),
                isFavorite: node.isFavorite,
                isIgnored: node.isIgnored,
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
                hasMetrics: !!node.deviceMetrics,
                hasPosition: !!node.position,
                lat: node.position?.latitudeI != null
                    ? node.position.latitudeI / 1e7
                    : undefined,
                lon: node.position?.longitudeI != null
                    ? node.position.longitudeI / 1e7
                    : undefined,
                alt: node.position?.altitude,
                publicKey: formatPublicKey(node.user?.publicKey),
                isPublicKeyVerified: node.isKeyManuallyVerified,
                environmentMetrics: formatEnvironmentMetrics(node.environmentMetrics),
                powerMetrics: formatPowerMetrics(node.powerMetrics),
            };
            if (ndb.hasNodeError(node.num)) {
                const err = ndb.getNodeError(node.num)
                switch (err?.error) {
                    case 'DUPLICATE_PKI':
                        formatted.encryptionStatus = EncryptionStatus.DuplicateKey;
                        break;
                    case 'MISMATCH_PKI':
                        formatted.encryptionStatus = EncryptionStatus.KeyMismatch;
                        break;
                }
            }
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

    function formatEncryption(pki?: Uint8Array | ArrayBuffer): EncryptionStatus {
        if (!pki) return EncryptionStatus.NotEncrypted;
        const u8 = pki instanceof Uint8Array ? pki : new Uint8Array(pki);
        return (u8.length > 0) ? EncryptionStatus.Encrypted : EncryptionStatus.NotEncrypted;
    }

    function formatSnr(snr: number) {
        return `${snr} dBm / ${Math.min(Math.max((snr + 10) * 5, 0), 100)} %`;
    }

    function formatUptime(t?: number) {
        if (t) {
            return humanizeDuration(t * 1000, { round: true, serialComma: false, language: "en", units: ["y", "mo", "w", "d", "h", "m"], largest: 3 })
        }
        return undefined;
    }

    function formatPublicKey(key: Uint8Array<ArrayBufferLike> | undefined) {
        if (key && key.length > 0) {
            return fromByteArray(key);
        }
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

    function deleteNode(nodeNum: number) {
        if (Object.hasOwn(nodeDatabase.value, nodeNum)) {
            delete nodeDatabase.value[nodeNum];
        }
    }

    const fmt = (
        value: number | undefined,
        decimals: number,
        unit: string
    ): string | null => {
        if (value === undefined || Number.isNaN(value)) return null;
        return `${value.toFixed(decimals)} ${unit}`;
    };

    const fmtInt = (
        value: number | undefined,
        unit: string
    ): string | null => {
        if (value === undefined || Number.isNaN(value)) return null;
        return `${Math.round(value)} ${unit}`;
    };

    const orDash = (v: string | null) => v ?? '—';
    const windDirectionToText = (deg?: number): string | null => {
        if (deg === undefined || Number.isNaN(deg)) return null;

        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(deg / 45) % 8;

        return `${deg}° (${directions[index]})`;
    };

    const formatEnvironmentMetrics = (
        m?: Protobuf.Telemetry.EnvironmentMetrics
    ): FormattedEnvironmentMetrics | undefined => {
        if (!m) {
            return undefined;
        }

        return {
            temperature: orDash(fmt(m.temperature, 1, '°C')),
            soilTemperature: orDash(fmt(m.soilTemperature, 1, '°C')),

            relativeHumidity: orDash(fmtInt(m.relativeHumidity, '%')),
            soilMoisture: orDash(fmtInt(m.soilMoisture, '%')),

            barometricPressure: orDash(fmt(m.barometricPressure, 1, 'hPa')),
            gasResistance: orDash(fmt(m.gasResistance, 2, 'MΩ')),
            iaq: m.iaq !== undefined ? `${m.iaq} / 500` : '—',

            voltage: orDash(fmt(m.voltage, 2, 'V')),
            current: orDash(fmt(m.current, 1, 'mA')),

            lux: orDash(fmt(m.lux, 0, 'lx')),
            whiteLux: orDash(fmt(m.whiteLux, 0, 'lx')),
            irLux: orDash(fmt(m.irLux, 0, 'lx')),
            uvLux: orDash(fmt(m.uvLux, 0, 'lx')),

            rainfall1h: orDash(fmt(m.rainfall1h, 1, 'mm')),
            rainfall24h: orDash(fmt(m.rainfall24h, 1, 'mm')),

            windSpeed: orDash(fmt(m.windSpeed, 1, 'm/s')),
            windGust: orDash(fmt(m.windGust, 1, 'm/s')),
            windLull: orDash(fmt(m.windLull, 1, 'm/s')),
            windDirection: orDash(windDirectionToText(m.windDirection)),

            distance: orDash(fmt(m.distance, 0, 'mm')),
            weight: orDash(fmt(m.weight, 2, 'kg')),

            radiation: orDash(fmt(m.radiation, 2, 'µR/h')),
        };
    };

    const channels = [1, 2, 3, 4, 5, 6, 7, 8] as const;
    const formatPowerMetrics = (
        m?: Protobuf.Telemetry.PowerMetrics
    ): FormattedPowerMetrics | undefined => {
        if (!m) return undefined;

        return Object.fromEntries(
            channels.flatMap(ch => [
                [`ch${ch}Voltage`, orDash(fmt(m[`ch${ch}Voltage`], 2, 'V'))],
                [`ch${ch}Current`, orDash(fmt(m[`ch${ch}Current`], 1, 'mA'))],
            ])
        ) as FormattedPowerMetrics;
    };

    return {
        nodeDatabase,
        getNodesLength,
        getNode,
        getNodes,
        deleteNode,
    };
});