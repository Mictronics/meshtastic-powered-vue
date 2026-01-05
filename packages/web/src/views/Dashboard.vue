<template>
  <Toast position="bottom-right" />
  <main class="dashboard-view">
    <div class="w-full flex">
      <Sidebar :node-count="nodeCount" :new-message-count="newMessageCount" ref="sideBar" />
      <div class="w-full h-full">
        <Header @event-toggle-sidebar="onToggleSidebar" />
        <div class="w-full h-[calc(100vh-50px)]">
          <RouterView />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Header from '@/components/Dashboard/Header.vue';
import Sidebar from '@/components/Dashboard/Sidebar.vue';

type ToggleSideBarHandle = { toggleSideBar: () => void };
const sideBar = ref<ToggleSideBarHandle | null>(null);

const nodeCount = ref(123);
const newMessageCount = ref(5);

function onToggleSidebar() {
  sideBar.value?.toggleSideBar();
}
</script>

<style lang="css" scoped></style>
