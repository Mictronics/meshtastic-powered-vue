<template>
  <div class="w-full">
    <p class="text-slate-400 text-xs">
      WGS84 DD:
      <i>12.345678 N, 12.345678 E</i>
      or
      <i>-12.345678, -12.345678</i>
    </p>
    <p class="text-slate-400 text-xs">
      WGS84 DM:
      <i>12 3.456 N, 12 3.456 E</i>
    </p>
    <p class="text-slate-400 text-xs">
      WGS84 DMS:
      <i>12 34 5.6 N, 12 34 5.6 E</i>
    </p>
    <p class="text-slate-400 text-xs">
      UTM:
      <i>12N 12345 1234567</i>
    </p>
    <p class="text-slate-400 text-xs">
      Webmercator:
      <i>1234567.89, 1234567.89</i>
    </p>
    <InputGroup>
      <InputText
        class="dark:bg-slate-800 dark:text-slate-400"
        v-model="displayValue"
        placeholder="Enter position coordinates"
        :invalid="v$.$error"
        @blur="v$.$touch()"
      />
      <InputGroupAddon>
        <Button
          size="small"
          severity="secondary"
          text
          :label="currentFormat"
          @click="toggleFormat"
        />
      </InputGroupAddon>
    </InputGroup>

    <p v-if="v$.$error" class="text-red-400 dark:text-red-600 text-xs">
      Invalid input format ({{ currentFormat }})
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, helpers } from '@vuelidate/validators';
import proj4 from 'proj4';

type LatLon = { lat: number; lon: number };
type GeoFormat = (typeof formats)[number];

const latitude = defineModel<number>('latitude');
const longitude = defineModel<number>('longitude');
const formats = ['WGS84 DD', 'WGS84 DM', 'WGS84 DMS', 'UTM', 'WebMercator'] as const;
const currentFormat = ref<GeoFormat>('WGS84 DD');
const displayValue = ref('');

proj4.defs('WGS84', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('WEB_MERCATOR', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

const validators: Record<GeoFormat, any> = {
  'WGS84 DD': helpers.regex(
    /^([-\d]{1,4}(?:\.\d+)?)\s*[NS]?\s*,\s*([-\d]{1,4}(?:\.\d+)?)\s*[EW]?$/
  ),
  'WGS84 DM': helpers.regex(/^\d{1,3}\s\d+(?:\.\d+)?\s[NS]\s*,\s*\d{1,3}\s\d+(?:\.\d+)?\s[EW]$/),
  'WGS84 DMS': helpers.regex(/^\d+\s\d+\s[\d.]+\s[NS].*\d+\s\d+\s[\d.]+\s[EW]$/),
  UTM: helpers.regex(/^\d{1,2}[C-X]\s+\d+\s+\d+$/),
  WebMercator: helpers.regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/),
};

const dynamicFormatValidator = helpers.withParams({ type: 'format' }, (value: string) => {
  const format = currentFormat.value;
  const validator = validators[format];
  return validator(value);
});

const rules = {
  displayValue: {
    required,
    format: dynamicFormatValidator,
  },
};

const v$ = useVuelidate(rules, { displayValue });
const setModelFromLatLon = ({ lat, lon }: LatLon) => {
  latitude.value = lat;
  longitude.value = lon;
};

const parseToWgs84 = (value: string, format: GeoFormat): LatLon | null => {
  try {
    switch (format) {
      case 'WGS84 DD': {
        const m = value.match(
          /^\s*(-?\d+(?:\.\d+)?)\s+([NS])\s*,\s*(-?\d+(?:\.\d+)?)\s+([EW])\s*$/
        );
        if (m) {
          let lat = Number(m[1]);
          let lon = Number(m[3]);
          if (m[2] === 'S') lat = -lat;
          if (m[4] === 'W') lon = -lon;
          return { lat, lon };
        }

        const parts = value.split(',').map((v) => Number(v.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) return null;
        const [lat, lon] = parts as [number, number];
        return { lat, lon };
      }
      case 'WGS84 DM': {
        const m = value.match(/(\d+)\s+([\d.]+)\s?([NS]).*?(\d+)\s+([\d.]+)\s?([EW])/);
        if (!m) return null;
        const lat = Number(m[1]) + Number(m[2]) / 60;
        const lon = Number(m[4]) + Number(m[5]) / 60;
        return { lat: m[3] === 'S' ? -lat : lat, lon: m[6] === 'W' ? -lon : lon };
      }
      case 'WGS84 DMS': {
        const m = value.match(
          /(\d+)\s?(\d+)\s?([\d.]+)\s?([NS]).*?(\d+)\s?(\d+)\s?([\d.]+)\s?([EW])/
        );
        if (!m) return null;
        const lat = Number(m[1]) + Number(m[2]) / 60 + Number(m[3]) / 3600;
        const lon = Number(m[5]) + Number(m[6]) / 60 + Number(m[7]) / 3600;
        return { lat: m[4] === 'S' ? -lat : lat, lon: m[8] === 'W' ? -lon : lon };
      }
      case 'WebMercator': {
        const parts = value.split(',').map((v) => Number(v.trim()));
        if (parts.length !== 2 || parts.some(isNaN)) return null;
        const [x, y] = parts as [number, number];
        const [lon, lat] = proj4('WEB_MERCATOR', 'WGS84', [x, y]) as [number, number];
        return { lat, lon };
      }
      case 'UTM': {
        const m = value.match(/(\d{1,2})([C-X])\s+(\d+)\s+(\d+)/);
        if (!m) return null;
        const band = m[2];
        if (!band) return null;
        const zone = Number(m[1]);
        const easting = Number(m[3]);
        const northing = Number(m[4]);
        const isSouth = band < 'N';
        const utmDef = `+proj=utm +zone=${zone} ${isSouth ? '+south' : ''} +datum=WGS84 +units=m +no_defs`;
        const [lon, lat] = proj4(utmDef, 'WGS84', [easting, northing]) as [number, number];
        return { lat, lon };
      }
    }
  } catch {
    return null;
  }
};

const formatFromDd = (coord: LatLon, format: GeoFormat): string => {
  switch (format) {
    case 'WGS84 DD': {
      const latDir = coord.lat >= 0 ? 'N' : 'S';
      const lonDir = coord.lon >= 0 ? 'E' : 'W';
      const latAbs = Math.abs(coord.lat).toFixed(6);
      const lonAbs = Math.abs(coord.lon).toFixed(6);
      return `${latAbs} ${latDir}, ${lonAbs} ${lonDir}`;
    }

    case 'WGS84 DM': {
      const latDeg = Math.floor(Math.abs(coord.lat));
      const latMin = (Math.abs(coord.lat) - latDeg) * 60;
      const lonDeg = Math.floor(Math.abs(coord.lon));
      const lonMin = (Math.abs(coord.lon) - lonDeg) * 60;
      return (
        `${latDeg} ${latMin.toFixed(3)} ${coord.lat < 0 ? 'S' : 'N'}, ` +
        `${lonDeg} ${lonMin.toFixed(3)} ${coord.lon < 0 ? 'W' : 'E'}`
      );
    }

    case 'WGS84 DMS': {
      const latDeg = Math.floor(Math.abs(coord.lat));
      const latMin = Math.floor((Math.abs(coord.lat) - latDeg) * 60);
      const latSec = ((Math.abs(coord.lat) - latDeg) * 60 - latMin) * 60;
      const lonDeg = Math.floor(Math.abs(coord.lon));
      const lonMin = Math.floor((Math.abs(coord.lon) - lonDeg) * 60);
      const lonSec = ((Math.abs(coord.lon) - lonDeg) * 60 - lonMin) * 60;
      return (
        `${latDeg} ${latMin} ${latSec.toFixed(1)} ${coord.lat < 0 ? 'S' : 'N'}, ` +
        `${lonDeg} ${lonMin} ${lonSec.toFixed(1)} ${coord.lon < 0 ? 'W' : 'E'}`
      );
    }

    case 'WebMercator': {
      const [x, y] = proj4('WGS84', 'WEB_MERCATOR', [coord.lon, coord.lat]) as [number, number];
      return `${x.toFixed(2)}, ${y.toFixed(2)}`;
    }

    case 'UTM': {
      const zone = Math.floor((coord.lon + 180) / 6) + 1;
      const utmDef = `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs`;
      const [easting, northing] = proj4('WGS84', utmDef, [coord.lon, coord.lat]) as [
        number,
        number,
      ];
      const band = coord.lat >= 0 ? 'N' : 'S';
      return `${zone}${band} ${easting.toFixed(0)} ${northing.toFixed(0)}`;
    }
  }
};

watch(displayValue, (v) => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const parsed = parseToWgs84(v, currentFormat.value);
  if (!parsed) return;

  setModelFromLatLon(parsed);
});

watch(
  [latitude, longitude],
  ([lat, lon]) => {
    if (typeof lat === 'number' && typeof lon === 'number') {
      displayValue.value = formatFromDd({ lat, lon }, currentFormat.value);
    }
  },
  { immediate: true }
);

const toggleFormat = () => {
  const i = formats.indexOf(currentFormat.value);
  const nextFormat = formats[(i + 1) % formats.length] ?? 'WGS84 DD';
  currentFormat.value = nextFormat;

  const lat = latitude.value;
  const lon = longitude.value;
  if (typeof lat === 'number' && typeof lon === 'number') {
    displayValue.value = formatFromDd({ lat, lon }, nextFormat);
  }

  v$.value.$reset();
  v$.value.$touch();
};
</script>
