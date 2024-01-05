<script setup lang="ts">
import { computed, onMounted } from 'vue';
import moment from 'moment';
import { Popover } from 'bootstrap';

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

  const slots = slotStore.slots.filter((slot) => days.value.includes(slot.day));

  slots.forEach((slot) => {
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
  const days: string[] = [];

  allDays.forEach((day) => {
    const isSlotExists = slotStore.slots.find((slot) => slot.day === day);

    if (isSlotExists && days.length < 4) {
      days.push(day);
    }
  });

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
  setTimeout(() => {
    new Popover('.calendar-container', {
      selector: '[data-bs-toggle="popover"]',
      trigger: 'click',
      container: 'body',
      placement: 'top'
    });
  }, 1000);
});
</script>

<template>
  <div class="text-center my-4" v-if="loading">
    <div class="spinner-border text-dark text-center" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  </div>
  <div class="calendar-container" v-else>
    <div class="calendar-row mb-3">
      <div></div>
      <span
        class="calendar-header"
        v-for="day in days"
        :key="day"
        :class="{ 'calendar-header-active': day === today }"
      >
        {{ day }}
      </span>
    </div>
    <div class="calendar-row" v-for="(timing, index) in timings" :key="index">
      <div class="calendar-header">{{ timing.text }}</div>
      <div class="student-list" v-for="day in days" :key="day">
        <span
          class="d-flex align-items-center mt-1"
          v-for="student in getStudents(day, timing)"
          :key="student.id"
        >
          <span
            v-if="student.dueAmount && student.dueAmount > 0"
            class="badge cursor-pointer badge-red rounded-pill me-1"
            data-bs-toggle="popover"
            :data-bs-content="`Amount Due: £${student.dueAmount}`"
          >
            <i class="fa-solid fa-dollar-sign"></i>
          </span>
          <span v-else-if="student.dueAmount === 0" class="badge badge-grey rounded-pill me-1">
            <i class="fa-solid fa-dollar-sign"></i>
          </span>
          <span class="ms-1 me-2"> {{ student.firstName }} {{ student.lastName }} </span>
          <span
            v-if="student.isEarlyLearner || student.schoolYear?.includes('Reception')"
            class="badge badge-grey cursor-pointer rounded-pill"
            data-bs-toggle="popover"
            data-bs-content="Early Learner"
          >
            <i class="fa-solid fa-e"></i>
          </span>
        </span>
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

    &.calendar-header-active {
      color: #193b4d;
      background: #ffe08a;
    }
  }

  .student-list {
    background: white;
    min-height: 50px;
    border: 1px solid #dbdbdb;
    border-right: 0;
    border-bottom: 0;
    color: #193b4d;
    font-size: 12px;
    line-height: 18px;
    padding: 10px;
    width: 100%;
    height: 100%;
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
.el-tag {
  font-size: 8px;
  padding: 5px;
}
</style>
