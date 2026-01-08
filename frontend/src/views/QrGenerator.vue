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
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
          <i class="fa-solid fa-qrcode text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">QR Code Generator</h2>
          <p class="text-sm text-secondary-500">View and print student QR codes</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>

    <div v-else>
      <!-- Search Section -->
      <div class="bg-white rounded-xl border border-secondary-200 shadow-sm p-5 mb-6">
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Search Students
        </label>
        <div class="flex gap-2 max-w-md">
          <Input v-model="search" placeholder="Enter student name or year..." />
          <Button
            v-if="search.trim().length"
            type="button"
            variant="ghost"
            @click="search = ''"
          >
            <i class="fa-solid fa-xmark"></i>
          </Button>
        </div>
        <p class="text-xs text-secondary-500 mt-2">
          Showing {{ students.length }} of {{ enrolledStudents.length }} enrolled students
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="students.length === 0" class="bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200 p-12 text-center">
        <i class="fa-solid fa-inbox text-4xl text-secondary-300 mb-3"></i>
        <p class="text-secondary-500 font-medium">No students found</p>
        <p class="text-xs text-secondary-400 mt-1">Try a different search term</p>
      </div>

      <!-- QR Code Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="(student, index) in students"
          :key="index"
          class="bg-white rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <div class="p-4 flex flex-col items-center">
            <!-- QR Code -->
            <div class="w-32 h-32 mb-3 rounded-lg overflow-hidden border-2 border-secondary-100">
              <img class="w-full h-full" :src="student.qrCode" alt="QR Code" />
            </div>

            <!-- Student Info -->
            <div class="text-center w-full">
              <p class="text-sm font-semibold text-secondary-900 mb-1">
                {{ student.firstName }} {{ student.lastName }}
              </p>
              <p v-if="student.schoolYear" class="text-xs text-secondary-500">
                {{ student.schoolYear.trim().split('/')[0] }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="mt-6" v-if="totalPages > 1">
        <Pagination
          v-model:currentPage="currentPage"
          :totalPages="totalPages"
          :totalItems="enrolledStudents.length"
          :pageSize="itemsPerPage"
        />
      </div>
    </div>
  </div>
</template>
