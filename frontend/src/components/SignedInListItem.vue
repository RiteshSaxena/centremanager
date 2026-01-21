<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';
import { useUserStore } from '@/stores';

const feedbackData = ref<any | null>(null);
const feedbackBtnClass = ref('bg-secondary-400');
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
  feedbackData.value = props.item.feedback;
  updateFeedbackIcon();
};

watch(
  () => props.item.feedback,
  () => fetchFeedbackStatus()
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
  feedbackBtnClass.value = 'bg-secondary-400';
  if (!f) return;
  // Percent feedback required
  if (f.isPercentFeedbackRequired) {
    feedbackBtnClass.value = 'bg-danger-500';
    return;
  }
  const hasFeedbackText = !!f.feedback?.trim();
  const hasMaths = props.item.student?.subjects?.some((subj: any) => subj.name === 'Maths');
  const hasEnglish = props.item.student?.subjects?.some((subj: any) => subj.name === 'English');
  const mathFilled = f.mathScore !== null && f.mathScore !== undefined && f.mathTime;
  const englishFilled = f.englishScore !== null && f.englishScore !== undefined && f.englishTime;

  let isComplete = false;
  // both subjects
  if (hasFeedbackText) {
    if (hasMaths && hasEnglish) {
      if (mathFilled && englishFilled) {
        isComplete = true;
      }
    } else if (hasMaths && !hasEnglish) {
      if (mathFilled) {
        isComplete = true;
      }
    } else if (!hasMaths && hasEnglish) {
      if (englishFilled) {
        isComplete = true;
      }
    } else {
      isComplete = true;
    }
  }
  if (isComplete) {
    feedbackBtnClass.value = 'bg-success-500';
  }
};

const rowPhoneNumber = computed(() => {
  if (
    props.item?.type === 'Student' ||
    props.item?.type === 'StudentWithParent' ||
    props.item?.type === 'Parent'
  ) {
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
      return 'text-blue-500';
    } else if (props.item.student.gender === 'Female') {
      return 'text-pink-400';
    }
  }
  return 'text-secondary-400';
});

const typeTagClass = computed(() => {
  switch (type.value) {
    case 'Student':
      return 'bg-secondary-100 text-secondary-700';
    case 'Staff':
      return 'bg-red-100 text-red-700';
    case 'Guest':
      return 'bg-blue-100 text-blue-700';
    case 'Parent':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-secondary-100 text-secondary-700';
  }
});
</script>

<template>
  <div
    class="group bg-white border border-secondary-200 rounded-xl p-3 mb-3 md:p-4 cursor-pointer hover:border-primary-300 hover:shadow-md transition-all duration-200"
  >
    <div class="flex items-center gap-3 md:gap-4">
      <!-- Icon -->
      <div class="shrink-0" @click.stop="$emit('onSelect')">
        <div
          class="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors"
        >
          <i class="fa-solid fa-user text-base md:text-lg" :class="iconColorClass"></i>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0" @click.stop="$emit('onSelect')">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="font-semibold text-secondary-900 text-sm md:text-base">{{ name }}</span>
          <span
            v-if="type != 'Student'"
            :class="[
              'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
              typeTagClass
            ]"
          >
            {{ type }}
          </span>
        </div>
        <p class="text-xs md:text-sm text-secondary-500 wrap-break-word">{{ desc }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 shrink-0">
        <button
          v-if="props.item?.type === 'Student'"
          @click.stop.prevent="$emit('onFeedback', props.item)"
          :class="[
            'flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg text-white transition-transform hover:scale-110',
            feedbackBtnClass
          ]"
          title="Feedback"
        >
          <i class="fa-regular fa-comments text-sm"></i>
        </button>
        <a
          :href="`tel:${rowPhoneNumber}`"
          v-if="canShowCallIcon && rowPhoneNumber"
          class="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-all hover:scale-110"
          title="Call"
        >
          <i class="fa-solid fa-phone text-sm"></i>
        </a>
      </div>
    </div>
  </div>
</template>
