<script setup lang="ts">
import VueDrawingCanvas from 'vue-drawing-canvas';
import { onMounted, ref } from 'vue';

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
  <div class="signature-container" ref="signatureContainer">
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
        'border-radius': '5px'
      }"
    />
    <div class="text-end">
      <button type="button" class="btn btn-sm btn-secondary mt-3" @click.prevent="reset">
        Reset
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.signature-container {
  display: block;
  width: 100%;
}
</style>
