<template>
  <div :key="message.messageId">
    <SectionDivider
      v-if="message.groupedType === 'divider'"
      :title="message.label"
      class="text-surface-600 text-[10px] font-bold px-3 rounded-full uppercase tracking-wider py-1"
    />
    <div v-else class="flex w-full p-3 px-4 justify-start gap-3" style="height: 52px">
      <NodeAvatar
        :isFavorite="message.isFavorite"
        :nodeNumber="message.nodeNumber"
        :shortName="message.shortName"
      />
      <div class="flex max-w-[80%] flex-row">
        <div
          class="p-1 rounded-2xl shadow-sm wrap-break-words relative dark:bg-slate-800 text-slate-800 dark:text-slate-400 rounded-bl-none"
        >
          <p class="whitespace-pre-wrap pr-2">{{ message.message }}</p>
          <div class="flex items-center justify-start gap-1 mt-1 opacity-70">
            <span class="text-[10px]">
              {{ message.longName ?? 'Unknown' }} on {{ formattedDate }}
            </span>
            <!--
            <div v-if="message.self" class="items-center">
              <Check v-if="message.status === 'sent'" :size="15" />
              <Check v-else-if="message.status === 'delivered'" :size="15" class="text-lime-500" />
              <CheckCheck v-else-if="message.status === 'read'" :size="15" class="text-sky-500" />
            </div>
            -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Check, CheckCheck } from 'lucide-vue-next';
import SectionDivider from '@/components/Dashboard/Pages/SectionDivider.vue';
import NodeAvatar from '@/components/Dashboard/NodeAvatar.vue';
import type { MessageWithDivider } from './MessageView.vue';

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
</script>
