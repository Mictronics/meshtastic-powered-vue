<template>
  <div :key="message.messageId">
    <SectionDivider
      v-if="message.groupedType === 'divider'"
      :title="message.label"
      :class="[
        message.variant === 'unread'
          ? 'unread-divider'
          : 'font-bold px-3 rounded-full uppercase tracking-wider py-1',
      ]"
    />
    <div v-else class="flex w-full p-3 justify-start gap-3" style="height: 72px">
      <NodeAvatar
        :isFavorite="message.isFavorite"
        :nodeNumber="message.nodeNumber"
        :shortName="message.shortName"
      />
      <div
        class="p-1 relative dark:bg-slate-900 text-slate-800 dark:text-slate-400 group"
        :class="{
          'rounded-2xl shadow-sm rounded-bl-none dark:bg-slate-800!': !isEmojiOnly,
        }"
      >
        <div
          class="absolute -top-3 right-1 hidden group-hover:flex items-center gap-0.5 rounded-full shadow-sm bg-white dark:bg-slate-700 p-0.5 z-10"
        >
          <button
            type="button"
            class="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300"
            title="Reply"
            @click="emit('reply', message)"
          >
            <Reply :size="14" />
          </button>
          <button
            type="button"
            class="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300"
            title="React"
            @click="showReactionPicker"
          >
            <SmilePlus :size="14" />
          </button>
        </div>

        <!-- Reply quote is capped to a fraction of the width so a long quote can't push the
             actual message text past the truncation point; row height stays fixed for VirtualScroller. -->
        <div class="flex items-baseline gap-1 min-w-0" :class="{ 'emoji-only': isEmojiOnly }">
          <span
            v-if="message.replyTo"
            class="opacity-60 italic text-sm truncate shrink-0 max-w-[45%]"
          >
            {{ message.replyTo.shortName }}: {{ message.replyTo.message }} ↩
          </span>
          <span class="truncate min-w-0 flex-1">{{ message.message }}</span>
        </div>

        <!-- Reactions: single non-wrapping line so the row's fixed height still fits it -->
        <div v-if="message.reactions?.length" class="reactions flex mt-1 flex-nowrap overflow-hidden">
          <span
            v-for="reaction in message.reactions"
            :key="reaction.messageId"
            class="text-sm px-0.5 py-0.5 rounded-full bg-transparent shrink-0"
          >
            {{ reaction.message }}
          </span>
        </div>

        <!-- Meta -->
        <div class="flex items-center justify-start gap-1 mt-1 opacity-70">
          <span class="text-[10px]">
            {{ message.longName ?? 'Unknown' }} on {{ formattedDate }}
            <template v-if="message.hopsAway !== undefined && message.hopsAway !== 'Unknown'">
              with {{ message.hopsAway }}
            </template>
          </span>

          <div v-if="message.isSelf" class="items-center">
            <Check v-if="message.state === MessageState.Waiting" :size="15" class="text-sky-400" />
            <CloudAlert
              v-else-if="message.state === MessageState.Failed"
              :size="15"
              class="text-red-400"
            />
            <CheckCheck
              v-else-if="message.state === MessageState.Ack"
              :size="15"
              class="text-lime-500"
            />
          </div>
        </div>

        <Popover ref="reactionPopover" class="p-0 border-none shadow-2xl bg-slate-50/50 dark:bg-slate-900" pt:content:style="padding:0;">
          <Picker :data="emojiIndex" set="twitter" @select="onSelectReaction" :emojiSize="28" :showPreview="false" class="border-none" />
        </Popover>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Check, CheckCheck, CloudAlert, Reply, SmilePlus } from 'lucide-vue-next';
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src';
import 'emoji-mart-vue-fast/css/emoji-mart.css';
import data from 'emoji-mart-vue-fast/data/all.json';
import SectionDivider from '@/components/Dashboard/Pages/SectionDivider.vue';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import type { MessageWithDivider } from './MessageView.vue';
import { MessageState } from '@/composables/stores/message/useMessageStore';

const props = defineProps<{
  message: MessageWithDivider;
}>();

const emit = defineEmits<{
  (e: 'reply', message: MessageWithDivider): void;
  (e: 'react', payload: { messageId: number; emoji: string }): void;
}>();

const emojiIndex = new EmojiIndex(data);
const reactionPopover = ref();

const showReactionPicker = (event: Event) => {
  reactionPopover.value?.show(event);
};

const onSelectReaction = (emoji: { native: string }) => {
  reactionPopover.value?.hide();
  if (props.message.groupedType !== 'message') return;
  emit('react', { messageId: props.message.messageId, emoji: emoji.native });
};

const formattedDate = computed(() => {
  if (props.message.groupedType !== 'message') return '';

  return new Date(props.message.date).toLocaleString(undefined, {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
});

const isEmojiOnly = computed(() => {
  if (props.message.groupedType !== 'message') return false;
  const text = props.message.message?.trim();
  if (!text) return false;
  // Matches exactly one emoji
  const emojiRegex = /^(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F)?$/u;
  return emojiRegex.test(text) || (props.message.emoji ?? 0) > 0;
});
</script>

<style lang="css" scoped>
.unread-divider {
  animation: fadeIn 0.4s ease-out;
}

.unread-divider::before,
.unread-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-sky-300) !important;
}

.dark .unread-divider::before,
.dark .unread-divider::after {
  border-bottom: 1px solid var(--color-sky-700) !important;
}

.emoji-only {
  font-size: 1.6rem;
  line-height: 1;
  white-space: nowrap;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: start;
  overflow: unset !important;
}
</style>
