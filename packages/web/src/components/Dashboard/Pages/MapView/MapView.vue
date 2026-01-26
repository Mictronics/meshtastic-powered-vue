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
      <mgl-circle-layer
        layer-id="node-markers"
        :filter="['!', ['has', 'point_count']]"
        :minzoom="CLUSTER_MAX_ZOOM"
        :paint="{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 6, 12, 12],
          'circle-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#38bdf8',
            '#111827',
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1,
        }"
      />
    </mgl-geo-json-source>
    <mgl-popup
      v-if="popupNode"
      :coordinates="[popupNode.position?.longitudeI || 0, popupNode.position?.latitudeI || 0]"
      :close-on-click="true"
      @close="popupNode = null"
      :offset="10"
    >
      <MapPopover :node="popupNode" />
    </mgl-popup>
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
  MglPopup,
} from '@indoorequal/vue-maplibre-gl';
import type { FeatureCollection, Feature, Point } from 'geojson';
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import { useEventListener, useThrottleFn, useColorMode } from '@vueuse/core';
import type { LngLatLike } from 'maplibre-gl';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';
import type { FormattedNode } from '@/composables/core/utils/types';
import MapPopover from './MapPopover.vue';

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
const popupNode = ref<FormattedNode | null>(null);

const geoJsonNodes = computed<FeatureCollection<Point>>(() => ({
  type: 'FeatureCollection',
  features: Object.values(nodeDatabase.value)
    .filter((node) => node.position?.latitudeI != null && node.position?.longitudeI != null)
    .map(
      (node): Feature<Point> => ({
        type: 'Feature',
        id: node.nodeNumber,
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

watch(selectedNodeNumber, (next, prev) => {
  const map = mapRef.value?.map;
  if (!map) return;

  if (prev != null) {
    map.setFeatureState({ source: 'nodes', id: prev }, { selected: false });
  }

  if (next != null) {
    map.setFeatureState({ source: 'nodes', id: next }, { selected: true });
  }
});

watch(popupNode, (node) => {
  if (!node) return;

  const map = mapRef.value.map;

  map.flyTo({
    center: [node.position!.longitudeI!, node.position!.latitudeI!],
    duration: 300,
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

  map.on('click', 'node-markers', (e: any) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['node-markers'],
    });
    const nodeNumber = features[0].properties.nodeNumber;

    selectedNodeNumber.value = nodeNumber;
    popupNode.value = nodeDatabase.value[nodeNumber] || null;
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
</script>

<style lang="css">
@import 'maplibre-gl/dist/maplibre-gl.css';

.maplibregl-popup-content {
  background: unset;
  border-radius: unset;
  box-shadow: unset;
  padding: unset;
  pointer-events: auto;
  position: relative;
}

.maplibregl-popup-tip {
  border-top-color: unset !important;
  border-bottom-color: unset !important;
  border-left-color: unset !important;
  border-right-color: unset !important;
  border: 0;
}
</style>
