<template>
  <div
    class="p-2 rounded-xl border border-slate-100 bg-slate-50/50"
    @click="nextMode"
    title="Click to change coordinate format"
  >
    <div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
      {{ modes[modeIndex] }}
    </div>
    <div class="text-sm text-slate-700">
      {{ displayValue }}
    </div>
    <div class="text-sm text-slate-700">{{ alt }}m</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import proj4 from 'proj4';

type Props = {
  latitude?: number;
  longitude?: number;
  alt?: number;
};

const props = defineProps<Props>();

/* ------------------ CRS modes ------------------ */

const modes = ['WGS84 DD', 'WGS84 DMS', 'WGS84 DM', 'UTM', 'WebMercator'] as const;

const modeIndex = ref(0);

function nextMode() {
  modeIndex.value = (modeIndex.value + 1) % modes.length;
}

/* ------------------ Formatting helpers ------------------ */

function toDMS(value: number) {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);

  const deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = (minFloat - min) * 60;

  return { deg, min, sec, sign };
}

function toDM(value: number) {
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);

  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;

  return { deg, min, sign };
}

/* ------------------ Projections ------------------ */

// EPSG definitions
proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
proj4.defs('EPSG:3857', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

function utmEpsg(lat: number, lon: number) {
  const zone = Math.floor((lon + 180) / 6) + 1;
  return lat >= 0
    ? `EPSG:${32600 + zone}` // northern hemisphere
    : `EPSG:${32700 + zone}`; // southern hemisphere
}

function utmBand(lat: number) {
  return 'CDEFGHJKLMNPQRSTUVWX'.charAt(Math.floor((lat + 80) / 8));
}

/* ------------------ Display ------------------ */

const displayValue = computed(() => {
  const lat = props.latitude;
  const lon = props.longitude;

  if (lat == null || lon == null) {
    return 'No coordinates';
  }

  switch (modes[modeIndex.value]) {
    case 'WGS84 DD':
      return `${lat.toFixed(6)}°, ${lon.toFixed(6)}°`;

    case 'WGS84 DMS': {
      const la = toDMS(lat);
      const lo = toDMS(lon);
      return (
        `${la.deg}°${la.min}′${la.sec.toFixed(1)}″ ${la.sign < 0 ? 'S' : 'N'}, ` +
        `${lo.deg}°${lo.min}′${lo.sec.toFixed(1)}″ ${lo.sign < 0 ? 'W' : 'E'}`
      );
    }

    case 'WGS84 DM': {
      const la = toDM(lat);
      const lo = toDM(lon);
      return (
        `${la.deg}°${la.min.toFixed(3)}′ ${la.sign < 0 ? 'S' : 'N'}, ` +
        `${lo.deg}°${lo.min.toFixed(3)}′ ${lo.sign < 0 ? 'W' : 'E'}`
      );
    }

    case 'UTM': {
      const epsg = utmEpsg(lat, lon);
      const [easting, northing] = proj4('EPSG:4326', epsg, [lon, lat]);
      const zone = epsg.slice(-2);
      const band = utmBand(lat);

      return `${zone}${band} ${easting.toFixed(0)} mE ${northing.toFixed(0)} mN`;
    }

    case 'WebMercator': {
      const [x, y] = proj4('EPSG:4326', 'EPSG:3857', [lon, lat]);
      return `X: ${x.toFixed(0)} m, Y: ${y.toFixed(0)} m`;
    }
  }
});
</script>

<style lang="css" scoped></style>
