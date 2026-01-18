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
