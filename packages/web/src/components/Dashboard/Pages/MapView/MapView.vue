<template>
  <mgl-map
    :map-style="style"
    :height="mapHeight"
    ref="mapRef"
    :attributionControl="false"
    :renderWorldCopies="false"
    :maxPitch="0"
    :dragRotate="false"
    :touchZoomRotate="false"
    v-model:zoom="zoom"
    v-model:center="center"
    @map:zoomend="onZoomEnd"
    @map:dragend="onDragEnd"
    @map:load="onMapLoad"
  >
    <mgl-navigation-control position="top-right" :showCompass="false" />
  </mgl-map>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { MglMap, MglNavigationControl } from '@indoorequal/vue-maplibre-gl';
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import { useEventListener, useThrottleFn } from '@vueuse/core';
import type { LngLatLike } from 'maplibre-gl';

const appStore = useAppStore();
const style =
  'https://raw.githubusercontent.com/hc-oss/maplibre-gl-styles/master/styles/osm-mapnik/v8/default.json';
const zoom = ref(6);
const center = ref<LngLatLike>({ lng: 10.447694, lat: 51.163361 });
const mapHeight = ref(`${window.innerHeight - 25}px`);

const onMapLoad = (e: any) => {
  const map = e.map;
  zoom.value = appStore.appData.mapZoom;
  center.value = appStore.appData.mapCenter;
};

const onZoomEnd = (e: any) => {
  appStore.appData.mapZoom = zoom.value;
};

const onDragEnd = (e: any) => {
  appStore.appData.mapCenter = center.value;
};

onMounted(() => {
  mapHeight.value = `${window.innerHeight - 25}px`;
});

const updateHeight = useThrottleFn(() => {
  mapHeight.value = `${window.innerHeight - 25}px`;
}, 100);

useEventListener(window, 'resize', updateHeight);
</script>

<style lang="css">
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>
