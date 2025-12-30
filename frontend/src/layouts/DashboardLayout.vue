<script setup lang="ts">
import { onMounted } from 'vue';

import Sidebar from '@/components/Sidebar.vue';

import { useStudentStore } from '@/stores';
import CentreHeader from '@/components/CentreHeader.vue';

const studentStore = useStudentStore();

const isKioskApp = APP_TYPE === 'app-kiosk';

onMounted(async () => {
  await studentStore.dueStudents();
});
</script>

<template>
  <div class="d-flex flex-column flex-md-row">
    <Sidebar v-if="!isKioskApp" />
    <div class="main-container overflow-auto vh-100 w-100">
      <div class="p-2 p-sm-4">
        <centre-header />
        <slot />
      </div>
    </div>
  </div>
</template>
