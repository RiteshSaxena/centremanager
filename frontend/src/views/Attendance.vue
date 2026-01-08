<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import moment from 'moment';
import { useSlotStore, useLogBookStore, useStudentStore } from '@/stores';
import type { LogRecord } from '@/types';
import { Spinner, Badge } from '@/components/ui';

const studentStore = useStudentStore();
const slotStore = useSlotStore();
const logBookStore = useLogBookStore();

const loading = computed(() => slotStore.loading);

interface Timing {
  text: string;
  start: string;
  end: string;
}

const day = moment().format('dddd');
const logRecords = ref<LogRecord[]>([]);

const formatTime = (time: string) => {
  let timeArr = time.split(':');
  if (timeArr.length > 2) {
    timeArr = timeArr.slice(0, 2);
  }
  return timeArr.join(':');
};

const timings = computed<Timing[]>(() => {
  const timingsList: Timing[] = [];
  const slots = slotStore.slots.filter((slot) => slot.day === day);

  slots.forEach((slot) => {
    const isExists = timingsList.find(
      (time) => time.start === slot.startTime && time.end === slot.endTime
    );

    if (isExists) return;

    timingsList.push({
      start: slot.startTime,
      end: slot.endTime,
      text: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    });
  });

  timingsList.sort((a, b) => a.text.localeCompare(b.text));
  return timingsList;
});

const getStudents = computed(() => {
  return (day: string, timing: Timing) => {
    const books = studentStore.books;
    const slot = slotStore.slots.filter(
      (slot) => slot.day === day && slot.startTime === timing.start && slot.endTime === timing.end
    );

    if (slot.length) {
      return slot[0].children.map((child) => {
        let attendance = '';
        const timeLog: string[] = [];
        const studentFilteredList = logRecords.value.filter((log) => log.student?.id === child.id);

        if (studentFilteredList.length) {
          studentFilteredList.map((log) => {
            let signInTime = '';
            let signOutTime = '';
            if (log.signInTime) {
              signInTime = moment(log.signInTime).format('hh:mm A');
            }
            if (log.signOutTime) {
              signOutTime = moment(log.signOutTime).format('hh:mm A');
            }
            if (signInTime && signOutTime && attendance !== 'present') {
              attendance = 'present';
            } else if (signInTime && !signOutTime && !attendance) {
              attendance = 'in-class';
            }
            timeLog.push(`${signInTime} - ${signOutTime}`);
          });
        } else {
          const isSlotActive = moment().isAfter(moment(timing.start, 'HH:mm:ss.SSS'));
          if (isSlotActive) {
            attendance = 'absent';
          }
        }

        let dueAmount = -1;
        if (books.enabled) {
          const dueStudent = books.dueStudents.find((student) => student.id === child.id);
          dueAmount = dueStudent ? dueStudent.dueAmount : 0;
        }

        return {
          ...child,
          attendance,
          timeLog,
          dueAmount
        };
      });
    }
    return [];
  };
});

let logBookTimer: any = null;

onMounted(async () => {
  await slotStore.fetchSlots();
  logRecords.value = await logBookStore.fetchListByDate(moment().format('YYYY-MM-DD'));
  logBookTimer = setInterval(async () => {
    logRecords.value = await logBookStore.fetchListByDate(moment().format('YYYY-MM-DD'));
  }, 1000 * 60);
});

onUnmounted(() => {
  if (logBookTimer) clearInterval(logBookTimer);
});

const getDueAmount = (amount: number) => {
  return amount > 1 ? `$${amount}` : 'NA';
};
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="flex items-center justify-center py-12">
    <Spinner size="lg" />
  </div>

  <!-- Attendance Grid -->
  <div v-else class="mt-4">
    <!-- Header Row -->
    <div class="grid grid-cols-[120px_1fr] gap-0 mb-2">
      <div></div>
      <div class="flex justify-center">
        <span class="px-4 py-1.5 bg-accent-300 text-primary-800 text-xs font-bold rounded-full">
          {{ day }}
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!timings.length" class="grid grid-cols-[120px_1fr] gap-0">
      <div></div>
      <p class="text-sm text-secondary-400 py-8 text-center">No slots found for today.</p>
    </div>

    <!-- Time Slots -->
    <div
      v-for="(timing, index) in timings"
      :key="index"
      class="grid grid-cols-[120px_1fr] gap-0"
    >
      <!-- Time Label -->
      <div class="flex items-start justify-center pt-3">
        <span class="text-xs font-bold text-primary-400">{{ timing.text }}</span>
      </div>

      <!-- Students Cell -->
      <div
        :class="[
          'bg-white border border-secondary-200 p-3 min-h-[60px]',
          index === 0 ? 'rounded-t-xl border-b-0' : '',
          index === timings.length - 1 ? 'rounded-b-xl' : 'border-b-0'
        ]"
      >
        <div class="flex flex-col gap-2">
          <div
            v-for="student in getStudents(day, timing)"
            :key="student.id"
            class="flex items-center gap-2 text-sm"
          >
            <!-- Due Amount Badge -->
            <div class="relative group" v-if="student.dueAmount && student.dueAmount > 0">
              <span class="badge badge-warning cursor-pointer">
                <i class="fa-solid fa-dollar-sign text-[10px]"></i>
              </span>
              <div class="tooltip-content">
                Amount Due: {{ getDueAmount(student.dueAmount) }}
              </div>
            </div>
            <span v-else-if="student.dueAmount === 0" class="badge badge-neutral">
              <i class="fa-solid fa-dollar-sign text-[10px]"></i>
            </span>

            <!-- Attendance Badge -->
            <div class="relative group" v-if="student.attendance === 'present'">
              <span class="badge badge-success cursor-pointer">
                <i class="fa-solid fa-check text-[10px]"></i>
              </span>
              <div class="tooltip-content">
                <div v-for="(time, i) in student.timeLog" :key="i">{{ time }}</div>
              </div>
            </div>
            <span v-else-if="student.attendance === 'absent'" class="badge badge-danger">
              <i class="fa-solid fa-xmark text-[10px]"></i>
            </span>
            <div class="relative group" v-else-if="student.attendance === 'in-class'">
              <span class="badge badge-info cursor-pointer">
                <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </span>
              <div class="tooltip-content">
                <div v-for="(time, i) in student.timeLog" :key="i">{{ time }}</div>
              </div>
            </div>
            <span v-else class="badge badge-neutral">
              <i class="fa-solid fa-minus text-[10px]"></i>
            </span>

            <!-- Student Name -->
            <span class="text-secondary-800">
              {{ student.firstName }} {{ student.lastName }}
            </span>

            <!-- Early Learner Badge -->
            <div
              class="relative group"
              v-if="student.isEarlyLearner || student.schoolYear?.includes('Reception')"
            >
              <span class="badge badge-info cursor-pointer text-[10px]">EL</span>
              <div class="tooltip-content">Early Learner</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip-content {
  @apply invisible opacity-0 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-secondary-800 rounded-lg whitespace-nowrap z-50 transition-all duration-200;
}

.tooltip-content::after {
  content: '';
  @apply absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-secondary-800;
}

.group:hover .tooltip-content {
  @apply visible opacity-100;
}
</style>
