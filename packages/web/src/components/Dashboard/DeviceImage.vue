<template>
  <div
    className="device-image  p-2 rounded-xl border border-slate-100 bg-slate-50/50"
    v-html="svgContent"
    role="img"
    :aria-label="deviceType"
  />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';

export interface DeviceImageProps {
  deviceType: string;
}

const props = defineProps<DeviceImageProps>();
const hardwareModelToFilename: Record<string, string> = {
  'DIY V1': 'diy.svg',
  'NANO G2 ULTRA': 'nano-g2-ultra.svg',
  TBEAM: 'tbeam.svg',
  'HELTEC HT62': 'heltec-ht62-esp32c3-sx1262.svg',
  'RPI PICO': 'pico.svg',
  'T DECK': 't-deck.svg',
  'HELTEC MESH NODE T114': 'heltec-mesh-node-t114.svg',
  'HELTEC MESH NODE T114 CASE': 'heltec-mesh-node-t114-case.svg',
  'HELTEC V3': 'heltec-v3.svg',
  'HELTEC V3 CASE': 'heltec-v3-case.svg',
  'HELTEC VISION MASTER E213': 'heltec-vision-master-e213.svg',
  'HELTEC VISION MASTER E290': 'heltec-vision-master-e290.svg',
  'HELTEC VISION MASTER T190': 'heltec-vision-master-t190.svg',
  'HELTEC WIRELESS PAPER': 'heltec-wireless-paper.svg',
  'HELTEC WIRELESS PAPER V1 0': 'heltec-wireless-paper-V1_0.svg',
  'HELTEC WIRELESS TRACKER': 'heltec-wireless-tracker.svg',
  'HELTEC WIRELESS TRACKER V1 0': 'heltec-wireless-tracker-V1-0.svg',
  'HELTEC WSL V3': 'heltec-wsl-v3.svg',
  'TLORA C6': 'tlora-c6.svg',
  'TLORA T3 S3': 'tlora-t3s3-v1.svg',
  'TLORA T3 S3 EPAPER': 'tlora-t3s3-epaper.svg',
  'TLORA V2': 'tlora-v2-1-1_6.svg',
  'TLORA V2 1 1P6': 'tlora-v2-1-1_6.svg',
  'TLORA V2 1 1P8': 'tlora-v2-1-1_8.svg',
  RAK11310: 'rak11310.svg',
  RAK2560: 'rak2560.svg',
  RAK4631: 'rak4631.svg',
  'RAK4631 CASE': 'rak4631_case.svg',
  'WIO WM1110': 'wio-tracker-wm1110.svg',
  'WM1110 DEV KIT': 'wm1110_dev_kit.svg',
  'STATION G2': 'station-g2.svg',
  'TBEAM V0P7': 'tbeam-s3-core.svg',
  'T ECHO': 't-echo.svg',
  'TRACKER T1000 E': 'tracker-t1000-e.svg',
  'T WATCH S3': 't-watch-s3.svg',
  'SEEED XIAO S3': 'seeed-xiao-s3.svg',
  'SENSECAP INDICATOR': 'seeed-sensecap-indicator.svg',
  PROMICRO: 'promicro.svg',
  RPIPICOW: 'rpipicow.svg',
  UNKNOWN: 'unknown.svg',
  UNSET: 'unknown.svg',
};

const svgModules = import.meta.glob('@/assets/devices/*.svg', {
  query: '?raw',
  import: 'default',
});
const svgContent = ref('');
watchEffect(async () => {
  const filename = hardwareModelToFilename[props.deviceType];
  const loader = svgModules[`/src/assets/devices/${filename}`];
  if (loader) {
    svgContent.value = (await loader()) as string;
  } else {
    svgContent.value = '';
  }
});
</script>

<style scoped>
.device-image :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

/* Themeable SVG color */
.device-image :deep(svg path) {
  fill: currentColor;
}
</style>
