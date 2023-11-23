<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { RouterView } from 'vue-router';

import Sidebar from '@/components/Sidebar.vue';

import { useLogBookStore } from '@/stores';

const logBookStore = useLogBookStore();

let logBookTimer: any = null;

onMounted(async () => {
  await logBookStore.fetchList();
  logBookTimer = setInterval(async () => {
    await logBookStore.fetchList();
  }, 1000 * 60);
});

onUnmounted(() => {
  if (logBookTimer) {
    clearInterval(logBookTimer);
  }
});
</script>

<template>
  <div class="d-flex">
    <Sidebar />
    <div class="main-container overflow-auto vh-100 w-100">
      <RouterView />
    </div>
  </div>
</template>
