<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import CentreHeader from '@/components/CentreHeader.vue';

import { useStudentStore } from '@/stores';

const studentStore = useStudentStore();

const currentPage = ref(1);

const itemsPerPage = ref(12);

const totalPages = computed(() => {
  return Math.ceil(studentStore.students.length / itemsPerPage.value);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const changePage = (page: number) => {
  currentPage.value = page;
};

const students = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;

  return studentStore.students.slice(start, end);
});

const loading = computed(() => studentStore.loading);

onMounted(async () => {
  await studentStore.fetchStudents();
});
</script>

<template>
  <div class="p-4">
    <CentreHeader />
    <div class="text-center my-4" v-if="loading">
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div class="py-4" v-else>
      <div class="qr-grid">
        <div class="qr-item" v-for="(student, index) in students" :key="index">
          <img class="qr-code" :src="student.qrCode" alt="QR Code" />
          <p class="small text-muted m-0">{{ student.firstName }} {{ student.lastName }}</p>
          <p class="small text-muted m-0">{{ student.schoolYear }}</p>
        </div>
      </div>
      <nav class="mt-3">
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: currentPage === 1 }" @click="previousPage">
            <a class="page-link" href="#">Previous</a>
          </li>
          <li
            class="page-item"
            v-for="page in totalPages"
            :key="page"
            :class="{ active: page === currentPage }"
            @click="changePage(page)"
          >
            <a class="page-link" href="#">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }" @click="nextPage">
            <a class="page-link" href="#">Next</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped lang="scss">
.qr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 20px;
  justify-items: center;
}
.qr-item {
  width: 100%;
  align-items: center;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 10px;
  padding: 20px;
}
.qr-code {
  width: 150px;
  height: 150px;
}
</style>
