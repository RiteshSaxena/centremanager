<script setup lang="ts">
import type { SearchResult } from '@/types';

import { computed } from 'vue';

import { useStudentStore } from '@/stores';

const studentStore = useStudentStore();

const props = defineProps<{
  item: SearchResult;
}>();

defineEmits(['click']);

const iconColorClass = computed(() => {
  if (props.item?.type) {
    if (props.item.type === 'student') {
      if (props.item.gender === 'Male') {
        return 'icon-male';
      } else if (props.item.gender === 'Female') {
        return 'icon-female';
      }
    }
  }
  return 'icon-general';
});

const isStudentDue = computed(() => {
  if (props.item?.type === 'student') {
    if (!studentStore.books.enabled) {
      return false;
    }
    const student = studentStore.books.dueStudents.find((student) => student.id === props.item?.id);
    if (student) {
      return true;
    }
  }
  return false;
});
</script>

<template>
  <div class="child-list-item d-flex align-items-center gap-3" @click="$emit('click')">
    <i class="fa-solid fa-user" :class="iconColorClass"></i>
    <div>
      <span class="name d-flex align-items-center">
        <span>{{ item?.firstName }} {{ item?.lastName }}</span>
        <span v-if="isStudentDue" class="badge cursor-pointer badge-yellow rounded-pill ms-2">
          <i class="fa-solid fa-dollar-sign"></i>
        </span>
      </span>
      <span class="desc" v-if="item?.type === 'student'">
        Student {{ item?.schoolYear ? '- ' + item?.schoolYear : '' }}
      </span>
      <span class="desc" v-if="item?.type === 'staff'"> Staff - {{ item?.email }} </span>
      <span class="desc" v-if="item?.type === 'parent'"> {{ (item as any)?.contactNumber }} </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.child-list-item {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 10px 25px;
  margin-bottom: 10px;
  cursor: pointer;

  &:hover {
    background: #ffe08a;
  }

  .name,
  .desc {
    font-size: 12px;
    line-height: 18px;
    color: #193b4d;
    display: block;
  }
  .name {
    font-weight: 700;
  }
}
.icon-male {
  color: #3488ce;
}
.icon-female {
  color: #eb72ff;
}
.icon-general {
  color: #b5b5b5;
}
</style>
