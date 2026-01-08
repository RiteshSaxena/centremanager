<script setup lang="ts">
import VueDrawingCanvas from 'vue-drawing-canvas';
import { onMounted, ref } from 'vue';
import { Button } from '@/components/ui';

const image = ref('');
const canvas: any = ref(null);
const signatureContainer = ref<HTMLElement | null>(null);

const reset = () => {
  canvas.value?.reset();
};

const canvasWidth = ref(0);

const isEmpty = () => {
  if (canvas.value) {
    return canvas.value.isEmpty();
  }
  return false;
};

const getImage = () => {
  return image.value;
};

onMounted(() => {
  setTimeout(() => {
    canvasWidth.value = signatureContainer.value?.clientWidth || 1;
  }, 500);
});

defineExpose({
  getImage,
  isEmpty,
  reset
});
</script>

<template>
  <div class="block w-full" ref="signatureContainer">
    <vue-drawing-canvas
      ref="canvas"
      v-model:image="image"
      :width="canvasWidth || 1"
      :height="350"
      stroke-type="dash"
      line-cap="round"
      line-join="round"
      :fill-shape="true"
      :lineWidth="4"
      color="black"
      background-color="white"
      saveAs="png"
      :styles="{
        border: 'solid 1px rgb(207 207 207)',
        'border-radius': '8px'
      }"
    />
    <div class="text-right mt-2">
      <Button variant="outline" size="sm" @click.prevent="reset">
        <span aria-hidden="true">&times;</span> Clear
      </Button>
    </div>
  </div>
</template>
