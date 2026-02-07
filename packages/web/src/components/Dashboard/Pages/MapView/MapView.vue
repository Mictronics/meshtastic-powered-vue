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
    local-ideograph-font-family="Inter"
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
          'text-font': ['Inter'],
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
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 20, 8, 22, 12, 24, 16, 26],
          'circle-color': ['get', 'markerColor'],
          'circle-stroke-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#00bcff',
            ['boolean', ['get', 'isFavorite'], false],
            '#f59e0b',
            'rgba(0,0,0,0)',
          ],
          'circle-stroke-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2,
            ['boolean', ['get', 'isFavorite'], false],
            1.5,
            1,
          ],
          'circle-stroke-opacity': 0.75,
          'circle-blur': 0.1,
        }"
      />
      <mgl-symbol-layer
        layer-id="node-labels"
        :filter="['!', ['has', 'point_count']]"
        :minzoom="CLUSTER_MAX_ZOOM"
        :layout="{
          'text-field': ['get', 'shortName'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 8, 8, 10, 12, 12, 16, 14],
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-letter-spacing': 0.15,
          'text-font': ['Inter'],
        }"
        :paint="{
          'text-color': ['get', 'textColor'],
        }"
      />
    </mgl-geo-json-source>
    <mgl-popup
      v-if="popupNode"
      :coordinates="[popupNode.position?.longitudeI || 0, popupNode.position?.latitudeI || 0]"
      :close-on-click="true"
      @close="resetSelection"
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
import { useAppStore } from '@/composables/stores/app/useAppStore';
import { useEventListener, useThrottleFn, useColorMode } from '@vueuse/core';
import type { LngLatLike } from 'maplibre-gl';
import { useFormattedNodeDatabase } from '@/composables/stores/nodeDB/useFormattedNodeDatabase';
import type { FormattedNode } from '@/composables/types';
import MapPopover from './MapPopover.vue';
import { useColor } from '@/composables/useColor';

const appStore = useAppStore();
const color = useColor();
const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const colorMode = useColorMode({
  storageKey: 'vueuse-color-scheme',
});
const LIGHT_STYLE = './styles/positron-gl.json';
const DARK_STYLE = './styles/dark-matter-gl.json';
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

const resetSelection = () => {
  popupNode.value = null;
  selectedNodeNumber.value = null;
};

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
          markerColor: avatarColor(node.nodeNumber).background,
          textColor: avatarColor(node.nodeNumber).text,
          shortName: node.shortName,
          isFavorite: node.isFavorite,
        },
      })
    ),
}));

const darken = (value: number, factor: number) => Math.max(0, Math.round(value * (1 - factor)));

const avatarColor = (nodeNumber: number) => {
  const bgColor = color.getColorFromNodeNum(nodeNumber || 0);
  const isLight = color.isLightColor(bgColor);

  // Darken amount in dark mode
  const darkenFactor = colorMode.value === 'dark' ? 0.3 : 0;

  const r = darken(bgColor.r, darkenFactor);
  const g = darken(bgColor.g, darkenFactor);
  const b = darken(bgColor.b, darkenFactor);

  const textColor = isLight
    ? `rgba(${darken(0, darkenFactor)}, ${darken(0, darkenFactor)}, ${darken(0, darkenFactor)}, 1)`
    : `rgba(${darken(255, darkenFactor)}, ${darken(255, darkenFactor)}, ${darken(255, darkenFactor)}, 1)`;

  return {
    background: `rgba(${r}, ${g}, ${b}, 1)`,
    text: textColor,
  };
};

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

const onZoomEnd = () => {
  appStore.appData.mapZoom = zoom.value;
};

const onDragEnd = () => {
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
