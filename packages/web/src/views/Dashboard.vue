<template>
  <Toast position="bottom-right" />
  <main>
    <div class="w-full flex">
      <Sidebar
        :is-side-bar-visible="useAppStore().appData.isSideBarVisible"
        @event-toggle-sidebar="onToggleSidebar"
      />
      <div class="w-full h-full">
        <RouterView />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import Header from '@/components/Dashboard/Header.vue';
import Sidebar from '@/components/Dashboard/Sidebar.vue';

function onToggleSidebar() {
  useAppStore().appData.isSideBarVisible = !useAppStore().appData.isSideBarVisible;
}
</script>

<style lang="css" scoped></style>
