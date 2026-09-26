<template>
  <div class="space-y-2">
    <Button severity="secondary" size="small" @click="requestTraceroute(nodeNumber)">
      <Route :size="15" />
      Trace route
    </Button>
    <p v-if="!results.length" class="text-xs text-slate-500">No traceroute result yet</p>
    <details
      v-for="(r, i) in results"
      :key="r.id"
      :open="i === 0"
      class="rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-xs text-slate-700 dark:text-slate-400"
    >
      <summary class="cursor-pointer">{{ formatTimeAgoIntl(new Date(r.rxTime)) }}</summary>
      <div class="mt-2 space-y-2">
        <div>
          <div class="font-bold">Towards</div>
          <div class="font-mono break-words">{{ towardsPath(r.data) }}</div>
        </div>
        <div v-if="r.data.snrBack.length">
          <div class="font-bold">Back</div>
          <div class="font-mono break-words">{{ backPath(r.data) }}</div>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Route } from 'lucide-vue-next';
import { formatTimeAgoIntl } from '@vueuse/core';
import { numberToHexUnpadded } from '@noble/curves/utils.js';
import type { Protobuf } from '@meshtastic/core';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/stores/nodeDB/useNodeDBStore';
import { useFormattedNodeDatabase } from '@/composables/stores/nodeDB/useFormattedNodeDatabase';
import { useRequest } from '@/composables/useRequest';

const props = defineProps<{ nodeNumber: number }>();

const UNKNOWN_NODE = 0xffffffff;
const UNKNOWN_SNR = -128;

const device = useDeviceStore().device;
const ndb = useNodeDBStore().nodeDatabase;
const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const { requestTraceroute } = useRequest();

// Newest first; the store appends and evicts the oldest.
const results = computed(() => [...(device.value?.traceroutes[props.nodeNumber] ?? [])].reverse());

const nodeName = (num: number) =>
  num === UNKNOWN_NODE
    ? 'Unknown'
    : (nodeDatabase.value[num]?.shortName ?? '!' + numberToHexUnpadded(num));

// SNR is dB scaled by 4; the entry at i is the link into node i + 1.
const formatSnr = (v?: number) =>
  v == null || v === UNKNOWN_SNR ? '?' : `${(v / 4).toFixed(1)} dB`;

const toPath = (nodes: number[], snrs: number[]) =>
  nodes.map((num, i) => (i > 0 ? `→ (${formatSnr(snrs[i - 1])}) ` : '') + nodeName(num)).join(' ');

const towardsPath = (d: Protobuf.Mesh.RouteDiscovery) => {
  const me = ndb.value?.getMyNode()?.num ?? 0;
  return toPath([me, ...d.route, props.nodeNumber], d.snrTowards);
};

const backPath = (d: Protobuf.Mesh.RouteDiscovery) => {
  const me = ndb.value?.getMyNode()?.num ?? 0;
  return toPath([props.nodeNumber, ...d.routeBack, me], d.snrBack);
};
</script>
