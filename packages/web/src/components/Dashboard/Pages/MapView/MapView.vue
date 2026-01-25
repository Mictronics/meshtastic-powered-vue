<template>
  <mgl-map
    ref="mapRef"
    :height="mapHeight"
    :map-style="style"
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
    <MapMarker
      v-for="node in positionedNodes"
      :key="node.nodeNumber"
      :node="node"
      :selected="selectedNodeNumber === node.nodeNumber"
      @select="selectedNodeNumber = $event"
    />
  </mgl-map>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { MglMap, MglNavigationControl } from '@indoorequal/vue-maplibre-gl';
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import { useEventListener, useThrottleFn, useColorMode } from '@vueuse/core';
import type { LngLatLike } from 'maplibre-gl';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';
import MapMarker from './MapMarker.vue';

const appStore = useAppStore();
const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const colorMode = useColorMode({
  storageKey: 'vueuse-color-scheme',
});
const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const style = computed(() => {
  if (colorMode.value === 'dark') return DARK_STYLE;
  if (colorMode.value === 'light') return LIGHT_STYLE;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_STYLE : LIGHT_STYLE;
});
const zoom = ref(6);
const center = ref<LngLatLike>({ lng: 10.447694, lat: 51.163361 });
const mapHeight = ref(`${window.innerHeight - 25}px`);
const mapRef = ref<any>();
const selectedNodeNumber = ref<number | null>(null);

watch(style, () => {
  // Preserve map state when theme changes
  const map = mapRef.value?.map;
  if (!map) return;

  const zoom = map.getZoom();
  const center = map.getCenter();

  map.once('styledata', () => {
    map.setZoom(zoom);
    map.setCenter(center);
  });
});

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

const positionedNodes = computed(() =>
  Object.values(nodeDatabase.value).filter(
    (node) => node.position?.latitudeI && node.position?.longitudeI
  )
);
</script>

<style lang="css">
@import 'maplibre-gl/dist/maplibre-gl.css';
</style>
