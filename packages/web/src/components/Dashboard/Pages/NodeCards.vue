<template>
  <div class="p-1 bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900">
    <div class="mx-auto flex flex-col md:flex-row gap-4 mb-2 mr-6 items-center justify-end">
      <div class="relative mr-4">
        <InputText
          v-model="searchQuery"
          placeholder="Search nodes..."
          class="w-full pr-10 rounded-xl! border-slate-200! dark:border-slate-600! translate-x-4 bg-white dark:bg-slate-800"
          size="small"
        />
        <Search class="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
      </div>
      <SortButtonGroup @sort-toggle="onSortToggle" />
    </div>

    <div class="mx-auto">
      <VirtualScroller :items="chunkedNodes" :itemSize="155" scrollHeight="92vh">
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
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-500 flex items-center gap-1">
                      {{ node.hwModel }}
                    </span>
                    <span class="text-slate-500 flex items-center gap-1">
                      {{ node.snr }}
                    </span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-slate-500 flex items-center gap-1">
                      {{ node.hopsAway }} {{ formatLastHeard(node.lastHeard) }}
                    </span>
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
  <ConfirmDialog ref="confirmDialogRef" />
</template>

<script setup lang="ts">
import { Search, Star, StarOff, Trash2, Eye, EyeOff } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { formatTimeAgoIntl } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';
import type { FormattedNode } from '@/composables/core/utils/types';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import NodeDetailsItem from '@/components/Dashboard/NodeDetailsItem.vue';
import DeviceImage from '@/components/Dashboard/DeviceImage.vue';
import CoordinateDisplay from '@/components/Dashboard/CoordinateDisplay.vue';
import SortButtonGroup from '@/components/Dashboard/SortButtonGroup.vue';
import ConfirmDialog from '@/components/Connection/ConfirmDialog.vue';
import NodeFeatures from '@/components/Dashboard/NodeFeatures.vue';
import SectionDivider from '@/components/Dashboard/DrawerSectionDivider.vue';
import MetricsGrid from '@/components/Dashboard/MetricsGrid.vue';
import { useFavoriteNode } from '@/composables/core/hooks/useFavoriteNode';
import { useIgnoreNode } from '@/composables/core/hooks/useIgnoreNode';
import { type SortDir } from '@/components/types';
import * as _ from 'lodash-es';
import { useDeleteNode } from '@/composables/core/hooks/useDeleteNode';

const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const searchQuery = ref('');
const showDrawer = ref(false);
const selectedNode = ref<FormattedNode>();
const windowWidth = ref(window.innerWidth);

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

  const formatPercent = (val?: number) => (val == null ? 'N/A' : `${val.toFixed(1)} %`);

  return [
    { label: 'Air TX', value: formatPercent(m.airUtilTx) },
    { label: 'Channel', value: formatPercent(m.channelUtilization) },
    { label: 'Battery', value: formatBattery(m.batteryLevel) },
    { label: 'Voltage', value: formatVoltage(m.voltage) },
    {
      label: 'Uptime',
      value: m.uptimeSeconds ?? 'N/A',
      class: 'col-span-2',
    },
  ];
});

const isFavorite = computed(() => {
  if (selectedNode.value?.nodeNumber)
    return nodeDatabase.value[selectedNode.value.nodeNumber]?.isFavorite;
});

const isIgnored = computed(() => {
  if (selectedNode.value?.nodeNumber)
    return nodeDatabase.value[selectedNode.value.nodeNumber]?.isIgnored;
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
  if (searchQuery.value.trim()) {
    nodes = _.filter(nodes, (node: any) => {
      return _.some(node, (value) => {
        return value && value.toString().toLowerCase().includes(searchQuery.value.toLowerCase());
      });
    });
  }
  return nodes;
});

const sortedFilteredNodes = computed(() => {
  let nodes = filteredNodes.value;
  return _.orderBy(nodes, sortKey.value, sortDir.value);
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
function formatLastHeard(epoch?: number) {
  const date = new Date(0);
  if (epoch === undefined) {
    return 'Unknown';
  }
  date.setUTCSeconds(epoch);
  return formatTimeAgoIntl(date);
}

function onMarkFavorite(nodeNumber: number, fav: boolean) {
  useFavoriteNode().updateFavorite(nodeNumber, fav);
}

function onMarkIgnored(nodeNumber: number, fav: boolean) {
  useIgnoreNode().updateIgnore(nodeNumber, fav);
}

const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);
async function deleteNode(nodeNumber: number) {
  const confirmed = await confirmDialogRef.value?.open({
    header: 'Delete Node?',
    message: 'All data linked to this node will be permanently deleted.',
    acceptLabel: 'Delete',
    cancelLabel: 'Cancel',
  });

  if (confirmed) {
    useDeleteNode().deleteNode(nodeNumber);
    showDrawer.value = false;
  }
}
</script>

<style scoped lang="css">
.divider {
  display: flex;
  align-items: center;
  text-align: center;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid oklch(96.8% 0.007 247.896);
}

.dark .divider::before,
.dark .divider::after {
  border-bottom: 1px solid oklch(44.6% 0.043 257.281);
}

.divider::before {
  margin-right: 10px;
}

.divider::after {
  margin-left: 10px;
}
</style>
