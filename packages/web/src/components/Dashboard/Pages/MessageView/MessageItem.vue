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
    <div
      v-else
      class="flex w-full p-3 justify-start gap-3"
      :style="{ height: message.replyTo ? '104px' : '52px' }"
    >
      <NodeAvatar
        :isFavorite="message.isFavorite"
        :nodeNumber="message.nodeNumber"
        :shortName="message.shortName"
      />
      <div class="flex" :class="[message.replyTo ? 'flex-col' : 'flex-row']">
        <!-- Reply preview INSIDE bubble -->
        <div
          v-if="message.replyTo"
          class="text-xs p-2 truncate rounded-2xl shadow-sm rounded-bl-none rounded-br-none dark:bg-slate-800 text-slate-800/50 dark:text-slate-400/50"
        >
          {{ message.replyTo.shortName }}: {{ message.replyTo.message }}
        </div>

        <div
          class="p-1 relative dark:bg-slate-900 text-slate-800 dark:text-slate-400"
          :class="{
            'rounded-2xl shadow-sm rounded-bl-none dark:bg-slate-800! h-[28px]': !isEmojiOnly,
            'rounded-tl-none rounded-tr-none': message.replyTo,
          }"
        >
          <!-- Message -->
          <p class="truncate" :class="{ 'emoji-only': isEmojiOnly }">
            {{ message.message }}
          </p>

          <!-- Reactions -->
          <div v-if="message.reactions?.length" class="reactions flex mt-1 flex-wrap">
            <span
              v-for="reaction in message.reactions"
              :key="reaction.messageId"
              class="text-sm px-0.5 py-0.5 rounded-full bg-transparent"
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
              <Check
                v-if="message.state === MessageState.Waiting"
                :size="15"
                class="text-sky-400"
              />
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
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Check, CheckCheck, CloudAlert } from 'lucide-vue-next';
import SectionDivider from '@/components/Dashboard/Pages/SectionDivider.vue';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import type { MessageWithDivider } from './MessageView.vue';
import { MessageState } from '@/composables/stores/message/useMessageStore';

const props = defineProps<{
  message: MessageWithDivider;
}>();

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
