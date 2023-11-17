<script setup lang="ts">
import CentreHeader from '@/components/CentreHeader.vue';
import { computed, onMounted } from 'vue';
import moment from 'moment';

import { useSlotStore, useLogBookStore } from '@/stores';

const slotStore = useSlotStore();
const logBookStore = useLogBookStore();

const loading = computed(() => slotStore.loading);

interface Timing {
  text: string;
  start: string;
  end: string;
}

const day = moment().format('dddd');

const formatTime = (time: string) => {
  let timeArr = time.split(':');
  if (timeArr.length > 2) {
    timeArr = timeArr.slice(0, 2);
  }
  return timeArr.join(':');
};

const timings = computed<Timing[]>(() => {
  const timings: Timing[] = [];

  const slots = slotStore.slots.filter((slot) => slot.day === day);

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

const getStudentAttendance = computed(() => {
  return (id: number, timing: Timing) => {
    const isPresent = logBookStore.list.find((log) => log.student?.id === id);

    if (!isPresent) {
      const isSlotActive = moment().isAfter(moment(timing.start, 'HH:mm:ss.SSS'));

      if (isSlotActive) {
        return 'absent';
      }

      return '';
    }

    if (isPresent.signOutTime) {
      return 'present';
    }

    return 'in-class';
  };
});

onMounted(async () => {
  await logBookStore.fetchList();
  await slotStore.fetchSlots();
});
</script>

<template>
  <div class="p-4">
    <CentreHeader />
    <div class="calendar-container" v-if="!loading">
      <div class="calendar-row">
        <div></div>
        <span class="calendar-header calendar-header-active">{{ day }}</span>
      </div>
      <div class="calendar-row" v-for="(timing, index) in timings" :key="index">
        <div class="calendar-header">{{ timing.text }}</div>
        <div class="student-list">
          <span v-for="student in getStudents(day, timing)" :key="student.id">
            {{ student.firstName }} {{ student.lastName }}
            <span v-if="getStudentAttendance(student.id, timing) === 'present'">
              <i class="fa-solid fa-circle-check text-success ms-1"></i>
            </span>
            <span v-if="getStudentAttendance(student.id, timing) === 'absent'">
              <i class="fa-solid fa-circle-xmark text-danger ms-1"></i>
            </span>
            <span v-if="getStudentAttendance(student.id, timing) === 'in-class'">
              <i class="fa-solid fa-circle-arrow-right text-primary ms-1"></i>
            </span>
          </span>
        </div>
      </div>
      <div class="calendar-row" v-if="!timings.length">
        <div></div>
        <p class="text-muted small">No slots found for today.</p>
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
</style>
