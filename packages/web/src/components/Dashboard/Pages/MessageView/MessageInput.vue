<template>
  <div
    class="p-2 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-200! dark:border-slate-600!"
  >
    <div class="flex gap-2">
      <div
        class="flex items-center w-full relative"
        :class="{ 'horizontal-shaking': overflowAttempt }"
      >
        <div class="absolute right-16 mt-1 flex justify-end text-xs">
          <span
            :class="[
              'transition-colors',
              overflowAttempt ? 'text-red-500' : isOverLimit ? 'text-amber-500' : 'text-slate-400',
            ]"
          >
            {{ messageBytes }} / {{ props.maxBytes }}
          </span>
        </div>
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
          v-model="draft"
          placeholder="Type a message..."
          class="grow rounded-full dark:bg-slate-800 text-slate-900 dark:text-slate-400"
          @keyup.enter="sendMessage"
        />
      </div>

      <Button
        severity="info"
        size="small"
        rounded
        @click="sendMessage"
        :disabled="!draft.trim() || isOverLimit"
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
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, type ComponentPublicInstance, computed, watch } from 'vue';
import { createGlobalState, refAutoReset } from '@vueuse/core';
import { Smile, Send } from 'lucide-vue-next';
import { Types } from '@meshtastic/core';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src';
import 'emoji-mart-vue-fast/css/emoji-mart.css';
import data from 'emoji-mart-vue-fast/data/all.json';
import { useMessageStore } from '@/composables/core/stores/message/useMessageStore';

const props = defineProps<{
  maxBytes: number;
  to: Types.Destination;
}>();

const emit = defineEmits<{
  (e: 'eventSendMessage', message: string): void;
}>();

const messageStore = useMessageStore().messageStore.value;
let emojiIndex = new EmojiIndex(data);
const popOver = ref();
const inputRef = ref<ComponentPublicInstance | null>(null);

const encoder = new TextEncoder();
const messageBytes = computed(() => encoder.encode(draft.value).length);
const isOverLimit = computed(() => messageBytes.value >= props.maxBytes);
const overflowAttempt = refAutoReset(false, 500);

const useDraftState = createGlobalState(() => {
  const drafts = ref<Record<string, string>>({});
  return { drafts };
});
const { drafts } = useDraftState();

if (messageStore) {
  drafts.value[props.to] = messageStore.getDraft(props.to) ?? '';
}

const draft = computed({
  get() {
    return drafts.value[props.to] ?? '';
  },
  set(val: string) {
    const bytes = encoder.encode(val).length;

    if (bytes <= props.maxBytes) {
      drafts.value[props.to] = val;
      messageStore?.setDraft(props.to, val);
      overflowAttempt.value = false;
    } else {
      overflowAttempt.value = true;
    }
  },
});

const showEmojiPicker = (event: any) => {
  popOver.value.show(event);
};

const hideEmojiPicker = (event: any) => {
  popOver.value.hide(event);
};

const onSelectEmoji = (emoji: { native: string }) => {
  const inputEl = (inputRef.value as any)?.$el as HTMLInputElement | undefined;
  if (!inputEl) return;

  const start = inputEl.selectionStart ?? draft.value.length;
  const end = inputEl.selectionEnd ?? start;

  const nextValue = draft.value.slice(0, start) + emoji.native + draft.value.slice(end);

  if (encoder.encode(nextValue).length > props.maxBytes) {
    overflowAttempt.value = true;
    return;
  }

  draft.value = nextValue;
  nextTick(() => {
    inputEl.focus();
    const pos = start + emoji.native.length;
    inputEl.setSelectionRange(pos, pos);
  });
};

let leaveTimer: number | undefined;
const stopAutoHideEmojiPicker = () => {
  if (leaveTimer !== undefined) {
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
  }
};

const startAutoHideEmojiPicker = () => {
  leaveTimer = window.setTimeout(() => {
    leaveTimer = undefined;
    popOver.value.hide();
  }, 1500);
};

const sendMessage = async () => {
  if (!draft.value.trim() || isOverLimit.value) return;

  const message = draft.value.trim();
  drafts.value[props.to] = '';
  messageStore?.setDraft(props.to, '');

  await nextTick();

  const inputEl = (inputRef.value as any)?.$el as HTMLInputElement | undefined;
  inputEl?.focus();

  emit('eventSendMessage', message);
};

onBeforeUnmount(() => {
  if (leaveTimer !== undefined) clearTimeout(leaveTimer);
});
</script>

<style lang="css" scoped>
@keyframes horizontal-shaking {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(2px);
  }
  50% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
  100% {
    transform: translateX(0);
  }
}

div.horizontal-shaking {
  animation: horizontal-shaking 0.25s;
}
</style>
