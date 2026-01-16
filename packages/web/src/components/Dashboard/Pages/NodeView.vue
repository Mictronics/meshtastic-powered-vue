<template>
  <DataTable
    :value="nodes"
    dataKey="num"
    size="small"
    filterDisplay="row"
    :globalFilterFields="['longName', 'macAddr', 'hopsAway', 'hwModel']"
    v-model:filters="filters"
    scrollable
    scrollHeight="flex"
    :virtualScrollerOptions="{ itemSize: 44 }"
    :removableSort="true"
    @sort="onTableSort"
  >
    <template #header>
      <div class="flex justify-end">
        <Field>
          <InputIcon>
            <Search :size="15" />
          </InputIcon>
          <InputText v-model="filters['global'].value" placeholder="Keyword Search" size="small" />
        </Field>
      </div>
    </template>
    <template #empty>No nodes found or match your filter.</template>
    <Column field="isFavorite" class="" sortable sortField="isFavorite">
      <template #body="{ data }">
        <NodeAvatar
          :isFavorite="data.isFavorite"
          :nodeNumber="data.nodeNumber"
          :shortName="data.shortName"
        />
      </template>
      <template #sorticon>
        <Star v-if="isFavoriteSort" />
        <StarOff v-else />
      </template>
    </Column>
    <Column field="longName" filterField="longName" header="Long Name" class="" sortable>
      <template #body="{ data }">
        {{ data.longName }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          @input="filterCallback()"
          placeholder="Search by name"
          size="small"
        />
      </template>
    </Column>
    <Column
      field="hopsAway"
      filterField="hopsAway"
      header="Connection"
      class="connection-column"
      sortable
      sortField="numHops"
    >
      <template #body="{ data }">
        {{ data.hopsAway }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          class="connection-column-input"
          v-model="filterModel.value"
          type="text"
          @input="filterCallback()"
          size="small"
        />
      </template>
    </Column>
    <Column field="lastHeard" header="Last Heard" class="" sortable sortField="lastHeard">
      <template #body="{ data }">
        {{ formatLastHeard(data.lastHeard) }}
      </template>
    </Column>
    <Column field="features" header="Features">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Lock v-if="data.isEncrypted" :size="20" class="encryption-lock-icon" />
          <LockOpen v-else :size="20" class="encryption-unlock-icon" />
          <BatteryStatus v-if="data.batteryLevel !== undefined" :batteryLevel="data.batteryLevel" />
          <MessageSquareOff v-if="data.isUnmessagable" :size="20" class="unmessagabel-icon" />
          <Network v-if="data.viaMqtt" :size="20" class="via-mqtt-icon" />
        </div>
      </template>
    </Column>
    <Column field="snr" header="SNR" class="" sortable sortField="numSnr">
      <template #body="{ data }">
        {{ data.snr }}
      </template>
    </Column>
    <Column
      field="hwModel"
      filterField="hwModel"
      header="Hardware"
      class="hardware-column"
      sortable
    >
      <template #body="{ data }">
        {{ data.hwModel }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="text" @input="filterCallback()" size="small" />
      </template>
    </Column>
    <Column field="macAddr" filterField="macAddr" header="MAC Address" class="mac-column" sortable>
      <template #body="{ data }">
        {{ data.macAddr }}
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText
          v-model="filterModel.value"
          type="text"
          @input="filterCallback()"
          size="small"
          class="mac-column-input"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import {
  FileDiff,
  Search,
  Star,
  StarOff,
  Lock,
  LockOpen,
  MessageSquareOff,
  Network,
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { formatTimeAgoIntl } from '@vueuse/core';
import { FilterMatchMode } from '@primevue/core/api';
import {
  type IFormattedNode,
  useFormattedNodeDatabase,
} from '@/composables/core/utils/useFormattedNodeDatabase';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import BatteryStatus from '@/components/Dashboard/BatteryStatus.vue';
import { type DataTableSortEvent } from 'primevue';

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  longName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  macAddr: { value: null, matchMode: FilterMatchMode.CONTAINS },
  hopsAway: { value: null, matchMode: FilterMatchMode.EQUALS },
  hwModel: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});

const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const nodes = computed<IFormattedNode[]>(() => {
  return Object.values(nodeDatabase.value || {});
});

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

const isFavoriteSort = ref(false);
function onTableSort(e: DataTableSortEvent) {
  isFavoriteSort.value = e.sortField === 'isFavorite' && e.sortOrder === -1;
}
</script>

<style lang="css" scoped>
:deep(.p-datatable-tbody > tr) {
  height: 44px;
}
</style>
