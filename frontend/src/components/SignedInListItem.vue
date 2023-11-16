<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed } from 'vue';

const props = defineProps<{
  item: LogRecord;
}>();

defineEmits(['click']);

const iconColorClass = computed(() => {
  if (props.item?.student) {
    if (props.item.student.gender === 'Male') {
      return 'icon-male';
    } else if (props.item.student.gender === 'Female') {
      return 'icon-female';
    }
  }
  return 'icon-general';
});

const fullName = computed(() => {
  if (props.item?.type === 'Staff') {
    return `${props.item?.staff?.firstName} ${props.item?.staff?.lastName}`;
  }
  if (props.item?.type === 'Student') {
    return `${props.item?.student?.firstName} ${props.item?.student?.lastName}`;
  }
  if (props.item?.type === 'Parent') {
    return `${props.item?.parent?.firstName} ${props.item?.parent?.lastName}`;
  }
  if (props.item?.type === 'StudentWithParent') {
    return `${props.item?.student?.firstName} ${props.item?.student?.lastName}, ${props.item?.parent?.firstName} ${props.item?.parent?.lastName}`;
  }
  if (props.item?.type === 'Guest') {
    return `${props.item?.guest?.firstName} ${props.item?.guest?.lastName}`;
  }
  return '';
});

const desc = computed(() => {
  let text = '';
  if (props.item?.type === 'Student' || props.item?.type === 'StudentWithParent') {
    text = 'Student';

    if (props.item?.student?.schoolYear) {
      text += ` - ${props.item?.student?.schoolYear}`;
    }

    if (props.item?.parent?.contactNumber) {
      text += ` - ${props.item?.parent?.contactNumber}`;
    }
  } else if (props.item?.type === 'Staff') {
    text = 'Staff';
    if (props.item?.staff?.phoneNumber) {
      text += ` - ${props.item?.staff?.phoneNumber}`;
    } else if (props.item?.staff?.email) {
      text += ` - ${props.item?.staff?.email}`;
    }
  } else if (props.item?.type === 'Parent') {
    text = 'Parent';
    if (props.item?.parent?.contactNumber) {
      text += ` - ${props.item?.parent?.contactNumber}`;
    } else if (props.item?.parent?.email) {
      text += ` - ${props.item?.parent?.email}`;
    }
  } else if (props.item?.type === 'Guest') {
    text = 'Guest';
    if (props.item?.guest?.phoneNumber) {
      text += ` - ${props.item?.guest?.phoneNumber}`;
    } else if (props.item?.guest?.email) {
      text += ` - ${props.item?.guest?.email}`;
    }
  }
  return text;
});
</script>

<template>
  <div class="child-list-item d-flex align-items-center gap-3" @click="$emit('click')">
    <i class="fa-solid fa-user" :class="iconColorClass"></i>
    <div>
      <span class="name">{{ fullName }}</span>
      <span class="desc">
        {{ desc }}
      </span>
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
