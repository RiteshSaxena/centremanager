<script setup lang="ts">
import { ref } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';
import AddGuardianModal from '@/components/AddGuardianModal.vue';

import { useSearchStore } from '@/stores';

const props = withDefaults(
  defineProps<{
    items?: any[];
    studentId: number;
  }>(),
  {
    items: () => []
  }
);

const searchStore = useSearchStore();

const loading = ref(false);

const onSubmit = async (data: any) => {
  try {
    loading.value = true;
    const newParent = await searchStore.addParent({
      ...data,
      child: props.studentId
    });
    emit('onAddGuardian', newParent);
    showModal.value = false;
  } finally {
    loading.value = false;
  }
};

const showModal = ref(false);

const emit = defineEmits(['onSelect', 'onAddGuardian']);
</script>

<template>
  <Card>
    <template #header> Guardians </template>
    <p class="small text-muted" v-if="!items.length">No results found.</p>
    <UserListItem
      v-for="(item, index) in items"
      :key="index"
      :item="item"
      @click="$emit('onSelect', item)"
    />
    <button type="button" class="btn btn-secondary" @click="showModal = true">Add Guardian</button>
  </Card>
  <AddGuardianModal v-model:show="showModal" :loading="loading" @onSubmit="onSubmit" />
</template>
