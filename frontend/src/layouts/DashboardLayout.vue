<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

import Sidebar from '@/components/Sidebar.vue';

import { useLogBookStore } from '@/stores';
import CentreHeader from '@/components/CentreHeader.vue';

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
  <div class="d-flex flex-column flex-md-row">
    <Sidebar />
    <div class="main-container overflow-auto vh-100 w-100">
      <div class="p-4">
        <centre-header />
        <slot />
      </div>
    </div>
  </div>
</template>
