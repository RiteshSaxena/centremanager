<script setup lang="ts">
import { computed, ref } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';
import AddGuardianModal from '@/components/AddGuardianModal.vue';

import { useSearchStore, useStudentStore } from '@/stores';

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

const studentStore = useStudentStore();
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

const studentDueAmount = computed(() => {
  if (!studentStore.books.enabled) {
    return 0;
  }
  const student = studentStore.books.dueStudents.find((student) => student.id === props.student?.id);
  if (student) {
    return student.dueAmount;
  }
  return 0;
});

const emit = defineEmits(['onSelect', 'onAddGuardian']);
</script>

<template>
  <Card>
    <template #header> Student</template>
    <p class="small text-muted mt-0 mb-0">
      <span class="fw-bold">Name:</span> {{ student.firstName }} {{ student.lastName }}
    </p>
    <p class="small text-muted mt-1 mb-0" v-if="student.schoolYear">
      <span class="fw-bold">School Year:</span> {{ student.schoolYear }}
    </p>
    <p class="small text-muted mt-1 mb-0" v-if="studentDueAmount > 0">
      <span class="fw-bold">Due Amount:</span> £{{ studentDueAmount }}
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
