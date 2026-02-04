import { required, numeric, between, integer, helpers } from '@vuelidate/validators';

export const MeshRules = {
    region: { required, integer, minValue: 0 },
    hopLimit: { required, integer, between: between(0, 7) },
    frequencySlot: { required, integer, between: between(0, 208) },
    forwardMqtt: { required },
    allowMqtt: { required },
};

export const WaveformRules = {
    usePreset: { required },
    modemPreset: { required, integer, minValue: 0 },
    bandwidth: { required, integer },
    spreadingFactor: { required, integer, between: between(0, 12) },
    codingRate: { required, integer, between: between(0, 10) },
};

export const RadioRules = {
    transmitEnabled: { required },
    transmitPower: { required, integer, between: between(0, 36) },
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
    boostedGain: { required },
};