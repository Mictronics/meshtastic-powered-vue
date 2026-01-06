<template>
  <div class="flex flex-col gap-2 py-4 own-node-info">
    <div class="flex items-center gap-1 py-1 flex-shrink-0">
      <Avatar
        shape="circle"
        class="text-xs font-light bg-[rgb(var(--bg-r),var(--bg-g),var(--bg-b))]"
        :style="{
          '--bg-r': avatarColor.background.r,
          '--bg-g': avatarColor.background.g,
          '--bg-b': avatarColor.background.b,
          color: avatarColor.text,
        }"
      >
        {{ props.shortName }}
      </Avatar>
      <p
        v-if="isSideBarVisible"
        class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate"
        v-tooltip.right="{
          value: props.longName,
          pt: {
            arrow: {
              style: {
                borderBottomColor: 'var(--p-secondary-color)',
              },
            },
            text: '!bg-secondary !text-secondary-contrast !font-light !text-xs',
          },
        }"
      >
        {{ props.longName }}
      </p>
    </div>
    <Button
      asChild
      v-slot="slotProps"
      aria-label="Go Back"
      size="small"
      severity="secondary"
      variant="text"
    >
      <RouterLink to="/" :class="slotProps.class + ' connection-info'">
        <span
          :class="'h-2.5 w-2.5 ml-2 rounded-full flex-shrink-0 ' + connectionStatus.color"
          aria-hidden="true"
        />
        {{ props.isSideBarVisible ? connectionStatus.name : '' }}
      </RouterLink>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { watchDeep } from '@vueuse/core';
import { useColor } from '@/composables/core/utils/useColor';
import { ConnectionStatus, type IConnection } from '@/composables/core/stores/connection/types';

const props = defineProps<{
  shortName: string;
  longName: string;
  isSideBarVisible: boolean;
  connection: IConnection;
}>();

const connectionStatus = ref({
  icon: 'IconUnlink',
  status: 'Disconnected',
  color: 'bg-gray-400',
  name: props.connection.name,
});

const avatarColor = computed(() => {
  const bgColor = useColor().getColorFromNodeNum(546839975);
  const isLight = useColor().isLightColor(bgColor);
  const textColor = isLight ? '#000000' : '#FFFFFF';
  return {
    background: bgColor,
    text: textColor,
  };
});

const getStatusAttr = (status?: ConnectionStatus) => {
  if (!status) {
    return {
      icon: 'IconUnlink',
      status: 'Disconnected',
      color: 'bg-gray-400',
      name: props.connection.name,
    };
  }
  switch (status) {
    case ConnectionStatus.Connected:
    case ConnectionStatus.Configured:
    case ConnectionStatus.Online:
      return {
        icon: 'IconLink',
        status: 'Connected',
        color: 'bg-emerald-500',
        name: props.connection.name,
      };
    case ConnectionStatus.Connecting:
    case ConnectionStatus.Configuring:
    case ConnectionStatus.Disconnecting:
      return {
        icon: 'IconUnlink',
        status: 'Configuring',
        color: 'bg-amber-500',
        name: props.connection.name,
      };
    case ConnectionStatus.Error:
      return {
        icon: 'IconUnlink',
        status: 'Error',
        color: 'bg-red-500',
        name: props.connection.name,
      };
    default:
      return {
        icon: 'IconUnlink',
        status: 'Disconnected',
        color: 'bg-gray-400',
        name: props.connection.name,
      };
  }
};
// Track changes in active connection
watchDeep(props.connection, (conn) => {
  connectionStatus.value = getStatusAttr(conn.status);
});
</script>

<style lang="css" scoped>
.connection-info {
  display: flex;
  justify-content: flex-start;
}
</style>
