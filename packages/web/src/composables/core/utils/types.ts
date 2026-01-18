import { Protobuf } from "@meshtastic/core";
import { EncryptionStatus } from "./useFormattedNodeDatabase";

export interface FormattedNode {
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
    batteryLevel?: number;
    voltage?: number;
    channelUtilization?: number;
    airUtilTx?: number;
    uptime?: string;
    role?: string;
    hasPosition: boolean;
    hasMetrics: boolean;
    lat?: number;
    lon?: number;
    alt?: number;
    publicKey?: string;
    isPublicKeyVerified: boolean;
    environmentMetrics?: FormattedEnvironmentMetrics;
    powerMetrics?: FormattedPowerMetrics;
}

export type FormattedNodeMap = { [key: string]: FormattedNode };
export type HumanizedEnvironmentMetrics = {
    [K in keyof Protobuf.Telemetry.EnvironmentMetrics]?: string;
};

export type FormattedEnvironmentMetrics = {
    temperature?: string;
    soilTemperature?: string;
    relativeHumidity?: string;
    soilMoisture?: string;
    barometricPressure?: string;
    gasResistance?: string;
    iaq?: string;
    voltage?: string;
    current?: string;
    lux?: string;
    whiteLux?: string;
    irLux?: string;
    uvLux?: string;
    rainfall1h?: string;
    rainfall24h?: string;
    windSpeed?: string;
    windGust?: string;
    windLull?: string;
    windDirection?: string;
    distance?: string;
    weight?: string;
    radiation?: string;
}

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