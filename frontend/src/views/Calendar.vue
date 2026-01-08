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
  return amount > 1 ? `$${amount}` : 'NA';
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

  <!-- Calendar Grid -->
  <div v-else class="mt-4 overflow-x-auto">
    <div class="min-w-[600px]">
      <!-- Header Row -->
      <div class="grid gap-0 mb-3" :style="gridCols">
        <div></div>
        <div
          v-for="day in days"
          :key="day"
          class="flex justify-center"
        >
          <span
            :class="[
              'px-4 py-1.5 text-xs font-bold rounded-full',
              day === today
                ? 'bg-accent-300 text-primary-800'
                : 'text-primary-400'
            ]"
          >
            {{ day }}
          </span>
        </div>
      </div>

      <!-- Time Slot Rows -->
      <div
        v-for="(timing, rowIndex) in timings"
        :key="rowIndex"
        class="grid gap-0"
        :style="gridCols"
      >
        <!-- Time Label -->
        <div class="flex items-start justify-center pt-3">
          <span class="text-xs font-bold text-primary-400">{{ timing.text }}</span>
        </div>

        <!-- Day Cells -->
        <div
          v-for="(day, colIndex) in days"
          :key="day"
          :class="[
            'bg-white border border-secondary-200 p-3 min-h-[60px]',
            // Top corners
            rowIndex === 0 && colIndex === 0 ? 'rounded-tl-xl' : '',
            rowIndex === 0 && colIndex === days.length - 1 ? 'rounded-tr-xl' : '',
            // Bottom corners
            rowIndex === timings.length - 1 && colIndex === 0 ? 'rounded-bl-xl' : '',
            rowIndex === timings.length - 1 && colIndex === days.length - 1 ? 'rounded-br-xl' : '',
            // Border adjustments
            colIndex < days.length - 1 ? 'border-r-0' : '',
            rowIndex < timings.length - 1 ? 'border-b-0' : ''
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

              <!-- Student Name -->
              <span class="text-secondary-800 text-xs">
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
