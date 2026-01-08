<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';
import { userStore as useUserStore } from '@/stores/user';
import { useFeedbackStore } from '@/stores/feedback';

const feedbackStore = useFeedbackStore();
const feedbackData = ref<any | null>(null);
const feedbackBtnClass = ref('btn-secondary');
const userStore = useUserStore();
const props = defineProps<{
  item: LogRecord;
}>();
defineEmits(['onSelect', 'onFeedback']);
const name = ref('');
const type = ref('');
const desc = ref('');

const fetchFeedbackStatus = async () => {
  if (props.item.type !== 'Student' || !props.item.student?.id) return;
  const feedback = await feedbackStore.fetchTodayFeedbackByChild(props.item.student.id);
  feedbackData.value = feedback; // already single object or null
  updateFeedbackIcon();
};

watch(
  () => props.item.student?.id,
  () => fetchFeedbackStatus()
);

// Auto-update icon when feedback is submitted for this student
watch(
  () => feedbackStore.todayFeedback,
  (newFeedback) => {
    if (props.item.type !== 'Student' || !props.item.student?.id) return;
    if (newFeedback?.child === props.item.student.id) {
      feedbackData.value = newFeedback;
      updateFeedbackIcon();
    }
  }
);
const updateVars = () => {
  name.value = '';
  type.value = '';
  desc.value = '';
  const signInTime = moment(props.item?.signInTime).format('hh:mmA');
  if (props.item?.type === 'Student') {
    name.value = `${props.item?.student?.firstName} ${props.item?.student?.lastName}`;
    type.value = 'Student';
    desc.value = '';
    const descArr = [];
    if (props.item?.student?.schoolYear) {
      descArr.push(`${props.item?.student?.schoolYear}`);
    }
    if (props.item?.parent?.contactNumber) {
      descArr.push(`${props.item?.parent?.contactNumber}`);
    }
    descArr.push(signInTime);
    desc.value = descArr.join(' - ');
  } else if (props.item?.type === 'StudentWithParent') {
    name.value = `${props.item?.student?.firstName} ${props.item?.student?.lastName}, ${props.item?.parent?.firstName} ${props.item?.parent?.lastName}`;
    type.value = 'Student';
    desc.value = '';
    const descArr = [];
    if (props.item?.student?.schoolYear) {
      descArr.push(`${props.item?.student?.schoolYear}`);
    }
    if (props.item?.parent?.contactNumber) {
      descArr.push(`${props.item?.parent?.contactNumber}`);
    }
    descArr.push(signInTime);
    desc.value = descArr.join(' - ');
  } else if (props.item?.type === 'Staff') {
    name.value = `${props.item?.staff?.firstName} ${props.item?.staff?.lastName}`;
    type.value = 'Staff';
    desc.value = '';
    if (props.item?.staff?.phoneNumber) {
      desc.value += `${props.item?.staff?.phoneNumber}`;
    } else if (props.item?.staff?.email) {
      desc.value += `${props.item?.staff?.email}`;
    }
    desc.value += ` - ${signInTime}`;
  } else if (props.item?.type === 'Parent') {
    name.value = `${props.item?.parent?.firstName} ${props.item?.parent?.lastName}`;
    type.value = 'Parent';
    desc.value = '';
    if (props.item?.parent?.contactNumber) {
      desc.value += `${props.item?.parent?.contactNumber}`;
    } else if (props.item?.parent?.email) {
      desc.value += `${props.item?.parent?.email}`;
    }
    desc.value += ` - ${signInTime}`;
  } else if (props.item?.type === 'Guest') {
    name.value = `${props.item?.guest?.firstName} ${props.item?.guest?.lastName}`;
    type.value = 'Guest';
    desc.value = '';
    if (props.item?.guest?.phoneNumber) {
      desc.value += `${props.item?.guest?.phoneNumber}`;
    } else if (props.item?.guest?.email) {
      desc.value += `${props.item?.guest?.email}`;
    }
    desc.value += ` - ${signInTime}`;
  }
};

watch(props.item, () => {
  updateVars();
});

onMounted(() => {
  updateVars();
  fetchFeedbackStatus();
});

const updateFeedbackIcon = () => {
  const f = feedbackData.value;
  // Default (grey)
  feedbackBtnClass.value = 'btn-secondary';
  if (!f) return;
  // Percent feedback required
  if (f.isPercentFeedbackRequired) {
    feedbackBtnClass.value = 'btn-danger';
    return;
  }
  const hasFeedbackText = !!f.feedback?.trim();
  const hasMath = f.mathScore !== null && f.mathScore !== undefined && f.mathTime;

  const hasEnglish = f.englishScore !== null && f.englishScore !== undefined && f.englishTime;

  let isComplete = false;
  // both subjects
  if (hasMath && hasEnglish) {
    isComplete = hasFeedbackText;
  }
  // only maths
  else if (hasMath && !hasEnglish) {
    isComplete = hasFeedbackText;
  }
  // only english
  else if (!hasMath && hasEnglish) {
    isComplete = hasFeedbackText;
  }
  if (isComplete) {
    feedbackBtnClass.value = 'btn-success';
  }
};

const rowPhoneNumber = computed(() => {
  if (props.item?.type === 'Student' || props.item?.type === 'StudentWithParent' || props.item?.type === 'Parent') {
    return props.item.parent?.contactNumber || '';
  } else if (props.item?.type === 'Staff') {
    return props.item.staff?.phoneNumber || '';
  } else if (props.item?.type === 'Guest') {
    return props.item.guest?.phoneNumber || '';
  }
  return '';
});

const canShowCallIcon = computed(() => {
  if (!userStore.user) return false;
  return userStore.isAdmin;
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
    <div class="d-flex align-items-center gap-3 w-100" @click.stop="$emit('onSelect')">
      <i class="fa-solid fa-user" :class="iconColorClass"></i>
      <div>
        <span class="name">{{ name }} ({{ type }})</span>
        <span class="desc">
          {{ desc }}
        </span>
      </div>
    </div>
    <div class="d-flex gap-1 mr-2">
      <a
        v-if="props.item?.type === 'Student' || props.item?.type === 'StudentWithParent'"
        href="#"
        @click.stop.prevent="$emit('onFeedback', props.item)"
        :class="['btn align-items-center d-flex rounded-3', feedbackBtnClass]"
      >
        <i class="fa-comments fa-regular"></i>
      </a>
      <a
        :href="`tel:${rowPhoneNumber}`"
        v-if="canShowCallIcon && rowPhoneNumber"
        class="btn btn-secondary align-items-center d-flex rounded-3"
      >
        <i class="fa-solid fa-phone"></i>
      </a>
    </div>
  </div>
</template>

<style scoped lang="scss">
.child-list-item {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 10px 10px;
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
    font-size: 14px;
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
