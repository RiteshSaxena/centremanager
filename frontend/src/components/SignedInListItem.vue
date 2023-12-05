<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  item: LogRecord;
}>();

defineEmits(['onSelect']);

const name = ref('');
const type = ref('');
const desc = ref('');
const phoneNumber = ref('');

const updateVars = () => {
  if (props.item?.type === 'Student') {
    name.value = `${props.item?.student?.firstName} ${props.item?.student?.lastName}`;
    type.value = 'Student';
    desc.value = '';
    if (props.item?.student?.schoolYear) {
      desc.value += `${props.item?.student?.schoolYear}`;
    }
    if (props.item?.parent?.contactNumber) {
      desc.value += ` - ${props.item?.parent?.contactNumber}`;
      phoneNumber.value = props.item?.parent?.contactNumber;
    }
  } else if (props.item?.type === 'StudentWithParent') {
    name.value = `${props.item?.student?.firstName} ${props.item?.student?.lastName}, ${props.item?.parent?.firstName} ${props.item?.parent?.lastName}`;
    type.value = 'Student';
    desc.value = '';
    if (props.item?.student?.schoolYear) {
      desc.value += ` - ${props.item?.student?.schoolYear}`;
    }
    if (props.item?.parent?.contactNumber) {
      desc.value += ` - ${props.item?.parent?.contactNumber}`;
      phoneNumber.value = props.item?.parent?.contactNumber;
    }
  } else if (props.item?.type === 'Staff') {
    name.value = `${props.item?.staff?.firstName} ${props.item?.staff?.lastName}`;
    type.value = 'Staff';
    desc.value = '';
    if (props.item?.staff?.phoneNumber) {
      desc.value += `${props.item?.staff?.phoneNumber}`;
      phoneNumber.value = props.item?.staff?.phoneNumber;
    } else if (props.item?.staff?.email) {
      desc.value += ` - ${props.item?.staff?.email}`;
    }
  } else if (props.item?.type === 'Parent') {
    name.value = `${props.item?.parent?.firstName} ${props.item?.parent?.lastName}`;
    type.value = 'Parent';
    desc.value = '';
    if (props.item?.parent?.contactNumber) {
      desc.value += ` - ${props.item?.parent?.contactNumber}`;
      phoneNumber.value = props.item?.parent?.contactNumber;
    } else if (props.item?.parent?.email) {
      desc.value += ` - ${props.item?.parent?.email}`;
    }
  } else if (props.item?.type === 'Guest') {
    name.value = `${props.item?.guest?.firstName} ${props.item?.guest?.lastName}`;
    type.value = 'Guest';
    desc.value = '';
    if (props.item?.guest?.phoneNumber) {
      desc.value += ` - ${props.item?.guest?.phoneNumber}`;
      phoneNumber.value = props.item?.guest?.phoneNumber;
    } else if (props.item?.guest?.email) {
      desc.value += ` - ${props.item?.guest?.email}`;
    }
  }
};

watch(props.item, () => {
  updateVars();
});

onMounted(() => {
  updateVars();
});

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
</script>

<template>
  <div class="child-list-item">
    <div class="d-flex align-items-center gap-3 w-100" @click.prevent="$emit('onSelect')">
      <i class="fa-solid fa-user" :class="iconColorClass"></i>
      <div>
        <span class="name">{{ name }} ({{ type }})</span>
        <span class="desc">
          {{ desc }}
        </span>
      </div>
    </div>
    <a :href="`tel:${phoneNumber}`" v-if="phoneNumber" class="btn btn-secondary btn-sm m-0 rounded-3">
      <i class="fa-solid fa-phone"></i>
    </a>
  </div>
</template>

<style scoped lang="scss">
.child-list-item {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 10px 25px;
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

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
