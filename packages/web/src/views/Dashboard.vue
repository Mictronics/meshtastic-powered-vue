<template>
  <main class="min-h-screen flex flex-col">
    <div class="w-full flex flex-1">
      <Sidebar
        :is-side-bar-visible="useAppStore().appData.isSideBarVisible"
        @update:is-side-bar-visible="onToggleSidebar"
      />
      <div class="w-full h-full border-b border-slate-200 dark:border-slate-600">
        <RouterView />
      </div>
    </div>
    <footer class="flex justify-center px-4 text-sm lg:text-md">
      <p class="ml-auto mr-auto text-slate-400 dark:text-slate-600">
        Meshtastic® is a registered trademark of Meshtastic LLC. |
        <a
          rel="noopener noreferrer"
          href="https://meshtastic.org/docs/legal"
          class="hover:underline text-link"
        >
          Legal Information
        </a>
      </p>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import Sidebar from '@/components/Dashboard/Sidebar.vue';

const onToggleSidebar = (isSideBarVisible: boolean) => {
  useAppStore().appData.isSideBarVisible = isSideBarVisible;
};
</script>

<style lang="css" scoped></style>
