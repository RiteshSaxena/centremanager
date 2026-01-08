<script setup lang="ts">
import { computed } from 'vue';

import UserListItem from '@/components/UserListItem.vue';
import { Spinner } from '@/components/ui';

import { useSearchStore } from '@/stores';

const searchStore = useSearchStore();

const isKioskApp = APP_TYPE === 'app-kiosk';

const results = computed(() => {
  return searchStore.results;
});
const emit = defineEmits(['onSelect']);

const handleItemSelect = (item: any) => {
  emit('onSelect', item);

  setTimeout(() => {
    const aboutSection = document.getElementById('student-row');
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, 100);
};
</script>

<template>
  <div class="bg-white rounded-xl border border-secondary-200 shadow-lg overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-secondary-50 border-b border-secondary-200">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-magnifying-glass text-secondary-400"></i>
        <h3 class="text-sm font-semibold text-secondary-700">
          {{ isKioskApp ? 'Select Student to Sign In/Out' : 'Search Results' }}
        </h3>
      </div>
    </div>

    <!-- Content -->
    <div class="max-h-[40vh] md:max-h-[70vh] overflow-y-auto p-4">
      <!-- Loading -->
      <div v-if="searchStore.loading" class="text-center py-8">
        <Spinner size="md" />
        <p class="text-sm text-secondary-500 mt-3">Searching...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!searchStore.results.length"
        class="text-center py-8"
      >
        <i class="fa-solid fa-inbox text-4xl text-secondary-300 mb-3"></i>
        <p class="text-sm text-secondary-500">No results found.</p>
        <p class="text-xs text-secondary-400 mt-1">Try a different search term</p>
      </div>

      <!-- Results List -->
      <div v-else>
        <p class="text-xs text-secondary-500 mb-3">
          Found {{ results.length }} result{{ results.length !== 1 ? 's' : '' }}
        </p>
        <UserListItem
          v-for="(item, index) in results"
          :key="index"
          :item="item"
          @click="handleItemSelect(item)"
        />
      </div>
    </div>
  </div>
</template>
