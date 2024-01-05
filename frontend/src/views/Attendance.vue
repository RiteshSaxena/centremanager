<script setup lang="ts">
import { computed, onMounted } from 'vue';
import moment from 'moment';

import { useSlotStore, useLogBookStore } from '@/stores';
import { Popover } from 'bootstrap';

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
      return slot[0].children.map((child) => {
        let attendance = '';
        const timeLog: string[] = [];
        const studentFilteredList = logBookStore.list.filter((log) => log.student?.id === child.id);

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

        return {
          ...child,
          attendance,
          timeLog
        };
      });
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
      placement: 'top',
      html: true
    });
  }, 1000);
});
</script>

<template>
  <div class="calendar-container" v-if="!loading">
    <div class="calendar-row">
      <div></div>
      <span class="calendar-header calendar-header-active">{{ day }}</span>
    </div>
    <div class="calendar-row" v-for="(timing, index) in timings" :key="index">
      <div class="calendar-header">{{ timing.text }}</div>
      <div class="student-list">
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
          <span
            v-if="student.attendance === 'present'"
            class="badge badge-green cursor-pointer rounded-pill me-1"
            data-bs-toggle="popover"
            :data-bs-content="student.timeLog.join('<br>')"
          >
            <i class="fa-solid fa-check"></i>
          </span>
          <span
            v-else-if="student.attendance === 'absent'"
            class="badge badge-red rounded-pill me-1"
          >
            <i class="fa-solid fa-xmark"></i>
          </span>
          <span
            v-else-if="student.attendance === 'in-class'"
            class="badge badge-blue cursor-pointer rounded-pill me-1"
            data-bs-toggle="popover"
            :data-bs-content="student.timeLog.join('<br>')"
          >
            <i class="fa-solid fa-arrow-right"></i>
          </span>
          <span v-else class="badge badge-grey rounded-pill me-1">
            <i class="fa-solid fa-minus"></i>
          </span>
          <span class="ms-1 me-2"> {{ student.firstName }} {{ student.lastName }} </span>
          <span
            v-if="student.isEarlyLearner || student.schoolYear?.includes('Reception')"
            class="badge badge-yellow cursor-pointer rounded-pill"
            data-bs-toggle="popover"
            data-bs-content="Early Learner"
          >
            EL
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
</template>

<style scoped lang="scss">
.calendar-container {
  margin-top: 20px;
}
.calendar-row {
  display: grid;
  grid-template-columns: 0.5fr 1fr 1fr 1fr;
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
  height: 12px;
  line-height: 12px;
  width: 12px;
  padding: 1px 3px;
}
</style>
