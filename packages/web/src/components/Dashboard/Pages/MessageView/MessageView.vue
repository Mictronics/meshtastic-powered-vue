<template>
  <div class="p-1 bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900">
    <!-- Message scroller -->
    <div class="relative mx-auto flex">
      <div class="flex-1">
        <VirtualScroller
          ref="scroller"
          :items="groupedMessages"
          :itemSize="52"
          showSpacer
          :scrollHeight="vsHeight"
          @scroll="onScroll"
        >
          <template v-slot:item="{ item }">
            <MessageItem :message="item" />
          </template>
        </VirtualScroller>

        <transition name="fade">
          <Button
            v-if="showScrollButton"
            rounded
            raised
            @click="scrollToBottom('smooth')"
            class="absolute bottom-4 z-10 shadow-lg animate-bounce"
            style="right: 18em !important"
            severity="secondary"
          >
            <CircleArrowDown :size="20" />
          </Button>
        </transition>
      </div>

      <!-- Nodes scroller -->
      <div class="w-64 relative border-l border-slate-200! dark:border-slate-600!">
        <div class="relative mr-4">
          <InputText
            v-model="searchQuery"
            placeholder="Search nodes..."
            class="w-full rounded-xl! border-slate-200! dark:border-slate-600! translate-x-2 bg-white dark:bg-slate-800"
            size="small"
          />
          <Search class="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400" :size="20" />
        </div>
        <VirtualScroller
          ref="rightScroller"
          :items="filteredNodes"
          :itemSize="52"
          showSpacer
          :scrollHeight="vsNodeHeight"
          class="h-full"
        >
          <template v-slot:item="{ item }">
            <div class="flex px-1 w-full" style="height: 52px" :key="item.nodeNumber">
              <router-link
                :to="'/chat/direct/' + item.nodeNumber"
                class="flex gap-1 items-center py-1 group w-full rounded-md"
              >
                <NodeAvatar
                  :isFavorite="item.isFavorite"
                  :nodeNumber="item.nodeNumber"
                  :shortName="item.shortName"
                />
                <span class="text-sm font-light text-ellipsis dark:text-slate-400">
                  {{ item.longName }}
                </span>
                <Badge
                  v-if="item.unreadCount"
                  severity="info"
                  size="small"
                  class="ml-auto"
                  :value="item.unreadCount"
                />
              </router-link>
            </div>
          </template>
        </VirtualScroller>
      </div>
    </div>
    <!-- Message input -->
    <MessageInput
      :max-bytes="200"
      :to="chatType === MessageType.Direct ? numericChatId : MessageType.Broadcast"
      @event-send-message="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { CircleArrowDown, Search } from 'lucide-vue-next';
import { ref, nextTick, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { computedWithControl, refDebounced, useDebounceFn } from '@vueuse/core';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/core/stores/message/useMessageStore';
import { useAppStore } from '@/composables/core/stores/app/useAppStore';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import { Types } from '@meshtastic/core';
import { orderBy } from 'lodash-es';
import { MessageType, MessageState } from '@/composables/core/stores/message/useMessageStore';
import type { Message } from '@/composables/core/stores/message/types';
import MessageItem from './MessageItem.vue';
import MessageInput from './MessageInput.vue';
import { useRandomId } from '@/composables/core/useRandomId';

type DividerMessage = {
  groupedType: 'divider';
  label: string;
  messageId: string;
  variant?: 'date' | 'unread';
};

type ChatMessage = Message & {
  groupedType: 'message';
  shortName?: string;
  longName?: string;
  isFavorite?: boolean;
  nodeNumber?: number;
  isSelf?: boolean;
};

export type MessageWithDivider = DividerMessage | ChatMessage;

// via router
const props = defineProps<{
  type: String; // broadcast or direct
  id: String; // channel or node id
}>();

const todayLabel = new Date().toLocaleDateString(undefined, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const deviceStore = useDeviceStore();
const messageStore = useMessageStore().messageStore;
const appStore = useAppStore();
const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
const scroller = ref();
const showScrollButton = ref(false);
const searchQuery = ref('');
const debouncedQuery = refDebounced(searchQuery, 150);
const isAtBottom = ref(true);
const sticky = ref(true);
const SCROLL_THRESHOLD = 52;
const lastReadTimestamp = computed(() =>
  appStore.getLastRead(
    chatType.value === MessageType.Direct ? 'direct' : 'broadcast',
    numericChatId.value
  )
);

const numericChatId = computed(() => Number(props.id) || 0);
const chatType = computed(() =>
  props.type === 'direct' ? MessageType.Direct : MessageType.Broadcast
);

const device = computed(() => {
  return deviceStore.device.value;
});

const getNodeMeta = (from: number) => {
  const node = nodeDatabase.value[from];
  if (!node) return {};

  return {
    shortName: node.shortName,
    longName: node.longName,
    isFavorite: node.isFavorite,
    nodeNumber: node.nodeNumber,
  };
};

const groupedMessages = computedWithControl(
  [messageStore, numericChatId, chatType, lastReadTimestamp],
  () => {
    const grouped: MessageWithDivider[] = [];
    let lastDate: string = '';
    let messages: Message[] = [];

    switch (chatType.value) {
      case MessageType.Broadcast:
        messages =
          messageStore.value?.getMessages({
            type: MessageType.Broadcast,
            channelId: numericChatId.value,
          }) || [];
        break;

      case MessageType.Direct:
        messages =
          messageStore.value?.getMessages({
            type: MessageType.Direct,
            nodeA: device.value?.myNodeNum || 0,
            nodeB: numericChatId.value,
          }) || [];
        break;

      default:
        return [];
    }

    let unreadDividerInserted = false;
    const lastRead = lastReadTimestamp.value;

    messages.forEach((msg) => {
      const date = new Date(msg.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Insert date divider
      if (date !== lastDate) {
        grouped.push({
          groupedType: 'divider',
          messageId: `divider-${date}`,
          label: date === todayLabel ? 'Today' : date,
        });
        lastDate = date;
      }

      // Insert UNREAD divider once
      if (!unreadDividerInserted && lastRead !== undefined && msg.date > lastRead) {
        grouped.push({
          groupedType: 'divider',
          messageId: `unread-${msg.date}`,
          label: 'New messages',
          variant: 'unread',
        });
        unreadDividerInserted = true;
      }

      const myNodeNum = device.value?.myNodeNum ?? 0;

      grouped.push({
        ...msg,
        groupedType: 'message',
        ...getNodeMeta(msg.from),
        isSelf: msg.from === myNodeNum,
      });
    });

    return grouped;
  },
  { deep: true }
);

const filteredNodes = computedWithControl(
  [deviceStore.device, debouncedQuery, numericChatId],
  () => {
    let nodes = Object.values(nodeDatabase.value);
    const q = debouncedQuery.value.trim().toLowerCase();
    if (q) {
      nodes = nodes.filter((node) =>
        Object.values(node).some((v) => v?.toString().toLowerCase().includes(q))
      );
    }
    nodes = nodes.map((node) => ({
      ...node,
      unreadCount: device.value?.getUnreadCount(node.nodeNumber) ?? 0,
    }));
    nodes = orderBy(nodes, ['unreadCount', 'isFavorite'], ['desc', 'desc']);
    const id = numericChatId.value;
    nodes.sort((a, b) => (a.nodeNumber === id ? -1 : b.nodeNumber === id ? 1 : 0));
    return nodes;
  },
  { deep: true }
);

const updateLastRead = () => {
  if (!isAtBottom.value) return;

  const lastMsg = groupedMessages.value.filter((m) => m.groupedType === 'message').at(-1);

  if (!lastMsg) return;
  appStore.setLastRead(
    chatType.value === MessageType.Direct ? 'direct' : 'broadcast',
    numericChatId.value,
    lastMsg.date
  );
};

const maybeResetUnread = useDebounceFn(() => {
  if (!isAtBottom.value) return;
  device.value?.resetUnread(numericChatId.value);
  updateLastRead();
}, 3000);

const onScroll = (event: any) => {
  const threshold = 200;
  const { scrollTop, scrollHeight, clientHeight } = event.target;
  const distanceToBottom = scrollHeight - scrollTop - clientHeight;

  isAtBottom.value = distanceToBottom < threshold;
  sticky.value = distanceToBottom <= SCROLL_THRESHOLD;
  showScrollButton.value = !isAtBottom.value;

  if (isAtBottom.value) {
    maybeResetUnread();
  }
};

const scrollToUnread = (behavior: 'auto' | 'smooth' = 'auto') => {
  if (!scroller.value) return;

  const unreadIdx = groupedMessages.value.findIndex(
    (m) => m.groupedType === 'divider' && m.variant === 'unread'
  );
  if (unreadIdx === -1) return false;

  scroller.value.scrollToIndex(Math.max(unreadIdx - 1, 0), behavior);
  return true;
};

const scrollToBottom = useDebounceFn((behavior: 'auto' | 'smooth' = 'auto') => {
  if (!scroller.value) return;

  const lastIdx = Math.max(0, groupedMessages.value.length - 1);
  scroller.value.scrollToIndex(lastIdx, behavior);
}, 300);

const scrollOnEntry = () => {
  nextTick(() => {
    requestAnimationFrame(() => {
      const didScrollToUnread = scrollToUnread('auto');
      if (!didScrollToUnread) {
        scrollToBottom('auto');
      }
    });
  });
};

const vsHeight = ref('0px');
const vsNodeHeight = ref('0px');
onMounted(() => {
  vsHeight.value = `${window.innerHeight - 95}px`;
  vsNodeHeight.value = `${window.innerHeight - 135}px`;
  window.addEventListener('resize', onResize);
  scrollOnEntry();
});

const onResize = () => {
  vsHeight.value = `${window.innerHeight - 95}px`;
  vsNodeHeight.value = `${window.innerHeight - 135}px`;
};

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});

watch(
  [() => numericChatId.value, () => chatType.value],
  () => {
    scrollOnEntry();
  },
  { immediate: true }
);

watch(
  groupedMessages,
  (newVal, oldVal) => {
    if (!oldVal?.length) return;

    if (sticky.value) {
      scrollToBottom('auto');
    }
  },
  { deep: true }
);

const sendMessage = async (message: string) => {
  const toValue: Types.Destination =
    chatType.value === MessageType.Direct ? numericChatId.value : 'broadcast';
  const channelValue =
    chatType.value === MessageType.Direct ? Types.ChannelNumber.Primary : numericChatId.value;

  let messageId: number | undefined;
  try {
    messageId = await device.value?.connection?.sendText(message, toValue, true, channelValue);
    if (messageId !== undefined) {
      if (chatType.value === MessageType.Broadcast) {
        messageStore.value?.setMessageState({
          type: MessageType.Broadcast,
          channelId: channelValue,
          messageId,
          newState: MessageState.Ack,
        });
      } else {
        messageStore.value?.setMessageState({
          type: MessageType.Direct,
          nodeA: device.value?.myNodeNum || 0,
          nodeB: numericChatId.value,
          messageId,
          newState: MessageState.Ack,
        });
      }
    } else {
      console.warn('sendText completed but messageId is undefined');
    }
  } catch (e: unknown) {
    console.error('Failed to send message:', e);
    const failedId = messageId ?? useRandomId();
    if (chatType.value === MessageType.Broadcast) {
      messageStore.value?.setMessageState({
        type: MessageType.Broadcast,
        channelId: channelValue,
        messageId: failedId,
        newState: MessageState.Failed,
      });
    } else {
      messageStore.value?.setMessageState({
        type: MessageType.Direct,
        nodeA: device.value?.myNodeNum || 0,
        nodeB: numericChatId.value,
        messageId: failedId,
        newState: MessageState.Failed,
      });
    }
  }
  sticky.value = true;
  scrollToBottom('smooth');
};
</script>
