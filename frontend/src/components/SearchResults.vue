<script setup lang="ts">
import { computed } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';

import { useSearchStore } from '@/stores';

const searchStore = useSearchStore();

const isKioskApp = APP_TYPE === 'app-kiosk';

const results = computed(() => {
  return searchStore.results;
});
const emit = defineEmits(['onSelect']);

const handleItemSelect = (item: any) => {
  // Emit the onSelect event (preserving existing behavior)
  emit('onSelect', item);

  // Scroll to the About section
  setTimeout(() => {
    const aboutSection = document.getElementById('student-row');
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start' // Adjust this based on your layout
      });
    }
  }, 100);
};
</script>

<template>
  <Card class="signed-in-list mb-3">
    <template #header>
      {{ isKioskApp ? 'Select the student you want to Sign In / Sign out' : 'Results' }}
    </template>
    <div class="text-center mb-3" v-if="searchStore.loading">
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <p class="small text-muted" v-if="!searchStore.loading && !searchStore.results.length">
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

<style scoped lang="scss">
.signed-in-list {
  max-height: 40vh;
  overflow-y: auto;
}
@media (min-width: 760px) {
  .signed-in-list {
    max-height: 70vh;
  }
}
</style>
