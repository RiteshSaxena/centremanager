<script setup lang="ts">
import { computed } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';

import { useSearchStore } from '@/stores';

const searchStore = useSearchStore();

const results = computed(() => {
  return searchStore.results;
});

defineEmits(['onSelect']);
</script>

<template>
  <Card class="signed-in-list mb-3">
    <template #header> Results </template>
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
      @click="$emit('onSelect', item)"
    />
  </Card>
</template>

<style scoped lang="scss">
.signed-in-list {
  max-height: 600px;
  overflow-y: auto;
}
</style>
