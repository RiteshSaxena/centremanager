<script setup lang="ts">
import type { SearchResult } from '@/types';

import { computed } from 'vue';

import { useStudentStore } from '@/stores';

const studentStore = useStudentStore();

const props = defineProps<{
  item: SearchResult;
}>();

defineEmits(['click']);

const iconColorClass = computed(() => {
  if (props.item?.type) {
    if (props.item.type === 'student') {
      if (props.item.gender === 'Male') {
        return 'text-blue-500';
      } else if (props.item.gender === 'Female') {
        return 'text-pink-400';
      }
    }
  }
  return 'text-secondary-400';
});

const isStudentDue = computed(() => {
  if (props.item?.type === 'student') {
    if (!studentStore.books.enabled) {
      return false;
    }
    const student = studentStore.books.dueStudents.find((student) => student.id === props.item?.id);
    if (student) {
      return true;
    }
  }
  return false;
});
</script>

<template>
  <div
    class="group flex items-center gap-4 bg-white border border-secondary-200 rounded-xl p-2 md:p-4 mb-2 cursor-pointer hover:border-primary-400 hover:shadow-md hover:bg-primary-50/50 transition-all duration-200"
    @click="$emit('click')"
  >
    <!-- Avatar -->
    <div class="flex-shrink-0">
      <div
        class="w-11 h-11 rounded-full bg-secondary-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors"
      >
        <i class="fa-solid fa-user text-lg " :class="iconColorClass"></i>
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-0.5">
        <span class="font-semibold text-secondary-900 text-sm truncate">
          {{ item?.firstName }} {{ item?.lastName }}
        </span>
        <span
          v-if="isStudentDue"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-700"
          title="Payment Due"
        >
          $
        </span>
      </div>

      <!-- Type Badge & Details -->
      <div class="flex items-center gap-2">
        <span
          v-if="item?.type === 'student'"
          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary-100 text-secondary-700"
        >
          Student
        </span>
        <span
          v-if="item?.type === 'staff'"
          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700"
        >
          Staff
        </span>
        <span
          v-if="item?.type === 'parent'"
          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700"
        >
          Guardian
        </span>

        <span v-if="item?.type === 'staff'" class="text-xs text-blue-500 truncate">
          {{ item?.email }}
        </span>
        <span v-if="item?.type === 'parent'" class="text-xs text-blue-500">
          {{ (item as any)?.contactNumber }}
        </span>
      </div>
    </div>

    <!-- Arrow -->
    <div class="flex-shrink-0">
      <i
        class="fa-solid fa-chevron-right text-secondary-300 group-hover:text-primary-500 transition-colors"
      ></i>
    </div>
  </div>
</template>
