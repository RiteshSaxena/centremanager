<script setup lang="ts">
import { computed } from 'vue';

import { Card } from '@/components/ui';
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
  <Card class="max-h-[40vh] md:max-h-[70vh] overflow-y-auto mb-3">
    <template #header>
      {{ isKioskApp ? 'Select the student you want to Sign In / Sign out' : 'Results' }}
    </template>
    <div class="text-center mb-3" v-if="searchStore.loading">
      <Spinner size="md" />
    </div>
    <p class="text-sm text-secondary-400" v-if="!searchStore.loading && !searchStore.results.length">
      No results found.
    </p>

    <UserListItem
      v-for="(item, index) in results"
      :key="index"
      :item="item"
      @click="handleItemSelect(item)"
    />
  </Card>
</template>
