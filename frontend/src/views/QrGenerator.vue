<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Input } from '@/components/ui';
import { Button, Spinner, Pagination } from '@/components/ui';

import { useStudentStore } from '@/stores';

import type { Student } from '@/types';

const studentStore = useStudentStore();

const currentPage = ref(1);

const itemsPerPage = ref(21);

const search = ref('');

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

const enrolledStudents = computed(() => {
  const list = studentStore.students.filter(
    (student) => student.status === 'Send to KSiS' || student.status === 'Send to KSiS (Free Trial)'
  );

  const text = search.value.trim().toLowerCase() || '';

  if (text) {
    return list.filter((item) => {
      return (
        item.firstName?.toLowerCase().includes(text) ||
        item.lastName?.toLowerCase().includes(text) ||
        item.schoolYear?.toLowerCase().includes(text)
      );
    });
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(enrolledStudents.value.length / itemsPerPage.value);
});

const students = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;

  return enrolledStudents.value.slice(start, end);
});

const studentText = (student: Student) => {
  let name = `${student.firstName} ${student.lastName}`;
  if (student.schoolYear) {
    const schoolYear = student.schoolYear.trim().split('/')[0];
    name += ` - ${schoolYear}`;
  }
  return name;
};

const loading = computed(() => studentStore.loading);

onMounted(async () => {
  await studentStore.fetchStudents();
});
</script>

<template>
  <div class="text-center py-8" v-if="loading">
    <Spinner size="lg" />
  </div>
  <div class="py-4" v-else>
    <div class="flex gap-1 max-w-md mb-4">
      <Input v-model="search" placeholder="Enter Student name to search" />
      <Button
        v-if="search.trim().length"
        type="button"
        variant="secondary"
        @click="search = ''"
      >
        <i class="fa-solid fa-xmark"></i>
      </Button>
    </div>

    <div class="grid grid-cols-3 gap-2.5">
      <div
        class="bg-white rounded-xl flex flex-col items-center gap-0.5"
        v-for="(student, index) in students"
        :key="index"
      >
        <img class="w-28 h-28" :src="student.qrCode" alt="QR Code" />
        <p class="text-sm text-secondary-500 m-0 px-3 pb-3 text-center">{{ studentText(student) }}</p>
      </div>
    </div>

    <div class="mt-4" v-if="totalPages > 1">
      <Pagination
        v-model:currentPage="currentPage"
        :totalPages="totalPages"
        :totalItems="enrolledStudents.length"
        :pageSize="itemsPerPage"
      />
    </div>
  </div>
</template>
