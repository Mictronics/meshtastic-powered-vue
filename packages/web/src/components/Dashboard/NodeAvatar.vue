<template>
  <div class="avatar-wrap">
    <Avatar
      shape="circle"
      class="text-xs font-light bg-[rgb(var(--bg-r),var(--bg-g),var(--bg-b))] node-avatar"
      :style="{
        '--bg-r': avatarColor.background.r,
        '--bg-g': avatarColor.background.g,
        '--bg-b': avatarColor.background.b,
        color: avatarColor.text,
      }"
    >
      {{ props.shortName }}
    </Avatar>
    <IconStar v-if="props.isFavorite" :size="20" class="avatar-badge" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  isFavorite: { type: Boolean, default: false },
  nodeNumber: { type: Number, default: undefined },
  shortName: { type: String, default: undefined },
});

import { useColor } from '@/composables/core/utils/useColor';
const avatarColor = computed(() => {
  const bgColor = useColor().getColorFromNodeNum(props.nodeNumber || 0);
  const isLight = useColor().isLightColor(bgColor);
  const textColor = isLight ? '#000000' : '#FFFFFF';
  return {
    background: bgColor,
    text: textColor,
  };
});
</script>

<style scoped>
.avatar-wrap {
  position: relative;
  display: inline-block;
  line-height: 0;
}

/* 3D avatar */
.node-avatar {
  position: relative;
  padding: 3ch;
  background: rgb(var(--bg-r), var(--bg-g), var(--bg-b));
  border-radius: 50%;

  /* elevation */
  /*box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15), 0 6px 12px rgba(0, 0, 0, 0.18),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25);*/
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  pointer-events: none;
}

/* light highlight */
.node-avatar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.35), transparent 80%);
  pointer-events: none;
}

/* inner shadow */
.node-avatar::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25);
  pointer-events: none;
}

/* optional hover lift */
.avatar-wrap:hover .node-avatar {
  transform: translateY(-1px);
  /* box-shadow: 0 4px 6px rgba(0, 0, 0, 0.18), 0 10px 18px rgba(0, 0, 0, 0.22),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25);*/
}

.avatar-badge {
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(40%, -40%);
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  fill: oklch(87.9% 0.169 91.605);
  stroke-width: 0;
}
</style>
