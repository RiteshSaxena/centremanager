<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

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
  <div class="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
    <!-- Header with Student Info -->
    <div class="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
          <i class="fa-solid fa-user-graduate text-2xl text-white"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-white">
            {{ student.firstName }} {{ student.lastName }}
          </h3>
          <p class="text-sm text-primary-100" v-if="student.schoolYear">
            {{ student.schoolYear }}
          </p>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-5">
      <!-- Alerts/Warnings -->
      <div class="space-y-2 mb-4">
        <!-- Payment Due Alert -->
        <div
          v-if="studentDueAmount > 0"
          class="flex items-center gap-3 p-3 bg-warning-50 border border-warning-200 rounded-lg"
        >
          <i class="fa-solid fa-circle-exclamation text-warning-600"></i>
          <div class="flex-1">
            <p class="text-sm font-medium text-warning-900">Payment Due</p>
            <p class="text-xs text-warning-700">{{ getDueAmount(studentDueAmount) }}</p>
          </div>
        </div>

        <!-- Late Alert -->
        <div
          v-if="isStudentLate && isStudentLate.late > 5"
          class="flex items-center gap-3 p-3 bg-danger-50 border border-danger-200 rounded-lg"
        >
          <i class="fa-solid fa-clock text-danger-600"></i>
          <div class="flex-1">
            <p class="text-sm font-medium text-danger-900">
              {{ isStudentLate.late }} minutes late
            </p>
            <p class="text-xs text-danger-700">
              Expected arrival: {{ isStudentLate.startTime }}
            </p>
          </div>
        </div>
      </div>

      <!-- Already Signed In -->
      <div v-if="isSignedInRecord" class="text-center py-6">
        <div class="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-3">
          <i class="fa-solid fa-check text-2xl text-success-600"></i>
        </div>
        <p class="text-sm font-medium text-secondary-700 mb-4">Student is already signed in</p>
        <Button
          variant="secondary"
          size="lg"
          @click="$emit('onSelectSignOut', isSignedInRecord)"
        >
          <i class="fa-solid fa-right-from-bracket mr-2"></i>
          Sign Out
        </Button>
      </div>

      <!-- Sign In Options -->
      <div v-else>
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-sm font-semibold text-secondary-900">
              {{ isKioskApp ? 'Select Your Name' : 'Select Guardian' }}
            </h4>
            <p class="text-xs text-secondary-500 mt-0.5">
              Choose who is signing in the student
            </p>
          </div>
        </div>

        <!-- No Guardians -->
        <div
          v-if="!student.parents.length"
          class="text-center py-8 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-200"
        >
          <i class="fa-solid fa-users-slash text-3xl text-secondary-300 mb-2"></i>
          <p class="text-sm text-secondary-500">No guardians found</p>
          <p class="text-xs text-secondary-400 mt-1">Add a guardian to continue</p>
        </div>

        <!-- Guardian List -->
        <div v-else class="mb-3">
          <UserListItem
            v-for="(item, index) in student.parents"
            :key="index"
            :item="item as any"
            @click="onSelectSignIn(item)"
          />
        </div>

        <!-- Add Guardian Button -->
        <Button
          variant="outline"
          :block="true"
          @click="showModal = true"
        >
          <i class="fa-solid fa-user-plus mr-2"></i>
          Add Guardian
        </Button>
      </div>
    </div>
  </div>

  <AddGuardianModal v-model:show="showModal" :loading="loading" @onSubmit="onSubmit" />
</template>
