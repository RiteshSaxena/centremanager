<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Card } from '@/components/ui';
import UserListItem from '@/components/UserListItem.vue';
import AddGuardianModal from '@/components/AddGuardianModal.vue';
import { Button } from '@/components/ui';

import { useLogBookStore, useSearchStore, useStudentStore, useSlotStore } from '@/stores';

import type { Parent, Student } from '@/types';
import moment from 'moment/moment';

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

const todayDay = moment().format('dddd');

const slotStore = useSlotStore();
const studentStore = useStudentStore();
const searchStore = useSearchStore();
const logBookStore = useLogBookStore();

const isKioskApp = APP_TYPE === 'app-kiosk';

const loading = ref(false);

const getDueAmount = (amount: number) => {
  return amount > 1 ? `£${amount}` : 'NA';
};

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

const isStudentLate = computed(() => {
  const slots = slotStore.slots.filter(
    (slot) =>
      slot.day === todayDay &&
      moment().unix() > moment(slot.startTime, 'HH:mm:ss.SSS').unix() &&
      moment().unix() < moment(slot.endTime, 'HH:mm:ss.SSS').unix()
  );
  const studentSlot = slots.find((slot) =>
    slot.children.find((child) => child.id === props.student.id)
  );

  if (!studentSlot) {
    return null;
  }

  const startTime = moment(studentSlot.startTime, 'HH:mm:ss.SSS');

  return {
    ...studentSlot,
    late: moment().diff(startTime, 'minutes'),
    startTime: startTime.format('h:mma')
  };
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
    <p class="text-base text-secondary-600 mb-2">
      Name: <span class="font-bold">{{ student.firstName }} {{ student.lastName }}</span>
    </p>
    <p class="text-base text-secondary-600 mb-2" v-if="student.schoolYear">
      School Year: <span class="font-bold">{{ student.schoolYear }}</span>
    </p>
    <p class="text-base text-danger-500 mb-2" v-if="studentDueAmount > 0">
      Due Amount: <span class="font-bold">{{ getDueAmount(studentDueAmount) }}</span>
    </p>
    <p class="text-base text-danger-500 mt-3" v-if="isStudentLate && isStudentLate.late > 5">
      You are {{ isStudentLate.late }} minutes late. Your time of arrival is
      {{ isStudentLate.startTime }}.
    </p>
    <div v-if="isSignedInRecord">
      <Button
        variant="secondary"
        class="mt-3"
        @click="$emit('onSelectSignOut', isSignedInRecord)"
      >
        Sign Out
      </Button>
    </div>
    <div v-else>
      <p class="text-sm text-secondary-400" v-if="!student.parents.length">No guardian found.</p>
      <p class="text-sm mt-4" v-if="isKioskApp"><strong>Select your name below</strong></p>
      <p class="text-sm mt-4" v-else><strong>Guardians</strong></p>
      <UserListItem
        v-for="(item, index) in student.parents"
        :key="index"
        :item="item as any"
        @click="onSelectSignIn(item)"
      />
      <Button variant="secondary" class="mt-2" @click="showModal = true">
        Add Guardian
      </Button>
    </div>
  </Card>
  <AddGuardianModal v-model:show="showModal" :loading="loading" @onSubmit="onSubmit" />
</template>
