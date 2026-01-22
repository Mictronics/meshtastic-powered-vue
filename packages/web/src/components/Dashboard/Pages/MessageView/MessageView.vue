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
            <div :key="item.messageId">
              <SectionDivider
                v-if="item.isDivider"
                :title="item.label"
                class="text-surface-600 text-[10px] font-bold px-3 rounded-full uppercase tracking-wider py-1"
              />
              <div v-else class="flex w-full p-3 px-4 justify-start" style="height: 52px">
                <div class="flex max-w-[80%] flex-row">
                  <div
                    class="p-1 rounded-2xl shadow-sm wrap-break-words relative bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-400 rounded-bl-none"
                  >
                    <p class="whitespace-pre-wrap pr-2">{{ item.message }}</p>
                    <div class="flex items-center justify-start gap-1 mt-1 opacity-70">
                      <span class="text-[10px]">{{ item.date }}</span>

                      <div v-if="item.self" class="items-center">
                        <Check v-if="item.status === 'sent'" :size="15" />
                        <Check
                          v-else-if="item.status === 'delivered'"
                          :size="15"
                          class="text-lime-500"
                        />
                        <CheckCheck
                          v-else-if="item.status === 'read'"
                          :size="15"
                          class="text-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </VirtualScroller>

        <transition name="fade">
          <Button
            v-if="showScrollButton"
            rounded
            raised
            @click="scrollToBottom"
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
    <div
      class="p-2 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-200! dark:border-slate-600!"
    >
      <div class="flex gap-2">
        <div class="flex items-center w-full relative">
          <Button
            severity="secondary"
            text
            class="absolute right-2 hover:bg-transparent! transition-colors"
            @click="showEmojiPicker"
            @mouseenter="showEmojiPicker"
            @mouseleave="startAutoHideEmojiPicker"
            aria-label="Select Emoji"
          >
            <Smile :size="25" class="text-slate-400" />
          </Button>

          <InputText
            ref="inputRef"
            v-model="textValue"
            placeholder="Type a message..."
            class="grow rounded-full dark:bg-slate-800"
            @keyup.enter="sendMessage"
            :maxlength="200"
          />
        </div>

        <Button
          severity="info"
          size="small"
          rounded
          @click="sendMessage"
          :disabled="!textValue.trim()"
        >
          <Send :size="24" />
        </Button>
      </div>

      <Popover
        ref="popOver"
        class="p-0 border-none shadow-2xl bg-slate-50/50 dark:bg-slate-900"
        pt:content:style="padding:0;"
        @mouseenter="stopAutoHideEmojiPicker"
        @mouseleave="hideEmojiPicker"
      >
        <Picker
          :data="emojiIndex"
          set="twitter"
          @select="onSelectEmoji"
          :emojiSize="35"
          :showPreview="false"
          class="border-none"
        />
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleArrowDown, Smile, Check, CheckCheck, Send, Search } from 'lucide-vue-next';
import {
  ref,
  nextTick,
  onMounted,
  computed,
  onBeforeUnmount,
  type ComponentPublicInstance,
  watch,
} from 'vue';
import { computedWithControl, refDebounced } from '@vueuse/core';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';
import { useDeviceStore } from '@/composables/core/stores/device/useDeviceStore';
import { useMessageStore } from '@/composables/core/stores/message/useMessageStore';
import SectionDivider from '@/components/Dashboard/Pages/SectionDivider.vue';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import 'emoji-mart-vue-fast/css/emoji-mart.css';
import data from 'emoji-mart-vue-fast/data/all.json';
import { orderBy } from 'lodash-es';
import { MessageType } from '@/composables/core/stores/message/useMessageStore';
import type { Message } from '@/composables/core/stores/message/types';

type MessageWithDivider =
  | Message
  | {
      isDivider: boolean;
      label?: string;
      messageId: string;
    };

// via router
const props = defineProps<{
  type: String; // broadcast or direct
  id: String; // channel or node id
}>();

const deviceStore = useDeviceStore();
const messageStore = useMessageStore();
const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
let emojiIndex = new EmojiIndex(data);
const textValue = ref('');
const popOver = ref();
const scroller = ref();
const inputRef = ref<ComponentPublicInstance | null>(null);
const showScrollButton = ref(false);
const searchQuery = ref('');
const debouncedQuery = refDebounced(searchQuery, 150);
const numericChatId = computed(() => Number(props.id) || 0);
const chatType = computed(() =>
  props.type === 'direct' ? MessageType.Direct : MessageType.Broadcast
);

const device = computed(() => {
  return deviceStore.device.value;
});

const groupedMessages = computedWithControl(
  [messageStore.messageStore, numericChatId, chatType],
  () => {
    const grouped: MessageWithDivider[] = [];
    let lastDate: string = '';
    let messages: Message[] = [];
    switch (chatType.value) {
      case MessageType.Broadcast:
        messages =
          messageStore.messageStore.value?.getMessages({
            type: MessageType.Broadcast,
            channelId: numericChatId.value,
          }) || [];
        break;
      case MessageType.Direct:
        messages =
          messageStore.messageStore.value?.getMessages({
            type: MessageType.Direct,
            nodeA: device.value?.myNodeNum || 0,
            nodeB: numericChatId.value,
          }) || [];
        break;
      default:
        return messages;
    }
    if (messages) {
      messages.forEach((msg) => {
        const date = new Date(msg.date).toLocaleDateString();
        if (date !== lastDate) {
          // Insert a date divider
          grouped.push({
            isDivider: true,
            messageId: `divider-${date}`,
            label: date === new Date().toLocaleDateString() ? 'Today' : date,
          });
          lastDate = date;
        }
        grouped.push({ ...msg, isDivider: false });
      });
      return grouped;
    }
    return [];
  },
  { deep: true }
);

const filteredNodes = computedWithControl(
  [deviceStore.device, nodeDatabase, debouncedQuery, numericChatId],
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
  { deep: false }
);

const showEmojiPicker = (event: any) => {
  popOver.value.show(event);
};

const hideEmojiPicker = (event: any) => {
  popOver.value.hide(event);
};

const onSelectEmoji = (emoji: { native: string }) => {
  const inputEl = (inputRef.value as any)?.$el as HTMLInputElement | undefined;
  if (!inputEl) return;
  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? start;
  textValue.value =
    textValue.value.substring(0, start) + emoji.native + textValue.value.substring(end);
  setTimeout(() => {
    inputEl.focus();
    const newCursorPos = start + emoji.native.length;
    inputEl.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
};

let leaveTimer: number | undefined;
function stopAutoHideEmojiPicker() {
  if (leaveTimer !== undefined) {
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
  }
}

function startAutoHideEmojiPicker() {
  leaveTimer = window.setTimeout(() => {
    leaveTimer = undefined;
    popOver.value.hide();
  }, 1500);
}

const sendMessage = () => {
  if (!textValue.value.trim()) return;

  textValue.value = '';

  nextTick(() => {
    scrollToBottom();
    const inputEl = (inputRef.value as any)?.$el as HTMLInputElement | undefined;
    if (inputEl) inputEl.focus();
  });
};

const onScroll = (event: any) => {
  const threshold = 200;
  const isAtBottom =
    event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight < threshold;
  showScrollButton.value = !isAtBottom;
};

const scrollToBottom = () => {
  if (scroller.value) {
    const idx = Math.max(0, groupedMessages.value.length - 1);
    scroller.value.scrollToIndex(idx, 'smooth');
  }
};

const vsHeight = ref('0px');
const vsNodeHeight = ref('0px');
onMounted(() => {
  vsHeight.value = `${window.innerHeight - 95}px`;
  vsNodeHeight.value = `${window.innerHeight - 135}px`;
  window.addEventListener('resize', onResize);
  setTimeout(scrollToBottom, 300);
});

const onResize = () => {
  vsHeight.value = `${window.innerHeight - 95}px`;
  vsNodeHeight.value = `${window.innerHeight - 135}px`;
};

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  if (leaveTimer !== undefined) clearTimeout(leaveTimer);
});

watch(
  [() => numericChatId.value, () => chatType.value],
  async () => {
    await nextTick();
    nextTick(() => setTimeout(scrollToBottom, 50));
  },
  { immediate: true }
);
</script>
