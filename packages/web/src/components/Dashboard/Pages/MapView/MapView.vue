<template>
  <mgl-map
    :map-style="style"
    height="97vh"
    ref="mapRef"
    :attributionControl="false"
    :renderWorldCopies="false"
    :maxPitch="0"
    :dragRotate="false"
    :touchZoomRotate="false"
    :zoom="zoom"
    :center="center"
  >
    <mgl-navigation-control position="top-right" :showCompass="false" />
  </mgl-map>
</template>

<script setup lang="ts">
import { MglMap, MglNavigationControl } from '@indoorequal/vue-maplibre-gl';

const style =
  'https://raw.githubusercontent.com/hc-oss/maplibre-gl-styles/master/styles/osm-mapnik/v8/default.json';
const zoom = 6;
const center = { lon: 10.447694, lat: 51.163361 };
</script>

<style lang="css">
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>
