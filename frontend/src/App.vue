<script setup lang="ts">
import { RouterView } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
</script>

<template>
  <div class="d-flex">
    <Sidebar />
    <div class="overflow-auto vh-100 w-100">
      <RouterView />
    </div>
  </div>
</template>
