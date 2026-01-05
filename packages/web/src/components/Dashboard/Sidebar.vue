<template>
  <aside class="dashboard-sidebar" id="side-bar">
    <div class="flex justify-center items-center dashboard-header">
      <img
        src="@/assets/logo.svg"
        alt="Meshtastic Powered Logo"
        class="size-10 flex-shrink-0 rounded-l mx-1"
      />
      <div
        class="text-xl text-center flex flex-col items-start h-full p-1"
        v-show="isSideBarVisible"
      >
        <div>Meshtastic</div>
        <div class="text-xs font-thin italic">Powered</div>
      </div>
    </div>
    <div class="sidebar-entries h-[calc(100vh-3rem)] whitespace-nowrap">
      <PanelMenu :model="items" class="w-full gap-2!" pt:panel:class="dashboard-panelmenu">
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
    </div>
  </aside>
</template>

<script setup lang="ts">
import { defineComponent, ref } from 'vue';

const props = defineProps<{
  newMessageCount: number;
  nodeCount: number;
}>();
const isSideBarVisible = ref(true);

const items = ref([
  {
    label: 'Messages',
    icon: 'IconMessageSquareText',
    badge: props.newMessageCount,
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
    badge: props.nodeCount,
    severity: 'secondary',
    command: () => {
      // Define action here if needed
      console.log('Test4');
    },
  },
]);

function toggleSideBar() {
  isSideBarVisible.value = !isSideBarVisible.value;
}

defineExpose({ toggleSideBar });
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
