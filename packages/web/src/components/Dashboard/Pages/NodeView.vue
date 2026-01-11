<template>
  <div class="flex">
    <DataTable
      :value="nodes"
      dataKey="num"
      size="small"
      paginator
      :rows="10"
      filterDisplay="row"
      :globalFilterFields="['user.longName', 'user.macaddr', 'hopsAway']"
      v-model:filters="filters"
    >
      <template #header>
        <IconField>
          <InputIcon>
            <IconSearch :size="15" />
          </InputIcon>
          <InputText v-model="filters['global'].value" placeholder="Keyword Search" size="small" />
        </IconField>
      </template>
      <template #empty>No nodes found.</template>
      <Column field="avatar" class="">
        <template #body="{ data }">
          {{ data.user.shortName }}
        </template>
      </Column>
      <Column field="longName" filterField="user.longName" header="Long Name" class="" sortable>
        <template #body="{ data }">
          {{ formatName(data.num, data.user.shortName, data.user.longName).long }}
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
      <Column field="hopsAway" filterField="hopsAway" header="Connection" class="" sortable>
        <template #body="{ data }">
          {{ formatHops(data.hopsAway, data.viaMqtt) }}
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
      <Column field="lastHeard" header="Last Heard" class="" sortable>
        <template #body="{ data }">
          {{ formatLastHeard(data.lastHeard) }}
        </template>
      </Column>
      <Column field="lastHeard" header="Last Heard" class="" sortable>
        <template #body="{ data }">
          <component :is="formatEncryption(data.user.publicKey)" :size="20" />
        </template>
      </Column>
      <Column field="macAddr" filterField="user.macaddr" header="MAC Address" class="" sortable>
        <template #body="{ data }">
          {{ formatMacAddr(data.user.macaddr) }}
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <InputText
            v-model="filterModel.value"
            type="text"
            @input="filterCallback()"
            placeholder="Search by MAC"
            size="small"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRaw } from 'vue';
import { formatTimeAgoIntl, watchImmediate } from '@vueuse/core';
import { base16 } from 'rfc4648';
import { FilterMatchMode } from '@primevue/core/api';
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  'user.longName': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  'user.macaddr': { value: null, matchMode: FilterMatchMode.CONTAINS },
  hopsAway: { value: null, matchMode: FilterMatchMode.EQUALS },
});
const nodes = ref([
  {
    $typeName: 'meshtastic.NodeInfo',
    num: 1259900669,
    snr: 1.75,
    lastHeard: 1768098225,
    channel: 0,
    viaMqtt: false,
    isFavorite: false,
    isIgnored: false,
    isKeyManuallyVerified: false,
    user: {
      $typeName: 'meshtastic.User',
      id: '!4b188efd',
      longName: 'Brieftaube Nest',
      shortName: 'BrtN',
      macaddr: {
        '0': 224,
        '1': 61,
        '2': 75,
        '3': 24,
        '4': 142,
        '5': 253,
      },
      hwModel: 95,
      isLicensed: false,
      role: 0,
      publicKey: {
        '0': 63,
        '1': 19,
        '2': 133,
        '3': 31,
        '4': 0,
        '5': 5,
        '6': 172,
        '7': 244,
        '8': 62,
        '9': 37,
        '10': 175,
        '11': 211,
        '12': 253,
        '13': 192,
        '14': 143,
        '15': 80,
        '16': 221,
        '17': 48,
        '18': 249,
        '19': 1,
        '20': 14,
        '21': 86,
        '22': 248,
        '23': 226,
        '24': 127,
        '25': 61,
        '26': 89,
        '27': 7,
        '28': 51,
        '29': 254,
        '30': 91,
        '31': 78,
      },
      isUnmessagable: false,
    },
    deviceMetrics: {
      $typeName: 'meshtastic.DeviceMetrics',
      batteryLevel: 92,
      voltage: 4.085999965667725,
      channelUtilization: 14.519999504089355,
      airUtilTx: 3.7871389389038086,
      uptimeSeconds: 4937202,
    },
    hopsAway: 7,
  },
]);
watchImmediate(
  useNodeDBStore().nodeDatabase,
  (n) => {
    const test = n?.getNodes().slice(1, 5);
    //console.log('###', toRaw(test));
  },
  {
    deep: true,
  }
);

function formatName(num: number, shortName?: string, longName?: string) {
  const short = shortName ?? num.toString(16).slice(-4).toUpperCase();
  const long = longName ?? short;
  return {
    short,
    long,
  };
}

function formatMacAddr(mac: { [key: string]: number }) {
  return (
    base16
      .stringify(Object.values(mac))
      .match(/.{1,2}/g)
      ?.join(':') ?? 'Unknown'
  );
}

function formatLastHeard(epoch?: number) {
  const date = new Date(0);
  if (epoch === undefined) {
    return 'Unknown';
  }
  date.setUTCSeconds(epoch);
  return formatTimeAgoIntl(date);
}

function formatHops(hops?: number, viaMqtt?: boolean) {
  const s1 =
    hops !== undefined
      ? viaMqtt === false && hops === 0
        ? 'direct'
        : `${hops?.toString()} ${hops ?? 0 > 1 ? 'hops' : 'hop'}`
      : 'Unknown';
  const s2 = viaMqtt === true ? ' via MQTT' : '';
  return s1 + s2;
}

function formatEncryption(pki?: { [key: string]: number }) {
  if (pki && Object.entries(pki).length > 0) {
    return 'IconLock';
  } else {
    return 'IconLockOpen';
  }
}
</script>

<style lang="css" scoped></style>
