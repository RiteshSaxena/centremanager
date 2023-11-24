<script setup lang="ts">
import { ref } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';
import AddGuardianModal from '@/components/AddGuardianModal.vue';

import { useSearchStore } from '@/stores';

import type { Student } from '@/types';

const props = withDefaults(
  defineProps<{
    items?: any[];
    student: Student;
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
      child: props.student.id
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
    <template #header> Student</template>
    <p class="small text-muted mt-0 mb-0">{{ student.firstName }} {{ student.lastName }}</p>
    <p class="small text-muted mt-1 mb-0" v-if="student.schoolYear">
      {{ student.schoolYear }}
    </p>
    <p class="small text-muted" v-if="!student.parents.length">No guardian found.</p>
    <p class="small mt-4"><strong>Guardians</strong></p>
    <UserListItem
      v-for="(item, index) in student.parents"
      :key="index"
      :item="item as any"
      @click="$emit('onSelect', item)"
    />
    <button type="button" class="btn btn-secondary" @click="showModal = true">Add Guardian</button>
  </Card>
  <AddGuardianModal v-model:show="showModal" :loading="loading" @onSubmit="onSubmit" />
</template>
