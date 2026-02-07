import { required, numeric, between, integer, helpers } from '@vuelidate/validators';

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