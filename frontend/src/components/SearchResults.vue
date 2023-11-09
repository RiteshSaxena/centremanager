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
  <Card>
    <template #header> Results </template>
    <p class="small text-muted" v-if="searchStore.loading">Loading...</p>
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
