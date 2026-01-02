<script setup lang="ts">
import { useRoute } from 'vue-router';
import { onMounted } from 'vue';
import { userStore as useUserStore } from '@/stores/user';

const userStore = useUserStore();
const route = useRoute();

onMounted(() => {
  userStore.fetchMe();
  document.querySelector('body')?.classList.add(APP_TYPE);
});
</script>

<template>
  <component :is="route.meta.layout || 'div'">
    <RouterView />
  </component>
</template>
