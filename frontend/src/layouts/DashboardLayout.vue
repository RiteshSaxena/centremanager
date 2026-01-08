<script setup lang="ts">
import { onMounted } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import CentreHeader from '@/components/CentreHeader.vue';
import { useStudentStore } from '@/stores';

const studentStore = useStudentStore();
const isKioskApp = APP_TYPE === 'app-kiosk';

onMounted(async () => {
  await studentStore.dueStudents();
});
</script>

<template>
  <div class="flex flex-col md:flex-row min-h-screen bg-secondary-100">
    <Sidebar v-if="!isKioskApp" />
    <main class="flex-1 overflow-auto">
      <div class="p-4 sm:p-6 max-w-7xl mx-auto">
        <CentreHeader />
        <slot />
      </div>
    </main>
  </div>
</template>
