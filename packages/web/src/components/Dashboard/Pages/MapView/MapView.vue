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
      v-if="zoom > CLUSTER_MAX_ZOOM"
      :key="node.nodeNumber"
      :node="node"
      :zoom="zoom"
      :selected="selectedNodeNumber === node.nodeNumber"
      @select="selectedNodeNumber = $event"
    />
    <mgl-geo-json-source
      source-id="nodes"
      :data="geoJsonNodes"
      :cluster="true"
      :clusterRadius="50"
      :clusterMaxZoom="CLUSTER_MAX_ZOOM"
    >
      <mgl-circle-layer
        layer-id="cluster-circle"
        :filter="['has', 'point_count']"
        :paint="{
          'circle-color': '#0084d1',
          'circle-blur': 0.5,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 24],
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            CLUSTER_MAX_ZOOM - 0.2,
            0.85,
            CLUSTER_MAX_ZOOM + 0.2,
            0,
          ],
        }"
      />
      <mgl-symbol-layer
        layer-id="cluster-count"
        :filter="['has', 'point_count']"
        :layout="{
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        }"
        :paint="{
          'text-color': '#ffffff',
        }"
      />
    </mgl-geo-json-source>
  </mgl-map>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import {
  MglMap,
  MglNavigationControl,
  MglGeoJsonSource,
  MglCircleLayer,
  MglSymbolLayer,
} from '@indoorequal/vue-maplibre-gl';
import type { FeatureCollection, Feature, Point } from 'geojson';
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
const CLUSTER_MAX_ZOOM = 9;
const zoom = ref(6);
const center = ref<LngLatLike>({ lng: 10.447694, lat: 51.163361 });
const mapHeight = ref(`${window.innerHeight - 25}px`);
const mapRef = ref<any>();
const selectedNodeNumber = ref<number | null>(null);

const geoJsonNodes = computed<FeatureCollection<Point>>(() => ({
  type: 'FeatureCollection',
  features: Object.values(nodeDatabase.value)
    .filter((node) => node.position?.latitudeI != null && node.position?.longitudeI != null)
    .map(
      (node): Feature<Point> => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [node.position!.longitudeI!, node.position!.latitudeI!],
        },
        properties: {
          nodeNumber: node.nodeNumber,
        },
      })
    ),
}));

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

  map.on('click', 'cluster-circle', async (e: any) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['cluster-circle'],
    });
    const clusterId = features[0].properties.cluster_id;
    const targetZoom = await map.getSource('nodes').getClusterExpansionZoom(clusterId);
    const zoom = Math.max(targetZoom, CLUSTER_MAX_ZOOM + 1);
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
    });
  });
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
