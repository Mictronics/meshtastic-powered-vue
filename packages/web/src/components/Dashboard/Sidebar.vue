<template>
  <aside class="dashboard-sidebar" id="side-bar">
    <div class="flex justify-center items-center dashboard-header">
      <img
        src="@/assets/logo.svg"
        alt="Meshtastic Powered Logo"
        class="size-10 flex-shrink-0 rounded-l mx-1"
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
          <a class="flex items-center py-1 cursor-pointer group">
            <component :is="item.icon" />
            <span v-if="isSideBarVisible" :class="['ml-2']">{{ item.label }}</span>
            <Badge
              v-if="item.badge"
              :severity="item.severity"
              size="small"
              class="ml-auto"
              :value="item.badge"
            />
          </a>
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
            <component :is="item.icon" />
            <span v-if="isSideBarVisible" :class="['ml-2']">{{ item.label }}</span>
          </a>
        </template>
      </PanelMenu>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watchEffect } from 'vue';
import { useConnectionStore } from '@/composables/core/stores/connection/useConnectionStore';
import { ConnectionStatus } from '@/composables/core/stores/connection/types';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useNodeDBStore } from '@/composables/core/stores/nodeDB/useNodeDBStore';
import { useColorMode, useCycleList } from '@vueuse/core';
import DeviceInfo from '@/components/Dashboard/DeviceInfo.vue';

const props = defineProps<{
  isSideBarVisible: boolean;
}>();

const connection = computed(() => {
  const activeConnectionId = useConnectionStore().activeConnectionId.value;
  if (activeConnectionId) {
    return useConnectionStore().connections.value.get(activeConnectionId);
  }
});
const connectionName = computed(() => {
  return connection.value?.name;
});
const connectionStatus = computed(() => {
  return connection.value?.status || ConnectionStatus.Disconnected;
});

const device = computed(() => {
  return useDeviceStore().device.value;
});
const firmwareVersion = computed(() => {
  return device.value?.metadata.firmwareVersion || undefined;
});
const ownLongName = computed(() => {
  return 'NFN-866#9 Mesh Observer';
});
const ownShortName = computed(() => {
  return '9F31';
});
const ownNodeId = computed(() => {
  return device.value?.myNodeNum;
});

const batteryLevel = shallowRef(0);
const voltage = shallowRef(0.0);

const nodeCount = computed(() => {
  const nm = useNodeDBStore().nodeDatabase.value?.nodeMap;
  if (nm) {
    return Object.entries(nm).length;
  }
  return undefined;
});

const devicePanelItems = ref([
  {
    label: 'Messages',
    icon: 'IconMessageSquareText',
    badge: 2,
    severity: 'info',
    command: () => {
      // You can define action here if needed
      console.log('Test1');
    },
  },
  {
    label: 'Map',
    icon: 'IconMap',
    command: () => {
      // Define action here if needed
      console.log('Test2');
    },
  },
  {
    label: 'Settings',
    icon: 'IconSettings',
    command: () => {
      // Define action here if needed
      console.log('Test3');
    },
  },
  {
    label: 'Nodes',
    icon: 'IconUsers',
    badge: nodeCount,
    severity: 'secondary',
    command: () => {
      // Define action here if needed
      console.log('Test4');
    },
  },
]);

const modeIcon = computed(() => {
  switch (state.value) {
    case 'light':
      return 'IconSun';
    case 'dark':
      return 'IconMoon';
    case 'auto':
    default:
      return 'IconSunMoon';
  }
});

const appPanelItems = ref([
  {
    label: 'Color Scheme',
    get icon() {
      return modeIcon.value;
    },
    command: () => {
      next();
    },
  },
]);

const mode = useColorMode({
  emitAuto: true,
});
const { state, next } = useCycleList(['auto', 'light', 'dark'] as const, { initialValue: mode });
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
