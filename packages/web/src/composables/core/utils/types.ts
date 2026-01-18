import { Protobuf } from "@meshtastic/core";
import { EncryptionStatus } from "./useFormattedNodeDatabase";

export type FormattedNode = {
    nodeNumber: number;
    shortName: string;
    longName: string;
    hopsAway: string;
    numHops?: number;
    macAddr: string;
    lastHeard: number;
    encryptionStatus: EncryptionStatus;
    isFavorite: boolean;
    isIgnored: boolean;
    isUnmessagable?: boolean;
    viaMqtt: boolean;
    snr: string;
    numSnr: number;
    hwModel?: string;
    role?: string;
    publicKey?: string;
    isPublicKeyVerified: boolean;
    deviceMetrics?: FormattedDeviceMetrics;
    environmentMetrics?: FormattedEnvironmentMetrics;
    powerMetrics?: FormattedPowerMetrics;
    position?: FormattedPosition;
    hostMetrics?: FormattedHostMetrics;
    airQualityMetrics?: FormattedAirQualityMetrics;
    localStats?: FormattedLocalStatsMetrics;
}

export type FormattedNodeMap = { [key: string]: FormattedNode };
export type FormattedEnvironmentMetrics = {
    [K in keyof Protobuf.Telemetry.EnvironmentMetrics]?: string;
};

export type FormattedDeviceMetrics = {
    batteryLevel?: number;
    voltage?: number;
    channelUtilization?: number;
    airUtilTx?: number;
    uptimeSeconds?: string;
};

export type FormattedPowerMetrics = {
    ch1Voltage?: string;
    ch1Current?: string;
    ch2Voltage?: string;
    ch2Current?: string;
    ch3Voltage?: string;
    ch3Current?: string;
    ch4Voltage?: string;
    ch4Current?: string;
    ch5Voltage?: string;
    ch5Current?: string;
    ch6Voltage?: string;
    ch6Current?: string;
    ch7Voltage?: string;
    ch7Current?: string;
    ch8Voltage?: string;
    ch8Current?: string;
};

export type FormattedPosition = {
    latitudeI?: number;
    longitudeI?: number;
    altitude?: number;
    time: number;
    locationSource: Protobuf.Mesh.Position_LocSource;
    altitudeSource: Protobuf.Mesh.Position_AltSource;
    timestamp: number;
    timestampMillisAdjust: number;
    altitudeHae?: string;
    altitudeGeoidalSeparation?: string;
    PDOP: string;
    HDOP: string
    VDOP: string;
    gpsAccuracy: string;
    groundSpeed?: string;
    groundTrack?: string;
    fixQuality: number;
    fixType: number;
    satsInView: number;
    sensorId: number;
    nextUpdate: string;
    seqNumber: number;
    precisionBits: number;
};

export type FormattedHostMetrics = {
    [K in keyof Protobuf.Telemetry.HostMetrics]?: string;
};

export type FormattedAirQualityMetrics = {
    pm?: {
        standard?: {
            pm10?: string;
            pm25?: string;
            pm40?: string;
            pm100?: string;
        };
        environmental?: {
            pm10?: string;
            pm25?: string;
            pm100?: string;
        };
        temperature?: string;
        humidity?: string;
        vocIdx?: string;
        noxIdx?: string;
        tps?: string;
    };
    particles?: {
        '0.3um'?: string;
        '0.5um'?: string;
        '1.0um'?: string;
        '2.5um'?: string;
        '4.0um'?: string;
        '5.0um'?: string;
        '10.0um'?: string;
    };
    co2?: {
        ppm?: string;
        temperature?: string;
        humidity?: string;
    };
    formaldehyde?: {
        ppb?: string;
        temperature?: string;
        humidity?: string;
    };
}

export type FormattedLocalStatsMetrics = {
    uptime?: string;
    channelUtilization?: number;
    airUtilTx?: number;
    numPacketsTx?: number;
    numPacketsRx?: number;
    numPacketsRxBad?: number;
    numOnlineNodes?: number;
    numTotalNodes?: number;
    numRxDupe?: number;
    numTxRelay?: number;
    numTxRelayCanceled?: number;
    heapTotalBytes?: number;
    heapFreeBytes?: number;
    numTxDropped?: number;
};