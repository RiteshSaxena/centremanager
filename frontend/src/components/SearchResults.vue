<script setup lang="ts">
import { computed } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';

import { useSearchStore } from '@/stores';

const searchStore = useSearchStore();

const results = computed(() => {
  return searchStore.results;
});
</script>

<template>
  <Card>
    <template #header> Results </template>
    <UserListItem v-for="(item, index) in results" :key="index" :item="item" />
  </Card>
</template>
