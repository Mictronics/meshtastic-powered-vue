<template>
  <div class="p-1 bg-slate-50/50 dark:bg-slade-800 font-sans text-slate-900">
    <div class="mx-auto flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
      <div class="relative w-full md:w-96">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
        <InputText
          v-model="searchQuery"
          placeholder="Nodes durchsuchen..."
          class="w-full pl-10 pt-2 pb-2 !rounded-xl border-slate-200"
        />
      </div>

      <div class="flex gap-2 p-1 rounded-xl shadow-sm border border-slate-200">
        <Button
          @click="toggleSort('name')"
          :variant="sortKey === 'name' ? 'primary' : 'text'"
          size="small"
          class="!px-4"
        >
          Name
          <ArrowUpDown :size="14" class="ml-2" />
        </Button>
        <Button
          @click="toggleSort('cpu')"
          :variant="sortKey === 'cpu' ? 'primary' : 'text'"
          size="small"
          class="!px-4"
        >
          Last
          <Activity :size="14" class="ml-2" />
        </Button>
      </div>
    </div>

    <div class="mx-auto">
      <VirtualScroller :items="chunkedNodes" :itemSize="170" scrollHeight="85vh" class="">
        <template #item="{ item: rowNodes }">
          <div
            class="grid gap-6 p-2 w-full"
            :style="{
              gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
              height: '170px',
            }"
          >
            <div
              v-for="node in (rowNodes as IFormattedNode[])"
              :key="node.nodeNumber"
              @click="openQuickView(node)"
            >
              <div
                class="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:border-green-500 transition-all duration-300 active:scale-[0.98]"
              >
                <div class="flex justify-between items-start mb-3">
                  <NodeAvatar
                    :isFavorite="node.isFavorite"
                    :nodeNumber="node.nodeNumber"
                    :shortName="node.shortName"
                  />
                  <div class="flex gap-2">
                    <Lock v-if="node.isEncrypted" :size="20" class="encryption-lock-icon" />
                    <LockOpen v-else :size="20" class="encryption-unlock-icon" />

                    <MessageSquareOff
                      v-if="node.isUnmessagable"
                      :size="20"
                      class="unmessagabel-icon"
                    />
                    <Satellite v-if="node.hasPosition" :size="20" class="via-mqtt-icon" />
                    <Network v-if="node.viaMqtt" :size="20" class="via-mqtt-icon" />
                  </div>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-2 truncate">{{ node.longName }}</h3>
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
      class="!w-full md:!w-[450px] !border-l !border-slate-200 shadow-2xl"
    >
      <template #header>
        <div class="flex items-center gap-3">
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
        <div v-if="selectedNode.hasPosition" class="divider">
          <span class="text-nowrap text-sm text-slate-400">Position</span>
        </div>
        <div v-if="selectedNode.hasPosition" class="grid grid-cols-1">
          <CoordinateDisplay
            :latitude="selectedNode.lat"
            :longitude="selectedNode.lon"
            :alt="selectedNode.alt"
          />
        </div>
        <div class="divider">
          <span class="text-nowrap text-sm text-slate-400">Security</span>
        </div>
        <div class="grid grid-cols-1">
          <NodeDetailsItem
            label="Public Key"
            :value="selectedNode.publicKey"
            :isPublicKeyVerified="selectedNode.isPublicKeyVerified"
          />
        </div>
        <div class="pt-6 border-t border-slate-100 flex flex-col gap-3">Button</div>
      </div>
    </Drawer>
  </div>
</template>

<script setup lang="ts">
import { Lock, LockOpen, MessageSquareOff, Satellite, Network } from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { formatTimeAgoIntl } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';
import {
  type IFormattedNode,
  useFormattedNodeDatabase,
} from '@/composables/core/utils/useFormattedNodeDatabase';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import NodeDetailsItem from '@/components/Dashboard/NodeDetailsItem.vue';
import DeviceImage from '@/components/Dashboard/DeviceImage.vue';
import CoordinateDisplay from '@/components/Dashboard/CoordinateDisplay.vue';

const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const nodes = computed<IFormattedNode[]>(() => {
  return Object.values(nodeDatabase.value || {});
});

const searchQuery = ref('');
const sortKey = ref('name');
const sortOrder = ref(1); // 1: ASC, -1: DESC
const showDrawer = ref(false);
const selectedNode = ref<IFormattedNode>();
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

const updateWidth = () => (windowWidth.value = window.innerWidth);
onMounted(() => window.addEventListener('resize', updateWidth));
onUnmounted(() => window.removeEventListener('resize', updateWidth));

const cardsPerRow = computed(() => {
  if (windowWidth.value >= 1280) return 5; // xl
  if (windowWidth.value >= 1024) return 3; // lg
  if (windowWidth.value >= 768) return 2; // md
  return 1; // sm
});

const sortedNodes = computed(() => {
  let items = nodes.value.filter((n) =>
    n.longName.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

  return items.sort((a, b) => {
    const valA = a[sortKey.value as keyof IFormattedNode];
    const valB = b[sortKey.value as keyof IFormattedNode];

    if (typeof valA === 'number' && typeof valB === 'number') {
      return (valA - valB) * sortOrder.value;
    }
    return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * sortOrder.value;
  });
});

const chunkedNodes = computed(() => {
  const chunks: IFormattedNode[][] = [];
  for (let i = 0; i < sortedNodes.value.length; i += cardsPerRow.value) {
    chunks.push(sortedNodes.value.slice(i, i + cardsPerRow.value));
  }
  return chunks;
});

const toggleSort = (key: any) => {
  if (sortKey.value === key) {
    sortOrder.value *= -1;
  } else {
    sortKey.value = key;
    sortOrder.value = 1;
  }
};

const openQuickView = (node: IFormattedNode) => {
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

.divider::before {
  margin-right: 10px;
}

.divider::after {
  margin-left: 10px;
}
</style>
