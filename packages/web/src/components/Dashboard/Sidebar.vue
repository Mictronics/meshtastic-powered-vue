<template>
  <aside class="dashboard-sidebar" id="side-bar">
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
      <PanelMenu
        :model="devicePanelItems"
        class="w-full gap-2!"
        pt:panel:class="dashboard-panelmenu"
      >
        <template #item="{ item }">
          <router-link
            v-if="item.to"
            :to="item.to"
            class="flex items-center py-1 group w-full"
            @click.native="item.command && item.command"
          >
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

          <button
            v-else
            type="button"
            class="flex items-center py-1 group w-full"
            @click="item.command && item.command"
          >
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
  </aside>
</template>

<script setup lang="ts">
import { MessageSquareText, Map, Settings, Users, Sun, Moon, SunMoon } from 'lucide-vue-next';
import { ref, computed, watchEffect, type Component } from 'vue';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { ConnectionStatus } from '@/composables/core/stores/connection/types';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';
import { useColorMode, useCycleList } from '@vueuse/core';
import DeviceInfo from '@/components/Dashboard/DeviceInfo.vue';
import type { FunctionalComponent } from 'vue';
import type { LucideProps } from 'lucide-vue-next';

type DevicePanelItem = {
  label: string;
  myIcon: FunctionalComponent<LucideProps>;
  command: () => void;
  badge?: number;
  severity?: 'info' | 'warn' | 'success' | 'danger' | 'secondary';
  to?: any;
};

const props = defineProps<{
  isSideBarVisible: boolean;
}>();

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

const devicePanelItems = computed<DevicePanelItem[]>(() => [
  {
    label: 'Messages',
    myIcon: MessageSquareText,
    badge: 2,
    severity: 'info',
    command: () => console.log('Test1'),
  },
  {
    label: 'Map',
    myIcon: Map,
    command: () => console.log('Test2'),
  },
  {
    label: 'Settings',
    myIcon: Settings,
    command: () => console.log('Test3'),
  },
  {
    label: 'Nodes',
    myIcon: Users,
    badge: nodeCount.value,
    severity: 'secondary',
    command: () => console.log('Test4'),
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
