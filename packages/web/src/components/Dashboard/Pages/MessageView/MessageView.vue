<template>
  <div class="p-1 bg-slate-50/50 dark:bg-slate-900 font-sans text-slate-900">
    <div class="relative mx-auto">
      <VirtualScroller
        ref="scroller"
        :items="messages"
        :itemSize="60"
        showSpacer
        scroll-height="89vh"
        @scroll="onScroll"
      >
        <template v-slot:item="{ item, options }">
          <div
            class="p-4 dark:bg-slate-800"
            :class="['flex w-full p-2 px-4', 'justify-start']"
            style="height: 60px"
          >
            <div :class="['flex max-w-[80%]', 'flex-row']">
              <Avatar
                :label="item.sender[0]"
                shape="circle"
                class="mt-auto"
                :class="'bg-gray-300 mr-2'"
              />

              <div
                :class="[
                  'p-3 rounded-2xl text-sm shadow-sm self-end',
                  'bg-surface-100 text-surface-900 rounded-bl-none',
                ]"
              >
                <p class="whitespace-pre-wrap text-slate-700 dark:text-slate-400">
                  {{ item.text }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </VirtualScroller>

      <div class="flex flex-col gap-2">
        <label for="emoji-input" class="font-bold">Message</label>

        <div class="relative flex items-center">
          <InputText
            ref="inputRef"
            id="emoji-input"
            v-model="textValue"
            placeholder="Type a message..."
            class="w-full pr-12"
          />
          <Button
            severity="secondary"
            text
            rounded
            class="absolute right-2"
            @click="toggle"
            aria-label="Select Emoji"
          >
            <Smile :size="20" />
          </Button>
        </div>

        <Popover ref="op">
          <Picker
            :data="emojiIndex"
            set="twitter"
            @select="onSelectEmoji"
            :emojiSize="40"
            :showPreview="false"
          />
        </Popover>
      </div>

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
  </div>
</template>

<script setup lang="ts">
import { CircleArrowDown, Smile } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src';
import 'emoji-mart-vue-fast/css/emoji-mart.css';
import data from 'emoji-mart-vue-fast/data/all.json';

let emojiIndex = new EmojiIndex(data);

const messages = ref(
  Array.from({ length: 1000 }).map((_, i) => ({
    id: i,
    text: i % 3 === 0 ? 'Check this out! 🚀🔥' : 'Hello world! 😊',
    sender: i % 2 === 0 ? 'Alice' : 'Me',
    time: '10:00 AM',
    self: i % 2 !== 0,
  }))
);
const scroller = ref();
const showScrollButton = ref(false);

// 1. Detect scroll position
const onScroll = (event: any) => {
  // We show the button if the user has scrolled up significantly
  // scrollingElement.scrollHeight - scrollTop - clientHeight = distance from bottom
  const threshold = 200;
  const isAtBottom =
    event.target.scrollHeight - event.target.scrollTop - event.target.clientHeight < threshold;

  showScrollButton.value = !isAtBottom;
};

// 2. Scroll to the last item
const scrollToBottom = () => {
  if (scroller.value) {
    scroller.value.scrollToIndex(messages.value.length - 1, 'smooth');
  }
};

onMounted(() => {
  // Start at the bottom when the component loads
  setTimeout(scrollToBottom, 300);
});

const textValue = ref('');
const op = ref();
const inputRef = ref(null);

// Function to toggle the emoji picker
const toggle = (event: Event) => {
  op.value.toggle(event);
};

// Logic to insert emoji at cursor position
const onSelectEmoji = (emoji: any) => {
  const input = inputRef.value?.$el;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = textValue.value;

  // Insert emoji into the string
  textValue.value = text.substring(0, start) + emoji.native + text.substring(end);

  // Reposition cursor after the emoji (optional next tick)
  setTimeout(() => {
    input.focus();
    input.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
  }, 0);
};

// Logic when a new message is pushed to the array
const handleNewMessage = (newMsg) => {
  const wasAtBottom = !showScrollButton.value;
  messages.value.push(newMsg);

  if (wasAtBottom) {
    // Use nextTick to wait for DOM update
    //nextTick(() => scrollToBottom());
  } else {
    // Logic to show "New Message" badge on the button
  }
};
</script>

<style lang="css" scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
