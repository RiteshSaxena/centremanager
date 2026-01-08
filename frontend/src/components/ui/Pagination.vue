<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    maxVisiblePages?: number;
  }>(),
  {
    totalItems: 0,
    pageSize: 10,
    maxVisiblePages: 5
  }
);

const emit = defineEmits(['update:currentPage']);

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const total = props.totalPages;
  const current = props.currentPage;
  const max = props.maxVisiblePages;

  if (total <= max) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    const half = Math.floor(max / 2);
    let start = current - half;
    let end = current + half;

    if (start < 1) {
      start = 1;
      end = max;
    }
    if (end > total) {
      end = total;
      start = total - max + 1;
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      if (i > 0 && i <= total) pages.push(i);
    }

    if (end < total) {
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }
  }

  return pages;
});

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize;
  return end > props.totalItems ? props.totalItems : end;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page);
  }
};
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <!-- Info -->
    <div v-if="totalItems > 0" class="text-sm text-secondary-500">
      Showing <span class="font-medium text-secondary-700">{{ startItem }}</span> to
      <span class="font-medium text-secondary-700">{{ endItem }}</span> of
      <span class="font-medium text-secondary-700">{{ totalItems }}</span> results
    </div>

    <!-- Page buttons -->
    <nav class="flex items-center gap-1">
      <!-- Previous -->
      <button
        type="button"
        :disabled="currentPage === 1"
        class="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="goToPage(currentPage - 1)"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <!-- Page numbers -->
      <template v-for="page in visiblePages" :key="page">
        <span v-if="page === '...'" class="px-2 py-1 text-secondary-400"> ... </span>
        <button
          v-else
          type="button"
          :class="[
            'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-primary-500 text-white'
              : 'text-secondary-600 hover:bg-secondary-100'
          ]"
          @click="goToPage(page as number)"
        >
          {{ page }}
        </button>
      </template>

      <!-- Next -->
      <button
        type="button"
        :disabled="currentPage === totalPages"
        class="p-2 rounded-lg text-secondary-500 hover:bg-secondary-100 hover:text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="goToPage(currentPage + 1)"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  </div>
</template>
