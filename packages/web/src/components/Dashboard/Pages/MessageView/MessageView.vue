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
            <SectionDivider
              v-if="item.isDivider"
              :title="item.label"
              class="text-surface-600 text-[10px] font-bold px-3 rounded-full uppercase tracking-wider py-1"
            />
            <div v-else class="flex w-full p-3 px-4 justify-start" style="height: 52px">
              <div :class="['flex max-w-[80%]', 'flex-row']">
                <div
                  class="p-1 rounded-2xl shadow-sm wrap-break-words relative bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-400 rounded-bl-none"
                >
                  <p class="whitespace-pre-wrap pr-2">{{ item.text }}</p>
                  <div class="flex items-center justify-start gap-1 mt-1 opacity-70">
                    <span class="text-[10px]">{{ item.time }}</span>

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
          </template>
        </VirtualScroller>

        <transition name="fade">
          <Button
            v-if="showScrollButton"
            rounded
            raised
            @click="scrollToBottom"
            class="absolute bottom-4 right-8 z-10 shadow-lg animate-bounce"
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
          @scroll=""
          class="h-full"
        >
          <template v-slot:item="{ item }">
            <div class="flex px-1 w-full" style="height: 52px">
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
                  v-if="item.badge"
                  :severity="item.severity"
                  size="small"
                  class="ml-auto"
                  :value="item.badge"
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
import { ref, nextTick, onMounted, computed, onBeforeUnmount } from 'vue';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src';
import { useFormattedNodeDatabase } from '@/composables/core/utils/useFormattedNodeDatabase';
import SectionDivider from '@/components/Dashboard/Pages/SectionDivider.vue';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import 'emoji-mart-vue-fast/css/emoji-mart.css';
import data from 'emoji-mart-vue-fast/data/all.json';
import * as _ from 'lodash-es';

// via router
const props = defineProps<{
  type: String; // broadcast or direct
  id: String; // channel or node id
}>();

const nodeDatabase = useFormattedNodeDatabase().nodeDatabase;
let emojiIndex = new EmojiIndex(data);
const textValue = ref('');
const popOver = ref();
const scroller = ref();
const inputRef = ref(null);
const showScrollButton = ref(false);
const searchQuery = ref('');

const filteredNodes = computed(() => {
  let nodes = Object.values(nodeDatabase.value);
  // Apply deep search with Fuse-like behavior (fuzzy searching over multiple fields)
  if (searchQuery.value.trim()) {
    nodes = _.filter(nodes, (node: any) => {
      return _.some(node, (value) => {
        return value && value.toString().toLowerCase().includes(searchQuery.value.toLowerCase());
      });
    });
  }
  return nodes;
});

const messages = ref([
  { id: 1, text: 'Old message', sender: 'Alice', time: '2026-01-14T10:00:00', self: false },
  { id: 2, text: 'Hello today!', sender: 'Me', time: '2026-01-15T09:00:00', self: true },
]);

const groupedMessages = computed(() => {
  const grouped = [];
  let lastDate = null;

  messages.value.forEach((msg) => {
    const date = new Date(msg.time).toDateString();

    if (date !== lastDate) {
      // Insert a special "divider" object
      grouped.push({
        isDivider: true,
        id: `divider-${date}`,
        label: date === new Date().toDateString() ? 'Today' : date,
      });
      lastDate = date;
    }
    grouped.push({ ...msg, isDivider: false });
  });

  return grouped;
});

const showEmojiPicker = (event: any) => {
  popOver.value.show(event);
};
const hideEmojiPicker = (event: any) => {
  popOver.value.hide(event);
};
const onSelectEmoji = (emoji: any) => {
  const input = inputRef.value?.$el;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  textValue.value =
    textValue.value.substring(0, start) + emoji.native + textValue.value.substring(end);
  setTimeout(() => {
    input.focus();
    const newCursorPos = start + emoji.native.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
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

  const id = Date.now();
  const newMessage = {
    id,
    text: textValue.value,
    sender: 'Me',
    self: true,
    status: 'sent', // Starts as sent
    time: new Date().toISOString(),
  };

  messages.value.push(newMessage);

  // Simulate "Delivered" after 1 second
  setTimeout(() => {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) msg.status = 'delivered';
  }, 1000);

  // Simulate "Read" after 3 seconds
  setTimeout(() => {
    const msg = messages.value.find((m) => m.id === id);
    if (msg) msg.status = 'read';
  }, 3000);
  textValue.value = '';

  nextTick(() => {
    scrollToBottom();
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
    scroller.value.scrollToIndex(messages.value.length - 1, 'smooth');
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
</script>
