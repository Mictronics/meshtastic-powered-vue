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
  >
    <template #header>
      <div class="flex justify-end">
        <IconField>
          <InputIcon>
            <IconSearch :size="15" />
          </InputIcon>
          <InputText v-model="filters['global'].value" placeholder="Keyword Search" size="small" />
        </IconField>
      </div>
    </template>
    <template #empty>No nodes found.</template>
    <Column field="avatar" class="">
      <template #body="{ data }">
        {{ data.shortName }}
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
    <Column field="lastHeard" header="Last Heard" class="" sortable>
      <template #body="{ data }">
        {{ data.lastHeard }}
      </template>
    </Column>
    <Column field="features" header="Features">
      <template #body="{ data }">
        <div class="flex gap-2">
          <IconLock v-if="data.isEncrypted" :size="20" class="encryption-lock-icon" />
          <IconLockOpen v-else :size="20" class="encryption-unlock-icon" />
          <IconMessageSquareOff v-if="data.isUnmessagable" :size="20" class="unmessagabel-icon" />
          <IconNetwork v-if="data.viaMqtt" :size="20" class="via-mqtt-icon" />
        </div>
      </template>
    </Column>
    <Column field="snr" header="SNR" class="" sortable>
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
import { ref, computed, toRaw } from 'vue';
import { watchImmediate } from '@vueuse/core';
import { FilterMatchMode } from '@primevue/core/api';
import {
  type IFormattedNode,
  useFormattedNodeDatabase,
} from '@/composables/core/utils/useFormattedNodeDatabase';

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  longName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  macAddr: { value: null, matchMode: FilterMatchMode.CONTAINS },
  hopsAway: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  hwModel: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
});
const nodes = ref<IFormattedNode[]>([]);
watchImmediate(
  useFormattedNodeDatabase().nodeDatabase,
  (n) => {
    nodes.value = Object.values(n || {});
    //console.log('###', toRaw(test));
  },
  {
    deep: true,
  }
);
</script>

<style lang="css" scoped></style>
