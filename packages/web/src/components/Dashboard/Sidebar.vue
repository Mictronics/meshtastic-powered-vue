<template>
  <aside class="dashboard-sidebar relative flex flex-col" id="side-bar">
    <Button
      aria-label="Toggle sidebar"
      severity="secondary"
      variant="outlined"
      @click="emit('update:isSideBarVisible', !props.isSideBarVisible)"
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
      <PanelMenu :model="navPanelItems" class="w-full gap-1!" pt:panel:class="dashboard-panelmenu">
        <template #item="{ item }">
          <router-link v-if="item.to" :to="item.to" class="flex items-center group w-full">
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

          <button v-else type="button" class="flex items-center group w-full">
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
      <p v-if="isSideBarVisible && isChatView" class="py-2 logo-text">Channels</p>
      <PanelMenu
        v-if="isChatView"
        :model="channelPanelItems"
        class="w-full gap-1!"
        pt:panel:class="dashboard-panelmenu"
      >
        <template #item="{ item }">
          <router-link
            v-if="item.to"
            :to="item.to"
            class="flex items-center group w-full rounded-md"
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

          <button v-else type="button" class="flex items-center group w-full">
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

      <!-- Settings panel -->
      <p v-if="isSideBarVisible && isSettingsView" class="py-2 logo-text">Settings</p>
      <PanelMenu
        v-if="isSettingsView"
        :model="settingsPanelItems"
        class="w-full gap-1!"
        pt:panel:class="dashboard-panelmenu"
      >
        <template #item="{ item }">
          <router-link
            v-if="item.to"
            :to="item.to"
            class="flex items-center group w-full rounded-md"
            :class="{ 'bg-slate-200 dark:bg-slate-700': item.active }"
          >
            <component :is="item.myIcon" />
            <span v-if="isSideBarVisible" class="ml-2">{{ item.label }}</span>
          </router-link>
        </template>
      </PanelMenu>

      <!-- Device info -->
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

      <!-- Application panel -->
      <PanelMenu :model="appPanelItems" class="w-full gap-1!" pt:panel:class="dashboard-panelmenu">
        <template #item="{ item }">
          <a class="flex items-center cursor-pointer group">
            <component :is="item.myIcon" />
            <span v-if="isSideBarVisible" class="ml-2">{{ item.label }}</span>
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
      <p>{{ version }} #{{ commitHash }}</p>
    </div>
  </aside>
  <Dialog v-model:visible="visibleToolDialog" modal header="Tools" class="min-h-1/2">
    <ToolsDialog />
  </Dialog>
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
  Wrench,
  RadioTower,
  Component,
  Router,
} from 'lucide-vue-next';
import { ref, computed, watchEffect, watch } from 'vue';
import { useConnectionStore } from '@/composables/stores/connection/useConnectionStore';
import { ConnectionStatus } from '@/composables/stores/connection/types';
import { useDeviceStore } from '@/composables/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/stores/nodeDB/useNodeDBStore';
import { useColorMode, useCycleList, useMediaQuery } from '@vueuse/core';
import DeviceInfo from '@/components/Dashboard/DeviceInfo.vue';
import ToolsDialog from './Pages/ToolsDialog.vue';
import type { FunctionalComponent } from 'vue';
import type { LucideProps } from 'lucide-vue-next';
import { Protobuf } from '@meshtastic/core';
import { useRoute } from 'vue-router';
import { computedWithControl } from '@vueuse/core';

const BREAKPOINT_MD = 768;

type NavPanelItem = {
  label: string;
  myIcon: FunctionalComponent<LucideProps>;
  badge?: number | string;
  severity?: 'info' | 'warn' | 'success' | 'danger' | 'secondary';
  to?: string;
};

type ChannelPanelItem = {
  id: string | number;
  label: string;
  badge?: number | string;
  severity?: 'info' | 'warn' | 'success' | 'danger' | 'secondary';
  to?: string;
  active: boolean;
};

const emit = defineEmits<{
  (e: 'update:isSideBarVisible', value: boolean): void;
}>();

const props = defineProps<{
  isSideBarVisible: boolean;
}>();

const route = useRoute();
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
  return device.value?.metadata.firmwareVersion || 'N/A';
});
const ownLongName = computed(() => myNode.value?.user?.longName);
const ownShortName = computed(() => myNode.value?.user?.shortName);
const ownNodeId = computed(() => {
  return device.value?.myNodeNum;
});

const myNode = computed(() => nodeDBStore.nodeDatabase.value?.getMyNode());
const batteryLevel = computed(() => myNode.value?.deviceMetrics?.batteryLevel);
const voltage = computed(() => myNode.value?.deviceMetrics?.voltage);
const online = computed(() => myNode.value?.localStats?.numOnlineNodes || '-');
const visibleToolDialog = ref(false);
const isLargeScreen = useMediaQuery(`(min-width: ${BREAKPOINT_MD}px)`);

const nodeCount = computed(() => {
  const nm = nodeDBStore.nodeDatabase.value?.nodeMap;
  if (nm) {
    return Object.entries(nm).length;
  }
  return '-';
});

// Device mutates internally; deep tracking required
const unreadMessageCount = computedWithControl(
  device,
  () => {
    return device.value?.getAllUnreadCount();
  },
  { deep: true }
);

const navPanelItems = computed<NavPanelItem[]>(() => [
  {
    label: 'Messages',
    myIcon: MessageSquareText,
    badge: unreadMessageCount.value,
    severity: 'info',
    to: '/chat',
  },
  {
    label: 'Map',
    myIcon: Map,
    to: '/map',
  },
  {
    label: 'Settings',
    myIcon: Settings,
    to: '/settings/radio',
  },
  {
    label: 'Nodes',
    myIcon: Users,
    badge: `${online.value} / ${nodeCount.value}`,
    severity: 'secondary',
    to: '/nodes',
  },
]);

const appPanelItems = computed(() => [
  {
    label: 'Color Scheme',
    myIcon: modeIcon.value,
    command: (_event?: any) => {
      next();
    },
  },
  {
    label: 'Tools',
    myIcon: Wrench,
    command: (_event?: any) => {
      visibleToolDialog.value = true;
    },
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
      .slice(0, 7) || 'Unknown'
  );
});

const isChatView = computed(() => route.matched.some((r) => r.meta?.viewChat));
const channelPanelItems = computed(() => {
  const chList: ChannelPanelItem[] = [];
  const activeChannel = route.params.id;

  if (!device.value) return chList;

  const channels = device.value?.channels ?? {};
  for (const [, v] of Object.entries(channels) as [string, Protobuf.Channel.Channel][]) {
    if (v.role === Protobuf.Channel.Channel_Role.DISABLED) continue;

    const unreadCount = device.value.getUnreadCount(v.index);

    chList.push({
      id: v.index,
      label: v.settings?.name || `Channel ${v.index}`,
      to: `/chat/broadcast/${v.index}`,
      active: activeChannel === v.index.toString(),
      badge: unreadCount > 0 ? unreadCount : undefined,
      severity: unreadCount > 0 ? 'info' : undefined,
    });
  }

  return chList;
});

watch(
  isLargeScreen,
  (large) => {
    emit('update:isSideBarVisible', large);
  },
  { immediate: true }
);

const isSettingsView = computed(() => route.matched.some((r) => r.meta?.viewSettings));
const settingsPanelItems = computed(() => [
  {
    label: 'Radio',
    myIcon: RadioTower,
    to: '/settings/radio',
  },
  {
    label: 'Device',
    myIcon: Router,
    to: '/settings/device',
  },
  {
    label: 'Modules',
    myIcon: Component,
    to: '/settings/modules',
  },
]);
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
