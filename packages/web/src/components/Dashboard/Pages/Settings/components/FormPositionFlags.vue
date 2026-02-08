<template>
  <div class="flex flex-wrap justify-start gap-4">
    <div class="flex items-center gap-1">
      <Checkbox
        v-model="positionFlags"
        inputId="altitudeCheck"
        name="flags"
        value="1"
        size="small"
      />
      <label for="altitudeCheck">Altitude</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="altitudeMsl" name="flags" value="2" size="small" />
      <label for="altitudeMsl">Altitude is Mean Sea Level</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="separation" name="flags" value="4" size="small" />
      <label for="separation">Geoidal Separation</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="dop" name="flags" value="8" size="small" />
      <label for="dop">Dilution of Precision (DOP)</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="hvdop" name="flags" value="16" size="small" />
      <label for="hvdop">Horizontal/Vertical Dilution of Precision (HVDOP)</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="sats" name="flags" value="32" size="small" />
      <label for="hvdop">Satellites in View</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="seq" name="flags" value="64" size="small" />
      <label for="seq">Sequence Number</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="timestamp" name="flags" value="128" size="small" />
      <label for="timestamp">Timestamp</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox v-model="positionFlags" inputId="hdg" name="flags" value="256" size="small" />
      <label for="hdg">Heading</label>
    </div>
    <div class="flex items-center gap-1">
      <Checkbox
        v-model="positionFlagsArray"
        inputId="speed"
        name="flags"
        value="512"
        size="small"
      />
      <label for="speed">Speed</label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const positionFlags = defineModel<number>('positionFlags', {
  default: 0,
});

const positionFlagsArray = computed<number[]>({
  get() {
    const value = positionFlags.value ?? 0;
    return [1, 2, 4, 8, 16, 32, 64, 128, 256, 512].filter((flag) => (value & flag) === flag);
  },
  set(values) {
    positionFlags.value = values.reduce((sum, v) => sum + v, 0);
  },
});
</script>
