import { required, numeric, between, integer, helpers, minValue, maxValue, minLength, maxLength, ipAddress } from '@vuelidate/validators';

export const LoraRules = {
    region: { required, integer, minValue: 0 },
    hopLimit: { required, integer, between: between(0, 7) },
    channelNum: { required, integer, between: between(0, 208) },
    configOkToMqtt: { required },
    ignoreMqtt: { required },
    usePreset: { required },
    modemPreset: { required, integer, minValue: 0 },
    bandwidth: { required, integer },
    spreadFactor: { required, integer, between: between(0, 12) },
    codingRate: { required, integer, between: between(0, 10) },
    txEnabled: { required },
    txPower: { required, integer, between: between(0, 36) },
    overrideDutyCycle: { required },
    frequencyOffset: { required, integer, between: between(-1e6, 1e6) },
    overrideFrequency: {
        required, numeric, validRange: helpers.withMessage(
            'Must be 0 or between 410 and 930',
            (value: unknown) => {
                if (value === '' || value === null || value === undefined) return false;
                const n = Number(value);
                if (Number.isNaN(n)) return false;
                return n === 0 || (n >= 410 && n <= 930);
            }),
    },
    sx126xRxBoostedGain: { required },
    paFanDisabled: { required },
};

const byteLength = (str: string) => {
    return new TextEncoder().encode(str).length;
}

export const UserRules = {
    longName: {
        required,
        byteLength: helpers.withMessage(
            'Long Name must be 1-40 bytes.',
            (value: string) => {
                if (!value) return false
                const len = byteLength(value)
                return len >= 1 && len <= 40
            }
        ),
    },
    shortName: {
        required,
        byteLength: helpers.withMessage(
            'Short Name must be 2-4 bytes.',
            (value: string) => {
                if (!value) return false
                const len = byteLength(value)
                return len >= 2 && len <= 4
            }
        ),
    },
    isLicensed: { required },
}

export const BluetoothRules = {
    fixedPin: {
        required,
        integer,
        minValue: minValue(100000),
        maxValue: maxValue(999999)
    },
    mode: { required, integer, minValue: minValue(0), maxValue: maxValue(2) }
}

export const DeviceRules = {
    buttonGpio: {
        required,
        integer,
        minValue: minValue(0),
        maxValue: maxValue(65535)
    },
    buzzerGpio: {
        required,
        integer,
        minValue: minValue(0),
        maxValue: maxValue(65535)
    },
    buzzerMode: {
        required,
        integer,
        minValue: minValue(0),
        maxValue: maxValue(4)
    },
    role: { required, integer, minValue: minValue(0), maxValue: maxValue(12) },
    rebroadcastMode: { required, integer, minValue: minValue(0), maxValue: maxValue(5) },
    nodeInfoBroadcastSecs: { required, integer, minValue: minValue(3600), maxValue: maxValue(604800) },
    tzdef: { minLength: minLength(0), maxLength: maxLength(64) }
}

export const PositionRules = {
    gpsMode: { required, integer, minValue: minValue(0), maxValue: maxValue(2) },
    gpsUpdateInterval: { required, integer, minValue: minValue(0), maxValue: maxValue(604800) },
    positionBroadcastSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(604800) },
    broadcastSmartMinimumIntervalSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(604800) },
    broadcastSmartMinimumDistance: { required, integer, minValue: minValue(50), maxValue: maxValue(100000) },
    txGpio: { required, integer, minValue: minValue(0), maxValue: maxValue(65535) },
    rxGpio: { required, integer, minValue: minValue(0), maxValue: maxValue(65535) },
    gpsEnGpio: { required, integer, minValue: minValue(0), maxValue: maxValue(65535) },
    positionFlags: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
}

export const PowerRules = {
    onBatteryShutdownAfterSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(3600) },
    adcMultiplierOverride: { required, integer, minValue: minValue(-4), maxValue: maxValue(4) },
    waitBluetoothSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(3600) },
    deviceBatteryInaAddress: { required, integer, minValue: minValue(0), maxValue: maxValue(255) },
    sdsSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    lsSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    minWakeSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
}

export const NetworkRules = {
    wifiSsid: { minLength: minLength(0), maxLength: maxLength(33) },
    wifiPsk: { minLength: minLength(0), maxLength: maxLength(64) },
    ntpServer: { minLength: minLength(0), maxLength: maxLength(33) },
    addressMode: { required, integer, minValue: minValue(0), maxValue: maxValue(1) },
    rsyslogServer: { minLength: minLength(0), maxLength: maxLength(33) },
    enabledProtocols: { required, integer, minValue: minValue(0), maxValue: maxValue(1) },
}

export const Ipv4Rules = {
    ip: { required, ipAddress },
    gateway: { required, ipAddress },
    subnet: { required, ipAddress },
    dns: { required, ipAddress },
}

export const DisplayRules = {
    autoScreenCarouselSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    compassOrientation: { required, integer, minValue: minValue(0), maxValue: maxValue(7) },
    displaymode: { required, integer, minValue: minValue(0), maxValue: maxValue(3) },
    oled: { required, integer, minValue: minValue(0), maxValue: maxValue(4) },
    screenOnSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    units: { required, integer, minValue: minValue(0), maxValue: maxValue(1) },
}

export const TrafficManagementRules = {
    positionPrecisionBits: { required, integer, minValue: minValue(10), maxValue: maxValue(32) },
    positionMinIntervalSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    nodeinfoDirectResponseMaxHops: { required, integer, minValue: minValue(0), maxValue: maxValue(7) },
    rateLimitWindowSecs: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    rateLimitMaxPackets: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    unknownPacketThreshold: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
}

export const StatusMessageRules = {
    nodeStatus: { minLength: minLength(0), maxLength: maxLength(80) },
}

export const AmbientLightRules = {
    current: { required, integer, minValue: minValue(0), maxValue: maxValue(4294967295) },
    red: { required, integer, minValue: minValue(0), maxValue: maxValue(255) },
    green: { required, integer, minValue: minValue(0), maxValue: maxValue(255) },
    blue: { required, integer, minValue: minValue(0), maxValue: maxValue(255) },
}