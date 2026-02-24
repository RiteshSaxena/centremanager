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
      return slot[0]!.children.map((child) => {
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
  return amount > 1 ? `£${amount}` : 'NA';
};
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="flex items-center justify-center py-12">
    <Spinner size="lg" />
  </div>

  <!-- Attendance Grid -->
  <div v-else>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs"
          >
            <i class="fa-solid fa-clipboard-check text-white text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-secondary-900">Today's Attendance</h2>
            <p class="text-sm text-secondary-500">{{ moment().format('MMMM D, YYYY') }}</p>
          </div>
        </div>
        <div
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-xs"
        >
          <i class="fa-solid fa-calendar-day"></i>
          <span>{{ day }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!timings.length"
      class="bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200 p-12 text-center"
    >
      <i class="fa-solid fa-calendar-xmark text-4xl text-secondary-300 mb-3"></i>
      <p class="text-secondary-500 font-medium">No slots scheduled for today</p>
      <p class="text-xs text-secondary-400 mt-1">Check back on a different day</p>
    </div>

    <!-- Time Slots -->
    <div v-else class="space-y-6">
      <div
        v-for="(timing, index) in timings"
        :key="index"
        class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden"
      >
        <!-- Time Header -->
        <div
          class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-3 border-b border-primary-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <i class="fa-solid fa-clock text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">{{ timing.text }}</h3>
              <p class="text-xs text-primary-600">Class Session</p>
            </div>
          </div>
        </div>

        <!-- Students List -->
        <div class="p-5">
          <div
            v-if="getStudents(day, timing).length === 0"
            class="text-center py-6 text-sm text-secondary-400"
          >
            <i class="fa-solid fa-user-slash text-2xl mb-2"></i>
            <p>No students scheduled</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="student in getStudents(day, timing)"
              :key="student.id"
              class="flex items-center gap-3 p-3 rounded-lg border border-secondary-200 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
            >
              <!-- Avatar -->
              <div class="shrink-0">
                <div
                  :class="[
                    'w-9 h-9 rounded-full flex items-center justify-center',
                    student.gender === 'Male'
                      ? 'bg-blue-100'
                      : student.gender === 'Female'
                      ? 'bg-pink-100'
                      : 'bg-secondary-100'
                  ]"
                >
                  <i
                    :class="[
                      'fa-solid fa-user text-sm',
                      student.gender === 'Male'
                        ? 'text-blue-500'
                        : student.gender === 'Female'
                        ? 'text-pink-400'
                        : 'text-secondary-400'
                    ]"
                  ></i>
                </div>
              </div>

              <!-- Student Name -->
              <div class="flex-1 min-w-0">
                <span class="font-semibold text-secondary-900 text-sm">
                  {{ student.firstName }} {{ student.lastName }}
                </span>
              </div>

              <!-- Badges -->
              <div class="flex items-center gap-1.5">
                <!-- Payment Due Badge -->
                <div class="relative group" v-if="student.dueAmount && student.dueAmount > 0">
                  <span
                    class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-warning-100 text-warning-700 cursor-pointer hover:bg-warning-200 transition-colors"
                  >
                    <i class="fa-solid fa-circle-dollar text-xs"></i>
                  </span>
                  <div class="tooltip-content">
                    Amount Due: {{ getDueAmount(student.dueAmount) }}
                  </div>
                </div>
                <span
                  v-else-if="student.dueAmount === 0"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary-100 text-secondary-500"
                >
                  <i class="fa-solid fa-circle-dollar text-xs"></i>
                </span>

                <!-- Attendance Badge -->
                <div class="relative group" v-if="student.attendance === 'present'">
                  <span
                    class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-success-100 text-success-700 cursor-pointer hover:bg-success-200 transition-colors"
                  >
                    <i class="fa-solid fa-check text-xs"></i>
                  </span>
                  <div class="tooltip-content">
                    <div v-for="(time, i) in student.timeLog" :key="i">{{ time }}</div>
                  </div>
                </div>
                <span
                  v-else-if="student.attendance === 'absent'"
                  class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-danger-100 text-danger-700"
                >
                  <i class="fa-solid fa-xmark text-xs"></i>
                </span>
                <div class="relative group" v-else-if="student.attendance === 'in-class'">
                  <span
                    class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors"
                  >
                    <i class="fa-solid fa-arrow-right text-xs"></i>
                  </span>
                  <div class="tooltip-content">
                    <div v-for="(time, i) in student.timeLog" :key="i">{{ time }}</div>
                  </div>
                </div>
                <span
                  v-else
                  class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-secondary-100 text-secondary-500"
                >
                  <i class="fa-solid fa-minus text-xs"></i>
                </span>

                <!-- Early Learner Badge -->
                <div
                  class="relative group"
                  v-if="student.isEarlyLearner || student.schoolYear?.includes('Reception')"
                >
                  <span
                    class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200 transition-colors text-[10px] font-bold"
                  >
                    EL
                  </span>
                  <div class="tooltip-content">Early Learner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "@/assets/main.css";

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
