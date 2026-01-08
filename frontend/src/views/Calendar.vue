<script setup lang="ts">
import { computed, onMounted } from 'vue';
import moment from 'moment';
import { useSlotStore, useStudentStore } from '@/stores';
import { Spinner } from '@/components/ui';

const studentStore = useStudentStore();
const slotStore = useSlotStore();

const loading = computed(() => slotStore.loading);

interface Timing {
  text: string;
  start: string;
  end: string;
}

const formatTime = (time: string) => {
  let timeArr = time.split(':');
  if (timeArr.length > 2) {
    timeArr = timeArr.slice(0, 2);
  }
  return timeArr.join(':');
};

const timings = computed<Timing[]>(() => {
  const timingsList: Timing[] = [];
  const slots = slotStore.slots.filter((slot) => days.value.includes(slot.day));

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

const allDays: string[] = [
  moment().subtract(1, 'day').format('dddd'),
  moment().format('dddd'),
  moment().add(1, 'day').format('dddd'),
  moment().add(2, 'days').format('dddd'),
  moment().add(3, 'days').format('dddd'),
  moment().add(4, 'days').format('dddd'),
  moment().add(5, 'days').format('dddd')
];

const today = moment().format('dddd');

const days = computed(() => {
  const daysList: string[] = [];
  allDays.forEach((day) => {
    const isSlotExists = slotStore.slots.find((slot) => slot.day === day);
    if (isSlotExists && daysList.length < 4) {
      daysList.push(day);
    }
  });
  return daysList;
});

const getStudents = computed(() => {
  return (day: string, timing: Timing) => {
    const books = studentStore.books;
    const slot = slotStore.slots.filter(
      (slot) => slot.day === day && slot.startTime === timing.start && slot.endTime === timing.end
    );

    if (slot.length) {
      return slot[0].children.map((child) => {
        let dueAmount = -1;

        if (books.enabled) {
          const dueStudent = books.dueStudents.find((student) => student.id === child.id);
          dueAmount = dueStudent ? dueStudent.dueAmount : 0;
        }
        return {
          ...child,
          dueAmount
        };
      });
    }
    return [];
  };
});

onMounted(async () => {
  await slotStore.fetchSlots();
});

const getDueAmount = (amount: number) => {
  return amount > 1 ? `€${amount}` : 'NA';
};

const gridCols = computed(() => {
  const cols = days.value.length;
  return `grid-template-columns: 100px repeat(${cols}, 1fr)`;
});
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="flex items-center justify-center py-12">
    <Spinner size="lg" />
  </div>

  <!-- Calendar View -->
  <div v-else>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
            <i class="fa-solid fa-calendar-week text-white text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-secondary-900">Weekly Calendar</h2>
            <p class="text-sm text-secondary-500">Class schedule overview</p>
          </div>
        </div>
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-semibold rounded-xl shadow-sm">
          <i class="fa-solid fa-calendar-days"></i>
          <span>{{ moment().format('MMM YYYY') }}</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!timings.length || !days.length" class="bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200 p-12 text-center">
      <i class="fa-solid fa-calendar-xmark text-4xl text-secondary-300 mb-3"></i>
      <p class="text-secondary-500 font-medium">No class schedule available</p>
      <p class="text-xs text-secondary-400 mt-1">Set up time slots to see the calendar</p>
    </div>

    <!-- Calendar Grid -->
    <div v-else class="overflow-x-auto">
      <div class="min-w-[800px]">
        <!-- Days Header -->
        <div class="grid gap-2 mb-4" :style="gridCols">
          <div class="flex items-center justify-center">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <i class="fa-solid fa-clock text-primary-600"></i>
            </div>
          </div>
          <div
            v-for="day in days"
            :key="day"
            class="flex justify-center"
          >
            <div
              :class="[
                'px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all',
                day === today
                  ? 'bg-primary-500 text-white'
                  : 'bg-white border border-secondary-200 text-secondary-700'
              ]"
            >
              {{ day }}
            </div>
          </div>
        </div>

        <!-- Time Slot Rows -->
        <div class="space-y-3">
          <div
            v-for="(timing, rowIndex) in timings"
            :key="rowIndex"
            class="grid gap-2"
            :style="gridCols"
          >
            <!-- Time Label -->
            <div class="flex items-center justify-center">
              <div class="text-center bg-white rounded-lg border border-secondary-200 px-3 py-2 shadow-sm">
                <div class="text-xs font-bold text-primary-600">{{ timing.text }}</div>
              </div>
            </div>

            <!-- Day Cells -->
            <div
              v-for="day in days"
              :key="day"
              class="bg-white border border-secondary-200 rounded-xl p-3 min-h-[80px] shadow-sm hover:shadow-md transition-shadow"
            >
              <!-- Empty State -->
              <div
                v-if="getStudents(day, timing).length === 0"
                class="flex items-center justify-center h-full text-secondary-300"
              >
                <i class="fa-solid fa-minus text-sm"></i>
              </div>

              <!-- Students List -->
              <div v-else class="space-y-2">
                <div
                  v-for="student in getStudents(day, timing)"
                  :key="student.id"
                  class="flex items-center gap-2 p-2 rounded-lg border border-secondary-100 hover:border-primary-300 hover:bg-primary-50/30 transition-all"
                >
                  <!-- Avatar -->
                  <div class="flex-shrink-0">
                    <div
                      :class="[
                        'w-7 h-7 rounded-full flex items-center justify-center',
                        student.gender === 'Male' ? 'bg-blue-100' : student.gender === 'Female' ? 'bg-pink-100' : 'bg-secondary-100'
                      ]"
                    >
                      <i
                        :class="[
                          'fa-solid fa-user text-xs',
                          student.gender === 'Male' ? 'text-blue-500' : student.gender === 'Female' ? 'text-pink-400' : 'text-secondary-400'
                        ]"
                      ></i>
                    </div>
                  </div>

                  <!-- Student Name -->
                  <div class="flex-1 min-w-0">
                    <span class="text-xs font-medium text-secondary-900 truncate block">
                      {{ student.firstName }} {{ student.lastName }}
                    </span>
                  </div>

                  <!-- Badges -->
                  <div class="flex items-center gap-1">
                    <!-- Payment Due Badge -->
                    <div class="relative group" v-if="student.dueAmount && student.dueAmount > 0">
                      <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-warning-100 text-warning-700 cursor-pointer hover:bg-warning-200 transition-colors">
                        <i class="fa-solid fa-circle-dollar text-[9px]"></i>
                      </span>
                      <div class="tooltip-content">
                        Amount Due: {{ getDueAmount(student.dueAmount) }}
                      </div>
                    </div>
                    <span v-else-if="student.dueAmount === 0" class="inline-flex items-center justify-center w-5 h-5 rounded bg-secondary-100 text-secondary-500">
                      <i class="fa-solid fa-circle-dollar text-[9px]"></i>
                    </span>

                    <!-- Early Learner Badge -->
                    <div
                      class="relative group"
                      v-if="student.isEarlyLearner || student.schoolYear?.includes('Reception')"
                    >
                      <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200 transition-colors text-[8px] font-bold">
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
