<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import Card from '@/components/base/Card.vue';
import UserListItem from '@/components/UserListItem.vue';
import AddGuardianModal from '@/components/AddGuardianModal.vue';

import { useLogBookStore, useSearchStore, useStudentStore } from '@/stores';

import type { Parent, Student } from '@/types';

const props = withDefaults(
  defineProps<{
    items?: any[];
    student: Student;
  }>(),
  {
    items: () => []
  }
);

const emit = defineEmits(['onSelectSignIn', 'onSelectSignOut', 'onAddGuardian']);

const studentStore = useStudentStore();
const searchStore = useSearchStore();
const logBookStore = useLogBookStore();

const isKioskApp = APP_TYPE === 'app-kiosk';

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
  const student = studentStore.books.dueStudents.find(
    (student) => student.id === props.student?.id
  );
  if (student) {
    return student.dueAmount;
  }
  return 0;
});

const isSignedInRecord = computed(() => {
  return logBookStore.list.find(
    (log) =>
      (log.type === 'Student' || log.type === 'StudentWithParent') &&
      log.student?.id === props.student.id &&
      !log.signOutTime
  );
});

const onSelectSignIn = (item: Parent) => {
  emit('onSelectSignIn', {
    ...item,
    student: props.student.id
  });
};

onMounted(() => {
  setTimeout(() => {
    if (isSignedInRecord.value) {
      emit('onSelectSignOut', isSignedInRecord.value);
    }
  }, 500);
});
</script>

<template>
  <Card>
    <template #header> Student</template>
    <p class="text-display">
      Name: <span class="fw-bold">{{ student.firstName }} {{ student.lastName }}</span>
    </p>
    <p class="text-display" v-if="student.schoolYear">
      School Year: <span class="fw-bold">{{ student.schoolYear }}</span>
    </p>
    <p class="text-display text-danger" v-if="studentDueAmount > 0">
      Due Amount: <span class="fw-bold">£{{ studentDueAmount }}</span>
    </p>
    <div v-if="isSignedInRecord">
      <button
        type="button"
        class="btn btn-secondary mt-3"
        @click="$emit('onSelectSignOut', isSignedInRecord)"
      >
        Sign Out
      </button>
    </div>
    <div v-else>
      <p class="small text-muted" v-if="!student.parents.length">No guardian found.</p>
      <p class="small mt-4" v-if="isKioskApp"><strong>Select your name below</strong></p>
      <p class="small mt-4" v-else><strong>Guardians</strong></p>
      <UserListItem
        v-for="(item, index) in student.parents"
        :key="index"
        :item="item as any"
        @click="onSelectSignIn(item)"
      />
      <button type="button" class="btn btn-secondary mt-2" @click="showModal = true">
        Add Guardian
      </button>
    </div>
  </Card>
  <AddGuardianModal v-model:show="showModal" :loading="loading" @onSubmit="onSubmit" />
</template>

<style lang="scss" scoped>
.text-display {
  font-size: 16px;
  color: #505050;
  margin: 0 0 0.6rem 0;
}
</style>
