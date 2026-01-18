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
                  <div class="flex gap-2">
                    <Lock
                      v-if="node.encryptionStatus === EncryptionStatus.Encrypted"
                      :size="20"
                      class="encryption-lock-icon"
                    />
                    <LockOpen
                      v-else-if="node.encryptionStatus === EncryptionStatus.NotEncrypted"
                      :size="20"
                      class="encryption-unlock-icon"
                    />
                    <KeyRound v-else :size="20" class="encryption-key-icon" />
                    <MessageSquareOff
                      v-if="node.isUnmessagable"
                      :size="20"
                      class="unmessagabel-icon"
                    />
                    <ThermometerSun
                      v-if="!!node.environmentMetrics"
                      :size="20"
                      class="feature-icon"
                    />
                    <Zap v-if="!!node.powerMetrics" :size="20" class="feature-icon" />
                    <Satellite v-if="!!node.position" :size="20" class="feature-icon" />
                    <Network v-if="node.viaMqtt" :size="20" class="feature-icon" />
                  </div>
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
                      v-if="node.batteryLevel !== undefined"
                      :batteryLevel="node.batteryLevel"
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
        <div class="grid grid-cols-3 gap-2">
          <NodeDetailsItem label="Node number" :value="selectedNode.nodeNumber" />
          <NodeDetailsItem
            label="Node number"
            :value="'!' + numberToHexUnpadded(selectedNode.nodeNumber)"
          />
          <NodeDetailsItem label="Role" :value="selectedNode.role" />
          <NodeDetailsItem label="Last heard" :value="formatLastHeard(selectedNode.lastHeard)" />
          <NodeDetailsItem
            label="Messageable"
            :value="selectedNode.isUnmessagable ? 'No' : 'Yes'"
          />
          <NodeDetailsItem label="Hardware" :value="selectedNode.hwModel" />
        </div>
        <div v-if="selectedNode.hasMetrics" class="divider">
          <span class="text-nowrap text-sm text-slate-400">Metrics</span>
        </div>
        <div v-if="selectedNode.hasMetrics" class="grid grid-cols-3 gap-2">
          <NodeDetailsItem label="Air TX" :value="airTxUtilization" />
          <NodeDetailsItem label="Channel" :value="channelUtilization" />
          <NodeDetailsItem label="Battery" :value="batteryPercent" />
          <NodeDetailsItem label="Voltage" :value="voltage" />
          <NodeDetailsItem class="col-span-2" label="Uptime" :value="selectedNode.uptime" />
        </div>
        <div v-if="!!selectedNode.position" class="divider">
          <span class="text-nowrap text-sm text-slate-400">Position</span>
        </div>
        <div v-if="!!selectedNode.position" class="grid grid-cols-1">
          <CoordinateDisplay
            :latitude="selectedNode.position.latitudeI"
            :longitude="selectedNode.position.longitudeI"
            :alt="selectedNode.position.altitude"
          />
        </div>
        <div v-if="selectedNode.publicKey" class="divider">
          <span class="text-nowrap text-sm text-slate-400">Security</span>
        </div>
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
import {
  Lock,
  LockOpen,
  MessageSquareOff,
  Satellite,
  Network,
  KeyRound,
  Search,
  Star,
  StarOff,
  Trash2,
  Eye,
  EyeOff,
  ThermometerSun,
  Zap,
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { formatTimeAgoIntl } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';
import type { FormattedNode } from '@/composables/core/utils/types';
import {
  EncryptionStatus,
  useFormattedNodeDatabase,
} from '@/composables/core/utils/useFormattedNodeDatabase';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import NodeDetailsItem from '@/components/Dashboard/NodeDetailsItem.vue';
import DeviceImage from '@/components/Dashboard/DeviceImage.vue';
import CoordinateDisplay from '@/components/Dashboard/CoordinateDisplay.vue';
import SortButtonGroup from '@/components/Dashboard/SortButtonGroup.vue';
import ConfirmDialog from '@/components/Connection/ConfirmDialog.vue';
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

const voltage = computed(() => {
  const v = selectedNode.value?.voltage;
  if (v === undefined || v === null) return 'N/A';
  return `${v.toPrecision(2)} V`;
});

const batteryPercent = computed(() => {
  const level = selectedNode.value?.batteryLevel;
  if (level === undefined || level === null) return 'N/A';
  if (level > 100) return 'Plugged in';
  return `${level} %`;
});

const airTxUtilization = computed(() => {
  const val = selectedNode.value?.airUtilTx;
  if (val == null) return 'N/A';
  return `${val.toFixed(1)} %`;
});

const channelUtilization = computed(() => {
  const val = selectedNode.value?.channelUtilization;
  if (val == null) return 'N/A';
  return `${val.toFixed(1)} %`;
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
