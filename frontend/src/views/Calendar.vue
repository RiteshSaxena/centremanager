<script setup lang="ts">
import CentreHeader from '@/components/CentreHeader.vue';
import { computed, onMounted } from 'vue';
import moment from 'moment';

import { useSlotStore } from '@/stores';

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
  const timings: Timing[] = [];

  slotStore.slots.forEach((slot) => {
    const isExists = timings.find(
      (time) => time.start === slot.startTime && time.end === slot.endTime
    );

    if (isExists) {
      return;
    }

    timings.push({
      start: slot.startTime,
      end: slot.endTime,
      text: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`
    });
  });

  timings.sort((a, b) => {
    if (a.text < b.text) {
      return -1;
    }
    if (a.text > b.text) {
      return 1;
    }

    return 0;
  });

  return timings;
});

const days = computed(() => {
  const days: string[] = [];

  days.push(moment().subtract(1, 'day').format('dddd'));
  days.push(moment().format('dddd'));
  days.push(moment().add(1, 'day').format('dddd'));
  days.push(moment().add(2, 'days').format('dddd'));

  return days;
});

const getStudents = computed(() => {
  return (day: string, timing: Timing) => {
    const slot = slotStore.slots.filter(
      (slot) => slot.day === day && slot.startTime === timing.start && slot.endTime === timing.end
    );

    if (slot.length) {
      return slot[0].children;
    }
    return [];
  };
});

onMounted(async () => {
  await slotStore.fetchSlots();
});
</script>

<template>
  <div class="p-4">
    <CentreHeader />
    <div class="calendar-container" v-if="!loading">
      <div class="calendar-row">
        <div></div>
        <span
          class="calendar-header"
          v-for="(day, index) in days"
          :key="day"
          :class="{ 'calendar-header-active': index === 1 }"
          >{{ day }}
        </span>
      </div>
      <div class="calendar-row" v-for="(timing, index) in timings" :key="index">
        <div class="calendar-header">{{ timing.text }}</div>
        <div class="student-list" v-for="day in days" :key="day">
          <span v-for="student in getStudents(day, timing)" :key="student.id">
            {{ student.firstName }}
          </span>
        </div>
      </div>
    </div>
    <div class="text-center my-4" v-else>
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.calendar-container {
  margin-top: 20px;
}
.calendar-row {
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 1fr 1fr;
  align-items: center;
  justify-items: center;
  .calendar-header {
    color: #64b6e6;
    font-size: 12px;
    line-height: 18px;
    font-weight: 700;
    justify-self: center;
    padding: 5px 15px;
    border-radius: 15px;
    margin-bottom: 15px;

    &.calendar-header-active {
      color: #193b4d;
      background: #ffe08a;
    }
  }

  .student-list {
    background: white;
    min-height: 150px;
    border: 1px solid #dbdbdb;
    border-right: 0;
    border-bottom: 0;
    color: #193b4d;
    font-size: 12px;
    line-height: 18px;
    padding: 10px;
    width: 100%;
    display: flex;
    flex-direction: column;

    &:last-child {
      border-right: 1px solid #dbdbdb;
    }
  }

  &:nth-child(2) {
    .student-list:nth-child(2) {
      border-top-left-radius: 15px;
    }
    .student-list:last-child {
      border-top-right-radius: 15px;
    }
  }

  &:last-child {
    .student-list {
      border-bottom: 1px solid #dbdbdb;
    }
    .student-list:nth-child(2) {
      border-bottom-left-radius: 15px;
    }
    .student-list:last-child {
      border-bottom-right-radius: 15px;
    }
  }
}
</style>
