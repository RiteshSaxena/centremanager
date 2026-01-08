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
  return 'text-primary-800';
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
    class="flex items-center gap-3 bg-primary-50 rounded-xl px-6 py-2.5 mb-2.5 border-2 border-primary-200 cursor-pointer shadow-[2px_4px_0px_0px_rgba(84,147,194,0.43)] hover:bg-white transition-colors"
    @click="$emit('click')"
  >
    <i class="fa-solid fa-user" :class="iconColorClass"></i>
    <div class="flex-1">
      <span class="block text-xs font-bold text-primary-800">{{ item?.firstName }} {{ item?.lastName }}</span>
      <span class="block text-xs text-primary-800" v-if="item?.type === 'student'"> Student </span>
      <span class="block text-xs text-primary-800" v-if="item?.type === 'staff'"> Staff - {{ item?.email }} </span>
      <span class="block text-xs text-primary-800" v-if="item?.type === 'parent'"> {{ (item as any)?.contactNumber }} </span>
    </div>
    <span v-if="isStudentDue" class="badge badge-warning cursor-pointer">
      <i class="fa-solid fa-dollar-sign text-[10px]"></i>
    </span>
    <i class="fa-solid fa-chevron-right text-secondary-400"></i>
  </div>
</template>
