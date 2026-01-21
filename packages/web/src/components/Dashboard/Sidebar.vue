<template>
  <aside class="dashboard-sidebar relative flex flex-col" id="side-bar">
    <Button
      severity="secondary"
      variant="outlined"
      @click="$emit('eventToggleSidebar')"
      class="absolute top-4 right-0 translate-x-1/2 px-2 py-2 z-50 bg-white dark:bg-slate-600"
    >
      <Menu :size="15" />
    </Button>
    <div class="flex justify-center items-center dashboard-header">
      <img
        src="@/assets/logo.svg"
        alt="Meshtastic Powered Logo"
        class="size-10 shrink-0 rounded-l mx-1 dark:brightness-75"
      />
      <div
        class="text-xl text-center flex flex-col items-start h-full p-1 logo-text"
        v-show="isSideBarVisible"
      >
        <div>Meshtastic</div>
        <div class="text-xs font-thin italic">Powered</div>
      </div>
    </div>
    <div class="sidebar-entries whitespace-nowrap">
      <!-- Nav panel -->
      <PanelMenu :model="navPanelItems" class="w-full gap-2!" pt:panel:class="dashboard-panelmenu">
        <template #item="{ item }">
          <router-link v-if="item.to" :to="item.to" class="flex items-center py-1 group w-full">
            <component :is="item.myIcon" />
            <span v-if="isSideBarVisible" class="ml-2">{{ item.label }}</span>
            <Badge
              v-if="item.badge"
              :severity="item.severity"
              size="small"
              class="ml-auto"
              :value="item.badge"
            />
          </router-link>

          <button v-else type="button" class="flex items-center py-1 group w-full">
            <component :is="item.myIcon" />
            <span v-if="isSideBarVisible" class="ml-2">{{ item.label }}</span>
            <Badge
              v-if="item.badge"
              :severity="item.severity"
              size="small"
              class="ml-auto"
              :value="item.badge"
            />
          </button>
        </template>
      </PanelMenu>
      <!-- Channel panel -->
      <p v-if="isSideBarVisible && isChatView" class="py-4 logo-text">Channels</p>
      <PanelMenu
        v-if="isChatView"
        :model="channelPanelItems"
        class="w-full gap-2!"
        pt:panel:class="dashboard-panelmenu"
      >
        <template #item="{ item }">
          <router-link
            v-if="item.to"
            :to="item.to"
            class="flex items-center py-1 group w-full rounded-md"
            :class="{ 'bg-slate-200 dark:bg-slate-700': item.active }"
          >
            <MessagesSquare />
            <span v-if="isSideBarVisible" class="ml-2">{{ item.label }}</span>
            <span v-else class="ml-2">{{ item.id }}</span>
            <Badge
              v-if="item.badge"
              :severity="item.severity"
              size="small"
              class="ml-auto"
              :value="item.badge"
            />
          </router-link>

          <button v-else type="button" class="flex items-center py-1 group w-full">
            <MessagesSquare />
            <span v-if="isSideBarVisible" class="ml-2">{{ item.label }}</span>
            <span v-else class="ml-2">{{ item.id }}</span>
            <Badge
              v-if="item.badge"
              :severity="item.severity"
              size="small"
              class="ml-auto"
              :value="item.badge"
            />
          </button>
        </template>
      </PanelMenu>

      <DeviceInfo
        :connection-status="connectionStatus"
        :connection-name="connectionName"
        :long-name="ownLongName"
        :short-name="ownShortName"
        :node-id="ownNodeId"
        :is-side-bar-visible="isSideBarVisible"
        :firmware-version="firmwareVersion"
        :battery-level="batteryLevel"
        :voltage="voltage"
      />
      <PanelMenu :model="appPanelItems" class="w-full gap-2!" pt:panel:class="dashboard-panelmenu">
        <template #item="{ item }">
          <a class="flex items-center py-1 cursor-pointer group">
            <component :is="item.myIcon" />
            <span v-if="isSideBarVisible" :class="['ml-2']">{{ item.label }}</span>
          </a>
        </template>
      </PanelMenu>
    </div>
    <div
      v-if="isSideBarVisible"
      class="mt-auto text-center text-sm text-slate-500/40 dark:text-slate-400/40"
    >
      <a
        href="https://github.com/Mictronics/meshtastic-powered-vue"
        target="_blank"
        class="hover:underline text-link"
      >
        {{ appName }}
      </a>
      <p>Michael Wolf</p>
      <a class="hover:underline text-link" href="https://www.mictronics.de" target="_blank">
        Mictronics
      </a>
      <p>{{ version }}</p>
      <p>#{{ commitHash }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  MessageSquareText,
  MessagesSquare,
  Map,
  Settings,
  Users,
  Sun,
  Moon,
  SunMoon,
  Menu,
} from 'lucide-vue-next';
import { computed, watchEffect } from 'vue';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { ConnectionStatus } from '@/composables/core/stores/connection/types';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';
import { useColorMode, useCycleList } from '@vueuse/core';
import DeviceInfo from '@/components/Dashboard/DeviceInfo.vue';
import type { FunctionalComponent } from 'vue';
import type { LucideProps } from 'lucide-vue-next';
import { Protobuf, Types } from '@meshtastic/core';
import { useRoute, type RouteLocationNormalized } from 'vue-router';

type NavPanelItem = {
  label: string;
  myIcon: FunctionalComponent<LucideProps>;
  badge?: number;
  severity?: 'info' | 'warn' | 'success' | 'danger' | 'secondary';
  to?: string;
};

type ChannelPanelItem = {
  id: string | number;
  label: string;
  badge?: number;
  severity?: 'info' | 'warn' | 'success' | 'danger' | 'secondary';
  to?: string;
  active: boolean;
};

const emit = defineEmits<{
  (e: 'eventToggleSidebar'): void;
}>();
const props = defineProps<{
  isSideBarVisible: boolean;
}>();

const route = useRoute() as RouteLocationNormalized;
const connectionStore = useConnectionStore();
const deviceStore = useDeviceStore();
const nodeDBStore = useNodeDBStore();

const connection = computed(() => {
  const id = connectionStore.activeConnectionId.value;
  return id ? connectionStore.connections.value.get(id) : undefined;
});
const connectionName = computed(() => {
  return connection.value?.name;
});
const connectionStatus = computed(() => {
  return connection.value?.status || ConnectionStatus.Disconnected;
});

const device = computed(() => {
  return deviceStore.device.value;
});
const firmwareVersion = computed(() => {
  return device.value?.metadata.firmwareVersion || undefined;
});
const ownLongName = computed(() => myNode.value?.user?.longName);
const ownShortName = computed(() => myNode.value?.user?.shortName);
const ownNodeId = computed(() => {
  return device.value?.myNodeNum;
});

const myNode = computed(() => nodeDBStore.nodeDatabase.value?.getMyNode());
const batteryLevel = computed(() => myNode.value?.deviceMetrics?.batteryLevel);
const voltage = computed(() => myNode.value?.deviceMetrics?.voltage);

const nodeCount = computed(() => {
  const nm = nodeDBStore.nodeDatabase.value?.nodeMap;
  if (nm) {
    return Object.entries(nm).length;
  }
  return undefined;
});

const navPanelItems = computed<NavPanelItem[]>(() => [
  {
    label: 'Messages',
    myIcon: MessageSquareText,
    badge: 2,
    severity: 'info',
    to: '/chat',
  },
  {
    label: 'Map',
    myIcon: Map,
  },
  {
    label: 'Settings',
    myIcon: Settings,
  },
  {
    label: 'Nodes',
    myIcon: Users,
    badge: nodeCount.value,
    severity: 'secondary',
    to: '/nodes',
  },
]);

const appPanelItems = computed(() => [
  {
    label: 'Color Scheme',
    myIcon: modeIcon.value,
    command: () => next(),
  },
]);

type Theme = 'auto' | 'light' | 'dark';
const mode = useColorMode({
  selector: 'html',
  attribute: 'class',
  emitAuto: true,
});
const { state, next } = useCycleList<Theme>(['auto', 'light', 'dark'], {
  initialValue: mode.value as Theme,
});

const modeIcon = computed(() => {
  if (state.value === 'light') return Sun;
  if (state.value === 'dark') return Moon;
  return SunMoon;
});
watchEffect(() => (mode.value = state.value));

const appName = computed(() => {
  return String(import.meta.env.VITE_APP_NAME)?.toWellFormed() || '';
});
const version = computed(() => {
  return String(import.meta.env.VITE_VERSION)?.toUpperCase() || '';
});
const commitHash = computed(() => {
  return (
    String(import.meta.env.VITE_COMMIT_HASH)
      ?.toUpperCase()
      .slice(0, 7) || 'Unkown'
  );
});

const isChatView = computed(() => route.matched.some((r) => r.meta?.viewChat));
const channelPanelItems = computed<ChannelPanelItem[]>(() => {
  const chList: ChannelPanelItem[] = [];
  const activeChannel = route.params.id;
  if (device.value) {
    for (const [k, v] of Object.entries(device.value.channels) as [
      k: string,
      v: Protobuf.Channel.Channel,
    ][]) {
      if (v.role !== Protobuf.Channel.Channel_Role.DISABLED) {
        chList.push({
          id: v.index,
          label: v.settings?.name || 'Unknown',
          to: `/chat/broadcast/${v.index}`,
          active: activeChannel === v.index.toString(),
        });
      }
    }
  }
  return chList;
});
</script>

<style lang="css" scoped>
.p-tooltip-text {
  font-size: 10px !important;
}

#side-bar {
  transition: 300ms;
}

.sidebar-entries {
  align-items: baseline;
  display: flex;
  flex-direction: column;
  white-space: nowrap;
}
</style>
