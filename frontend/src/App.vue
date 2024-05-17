<script setup lang="ts">
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();

onMounted(() => {
  document.querySelector('body')?.classList.add(APP_TYPE);
});
</script>

<template>
  <component :is="route.meta.layout || 'div'">
    <RouterView />
  </component>
</template>
