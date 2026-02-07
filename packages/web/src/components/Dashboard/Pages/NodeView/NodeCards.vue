<template>
  <div class="p-1 bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900">
    <div class="mx-auto flex flex-col md:flex-row gap-4 mb-2 mr-6 items-center justify-end">
      <div class="relative mr-4">
        <InputText
          v-model="searchQuery"
          @keydown.esc="searchQuery = ''"
          placeholder="Search nodes..."
          class="w-full pr-16 rounded-xl! border-slate-200! dark:border-slate-600! translate-x-4 bg-white dark:bg-slate-800"
          size="small"
        />

        <div class="flex absolute right-1 top-1/2 -translate-y-1/2">
          <!-- Clear button -->
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X :size="16" />
          </button>
          <!-- Search icon -->
          <Search class="text-slate-400 pointer-events-none" :size="18" />
        </div>
      </div>
      <SortButtonGroup @sort-toggle="onSortToggle" />
    </div>

    <div class="mx-auto">
      <VirtualScroller
        ref="scroller"
        :items="chunkedNodes"
        :itemSize="155"
        :scrollHeight="virtualScrollerHeight"
        @scroll="onScroll"
      >
        <template #item="{ item: rowNodes }">
          <div
            class="grid gap-4 p-2 w-full"
            :style="{
              gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
              height: '155px',
            }"
          >
            <div v-for="node in rowNodes" :key="node.nodeNumber" @click="openQuickView(node)">
              <div
                class="group cursor-pointer bg-white dark:bg-slate-800 border rounded-2xl p-2 shadow-sm hover:shadow-xl hover:border-green-500 transition-all duration-300 active:scale-[0.98]"
                :class="{
                  'border-amber-500': node.isFavorite,
                  'border-slate-200': !node.isFavorite,
                  'dark:border-amber-500/50': node.isFavorite,
                  'dark:border-slate-600': !node.isFavorite,
                }"
              >
                <div class="flex justify-between items-start mb-2">
                  <NodeAvatar
                    :isFavorite="node.isFavorite"
                    :nodeNumber="node.nodeNumber"
                    :shortName="node.shortName"
                  />
                  <NodeFeatures :node="node" />
                </div>
                <h3 class="text-lg font-bold text-slate-800 dark:text-slate-400 mb-1 truncate">
                  {{ node.longName }}
                </h3>
                <div class="space-y-1">
                  <div class="flex justify-between text-xs text-slate-500">
                    <span>
                      {{ node.hwModel }}
                    </span>
                    <span>
                      {{ node.snr }}
                    </span>
                  </div>
                  <div class="flex justify-between text-xs text-slate-500">
                    <span>{{ node.hopsAway }} {{ formatLastHeard(node.lastHeard) }}</span>
                    <BatteryStatus
                      v-if="!!node.deviceMetrics"
                      :batteryLevel="node.deviceMetrics.batteryLevel"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VirtualScroller>

      <transition name="fade">
        <Button
          v-if="showScrollButton"
          rounded
          raised
          @click="scrollToTop('smooth')"
          class="absolute bottom-4 z-10 shadow-lg animate-bounce"
          style="right: 4em !important"
          severity="secondary"
        >
          <CircleArrowUp :size="20" />
        </Button>
      </transition>
    </div>

    <Drawer
      v-model:visible="showDrawer"
      position="right"
      class="w-full! md:w-112.5! border-l! border-slate-200! dark:border-slate-600! shadow-2xl"
    >
      <template #header>
        <div class="flex items-center gap-3 dark:text-slate-400">
          <NodeAvatar
            :isFavorite="selectedNode?.isFavorite"
            :nodeNumber="selectedNode?.nodeNumber"
            :shortName="selectedNode?.shortName"
          />
          <span class="text-xl font-bold">{{ selectedNode?.longName }}</span>
        </div>
      </template>

      <div v-if="selectedNode" class="space-y-3">
        <!-- Node Info -->
        <MetricsGrid :items="nodeInfoItems" />
        <!-- Device -->
        <SectionDivider v-if="deviceMetricsItems.length" title="Device" />
        <MetricsGrid v-if="deviceMetricsItems.length" :items="deviceMetricsItems" />
        <!-- Environment -->
        <SectionDivider v-if="environmentMetricsItems.length" title="Environment" />
        <MetricsGrid :items="environmentMetricsItems" />
        <!-- Power -->
        <SectionDivider v-if="powerMetricsItems.length" title="Power" />
        <MetricsGrid :items="powerMetricsItems" />
        <!-- Host -->
        <SectionDivider v-if="hostMetricsItems.length" title="Host" />
        <MetricsGrid :items="hostMetricsItems" />
        <!-- Local Stats -->
        <SectionDivider v-if="localStatsItems.length" title="Local Stats" />
        <MetricsGrid :items="localStatsItems" />
        <!-- Position -->
        <SectionDivider v-if="!!selectedNode.position" title="Position" />
        <div v-if="!!selectedNode.position" class="grid grid-cols-1">
          <CoordinateDisplay
            :latitude="selectedNode.position.latitudeI"
            :longitude="selectedNode.position.longitudeI"
            :alt="selectedNode.position.altitude"
          />
        </div>
        <!-- Security -->
        <SectionDivider v-if="selectedNode.publicKey" title="Security" />
        <div class="grid grid-cols-1">
          <NodeDetailsItem
            label="Public Key"
            :value="selectedNode.publicKey"
            :isPublicKeyVerified="selectedNode.isPublicKeyVerified"
          />
        </div>
        <div class="pt-6 border-t border-slate-100 dark:border-slate-600 flex gap-2">
          <Button
            v-if="isFavorite"
            severity="secondary"
            size="small"
            @click="onMarkFavorite(selectedNode.nodeNumber, false)"
          >
            <StarOff :size="15" />
            Unmark favorite
          </Button>
          <Button
            v-else
            severity="secondary"
            size="small"
            @click="onMarkFavorite(selectedNode.nodeNumber, true)"
          >
            <Star :size="15" />
            Mark favorite
          </Button>
          <Button
            v-if="isIgnored"
            severity="secondary"
            size="small"
            @click="onMarkIgnored(selectedNode.nodeNumber, false)"
          >
            <Eye :size="15" />
            Monitor
          </Button>
          <Button
            v-else
            severity="secondary"
            size="small"
            @click="onMarkIgnored(selectedNode.nodeNumber, true)"
          >
            <EyeOff :size="15" />
            Ignore
          </Button>
          <Button severity="danger" size="small" @click="deleteNode(selectedNode.nodeNumber)">
            <Trash2 :size="15" />
            Delete
          </Button>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { Search, Star, StarOff, Trash2, Eye, EyeOff, CircleArrowUp, X } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import { formatTimeAgoIntl, refDebounced } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';
import type { FormattedNode } from '@/composables/types';
import { useFormattedNodeDatabase } from '@/composables/useFormattedNodeDatabase';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import NodeDetailsItem from '@/components/Dashboard/Pages/NodeView/NodeDetailsItem.vue';
import CoordinateDisplay from '@/components/Dashboard/Pages/NodeView/CoordinateDisplay.vue';
import SortButtonGroup from '@/components/Dashboard/Pages/NodeView/SortButtonGroup.vue';
import NodeFeatures from '@/components/Dashboard/Pages/NodeView/NodeFeatures.vue';
import SectionDivider from '@/components/Dashboard/Pages/SectionDivider.vue';
import MetricsGrid from '@/components/Dashboard/Pages/NodeView/MetricsGrid.vue';
import { useFavoriteNode } from '@/composables/useFavoriteNode';
import { useIgnoreNode } from '@/composables/useIgnoreNode';
import { type SortDir } from '@/components/Dashboard/Pages/NodeView/types';
import { orderBy, filter, some } from 'lodash-es';
import { useDeleteNode } from '@/composables/useDeleteNode';
import { useConfirm } from '@/composables/useConfirmDialog';

const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const searchQuery = ref('');
const debouncedQuery = refDebounced(searchQuery, 150);
const showDrawer = ref(false);
const selectedNode = ref<FormattedNode>();
const windowWidth = ref(window.innerWidth);
const showScrollButton = ref(false);
const scroller = ref();
const { open } = useConfirm();

const nodeInfoItems = computed(() => {
  const n = selectedNode.value;
  if (!n) return [];

  return [
    { label: 'Node number', value: n.nodeNumber },
    { label: 'Hex', value: '!' + numberToHexUnpadded(n.nodeNumber) },
    { label: 'Role', value: n.role },
    { label: 'Last heard', value: formatLastHeard(n.lastHeard) },
    { label: 'Messageable', value: n.isUnmessagable ? 'No' : 'Yes' },
    { label: 'Hardware', value: n.hwModel },
  ];
});

const deviceMetricsItems = computed(() => {
  const m = selectedNode.value?.deviceMetrics;
  if (!m) return [];

  const formatVoltage = (v?: number) => (v == null ? 'N/A' : `${v.toPrecision(2)} V`);
  const formatBattery = (level?: number) =>
    level == null ? 'N/A' : level > 100 ? 'Plugged in' : `${level} %`;

  return [
    { label: 'Air TX', value: m.airUtilTx },
    { label: 'Channel', value: m.channelUtilization },
    { label: 'Battery', value: formatBattery(m.batteryLevel) },
    { label: 'Voltage', value: formatVoltage(m.voltage) },
    {
      label: 'Uptime',
      value: m.uptimeSeconds ?? 'N/A',
      class: 'col-span-2',
    },
  ];
});

const environmentMetricsItems = computed(() => {
  const m = selectedNode.value?.environmentMetrics;
  if (!m) return [];
  return [
    { label: 'Temperature', value: m.temperature },
    { label: 'Soil Temperature', value: m.soilTemperature },
    { label: 'Rel. Humidity', value: m.relativeHumidity },
    { label: 'Soil Humidity', value: m.soilMoisture },
    { label: 'Baro Pressure', value: m.barometricPressure },
    { label: 'Gas Resistance', value: m.gasResistance },
    { label: 'IAQ', value: m.iaq },
    { label: 'Voltage', value: m.voltage },
    { label: 'Current', value: m.current },
    { label: 'Lux', value: m.lux },
    { label: 'White Lux', value: m.whiteLux },
    { label: 'IR Lux', value: m.irLux },
    { label: 'UV Lux', value: m.uvLux },
    { label: 'Rain 1h', value: m.rainfall1h },
    { label: 'Rain 24h', value: m.rainfall24h },
    { label: 'Speed', value: m.windSpeed },
    { label: 'Gust', value: m.windGust },
    { label: 'Lull', value: m.windLull },
    { label: 'Direction', value: m.windDirection },
    { label: 'Distance', value: m.distance },
    { label: 'Weight', value: m.weight },
    { label: 'Radiation', value: m.radiation },
  ];
});

const powerMetricsItems = computed(() => {
  const m = selectedNode.value?.powerMetrics;
  if (!m) return [];
  return [
    { label: 'Channel 1', value: m.ch1Voltage },
    { label: 'Channel 1', value: m.ch1Current },
    { label: 'Channel 2', value: m.ch2Voltage },
    { label: 'Channel 2', value: m.ch2Current },
    { label: 'Channel 3', value: m.ch3Voltage },
    { label: 'Channel 3', value: m.ch3Current },
    { label: 'Channel 4', value: m.ch4Voltage },
    { label: 'Channel 4', value: m.ch4Current },
    { label: 'Channel 5', value: m.ch5Voltage },
    { label: 'Channel 5', value: m.ch5Current },
    { label: 'Channel 6', value: m.ch6Voltage },
    { label: 'Channel 6', value: m.ch6Current },
    { label: 'Channel 7', value: m.ch7Voltage },
    { label: 'Channel 7', value: m.ch7Current },
    { label: 'Channel 8', value: m.ch8Voltage },
    { label: 'Channel 8', value: m.ch8Current },
  ];
});

const hostMetricsItems = computed(() => {
  const m = selectedNode.value?.hostMetrics;
  if (!m) return [];
  return [
    { label: 'Uptime', value: m.uptimeSeconds },
    { label: 'Memory', value: m.freememBytes },
    { label: 'Disk 1', value: m.diskfree1Bytes },
    { label: 'Disk 2', value: m.diskfree2Bytes },
    { label: 'Disk 3', value: m.diskfree3Bytes },
    { label: 'Load 1', value: m.load1 },
    { label: 'Load 5', value: m.load5 },
    { label: 'Load 15', value: m.load15 },
    { label: 'User', value: m.userString },
  ];
});

const localStatsItems = computed(() => {
  const m = selectedNode.value?.localStats;
  if (!m) return [];
  return [
    /* Included in device metrics
    {
      label: 'Uptime',
      value: m.uptime ?? 'N/A',
      class: 'col-span-2',
    },
    */
    { label: 'Channel', value: m.channelUtilization },
    { label: 'Air TX', value: m.airUtilTx },
    { label: 'Packets TX', value: m.numPacketsTx },
    { label: 'Packets RX', value: m.numPacketsRx },
    { label: 'Bad Packets RX', value: m.numPacketsRxBad },
    { label: 'Duplicates RX', value: m.numRxDupe },
    { label: 'TX Relay', value: m.numTxRelay },
    { label: 'TX Relay Canceled', value: m.numTxRelayCanceled },
    { label: 'TX Dropped', value: m.numTxDropped },
    { label: 'Nodes Online', value: m.numOnlineNodes },
    { label: 'Nodes Total', value: m.numTotalNodes },
    { label: 'Heap Free', value: m.heapFreeBytes },
    { label: 'Heap Total', value: m.heapTotalBytes },
  ];
});

const airQualityItems = computed(() => {
  const m = selectedNode.value?.airQualityMetrics;
  if (!m) return [];
  return [];
});

const isFavorite = computed(() => {
  if (selectedNode.value?.nodeNumber) {
    return nodeDatabase.value[selectedNode.value.nodeNumber]?.isFavorite;
  }
  return false;
});

const isIgnored = computed(() => {
  if (selectedNode.value?.nodeNumber) {
    return nodeDatabase.value[selectedNode.value.nodeNumber]?.isIgnored;
  }
  return false;
});

const updateWidth = () => (windowWidth.value = window.innerWidth);
onMounted(() => window.addEventListener('resize', updateWidth));
onUnmounted(() => window.removeEventListener('resize', updateWidth));

const cardsPerRow = computed(() => {
  if (windowWidth.value >= 1280) return 5; // xl
  if (windowWidth.value >= 1024) return 3; // lg
  if (windowWidth.value >= 768) return 2; // md
  return 1; // sm
});

const sortKey = ref<string[]>([]);
const sortDir = ref<SortDir[]>([]);
const onSortToggle = (keys: string[], dir: SortDir[]) => {
  sortKey.value = keys;
  sortDir.value = dir;
};

const filteredNodes = computed(() => {
  let nodes = Object.values(nodeDatabase.value);
  // Apply deep search with Fuse-like behavior (fuzzy searching over multiple fields)
  if (debouncedQuery.value.trim()) {
    nodes = filter(nodes, (node: any) => {
      return some(node, (value) => {
        return value && value.toString().toLowerCase().includes(debouncedQuery.value.toLowerCase());
      });
    });
  }
  return nodes;
});

const sortedFilteredNodes = computed(() => {
  const nodes = filteredNodes.value;
  const sorted = orderBy(nodes, sortKey.value, sortDir.value);
  // If sorting by isOnline, hide nodes that are explicitly offline, sortDir doesn't matter
  if (sortKey.value.includes('isOnline')) {
    return sorted.filter((n: FormattedNode) => n.isOnline !== false);
  }
  return sorted;
});

const chunkedNodes = computed(() => {
  const chunks: FormattedNode[][] = [];
  for (let i = 0; i < sortedFilteredNodes.value.length; i += cardsPerRow.value) {
    chunks.push(sortedFilteredNodes.value.slice(i, i + cardsPerRow.value));
  }
  return chunks;
});

const openQuickView = (node: FormattedNode) => {
  selectedNode.value = node;
  showDrawer.value = true;
};

/**
 * Last heard needs a to be updated whenever the data table renders to
 * ensure the time ago string fits the numeric value and sorting order.
 */
const formatLastHeard = (epoch?: number) => {
  const date = new Date(0);
  if (epoch === undefined) {
    return 'Unknown';
  }
  date.setUTCSeconds(epoch);
  return formatTimeAgoIntl(date);
};

const onMarkFavorite = (nodeNumber: number, fav: boolean) => {
  useFavoriteNode().updateFavorite(nodeNumber, fav);
};

const onMarkIgnored = (nodeNumber: number, fav: boolean) => {
  useIgnoreNode().updateIgnore(nodeNumber, fav);
};

const deleteNode = async (nodeNumber: number) => {
  const confirmed = await open({
    header: 'Delete Node?',
    message: 'All data linked to this node will be permanently deleted.',
    acceptLabel: 'Delete',
    cancelLabel: 'Cancel',
  });

  if (confirmed) {
    useDeleteNode().deleteNode(nodeNumber);
    showDrawer.value = false;
  }
};

const virtualScrollerHeight = ref('0px');
onMounted(() => {
  virtualScrollerHeight.value = `${window.innerHeight - 80}px`;
  window.addEventListener('resize', onResize);
});

const onResize = () => {
  virtualScrollerHeight.value = `${window.innerHeight - 80}px`;
};

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});

const scrollToTop = (behavior: 'auto' | 'smooth' = 'auto') => {
  if (!scroller.value) return;
  scroller.value.scrollToIndex(0, behavior);
};

const onScroll = (event: any) => {
  const threshold = 200;
  const { scrollTop } = event.target;

  showScrollButton.value = scrollTop > threshold;
};
</script>

<style scoped lang="css"></style>
