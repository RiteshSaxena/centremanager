<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useFeedbackStore } from '@/stores/feedback';
import { Modal } from '@/components/ui';
import { Button, Spinner, Checkbox, Textarea } from '@/components/ui';

const feedbackStore = useFeedbackStore();
const toast = useToast();

const props = withDefaults(
  defineProps<{
    show: boolean;
    item: LogRecord | null;
  }>(),
  { show: false, item: null }
);

const emit = defineEmits(['update:show', 'onSuccess']);

const loading = ref(false);
const originalFeedback = ref<any>(null);
const previousScores = ref({ math: '', english: '' });

const getInitialForm = () => ({
  mathScore: '',
  englishScore: '',
  mathTime: '',
  englishTime: '',
  feedback: '',
  isPercentFeedbackRequired: false,
  isEnglishChecked: false,
  isMathChecked: false
});

const feedbackForm = ref(getInitialForm());

const errors = ref({
  mathScore: '',
  englishScore: '',
  mathTime: '',
  englishTime: ''
});

const resetForm = () => {
  feedbackForm.value = getInitialForm();
  originalFeedback.value = null;
};

const resetErrors = () => {
  errors.value = { mathScore: '', englishScore: '', mathTime: '', englishTime: '' };
};

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = '';
};

const onScoreInput = (value: string, field: 'mathScore' | 'englishScore') => {
  const v = value.replace(/\D/g, '');
  if (v === '') {
    feedbackForm.value[field] = '';
    return;
  }
  const num = Math.min(parseInt(v, 10), 99);
  feedbackForm.value[field] = String(num);
};

const studentSubjects = computed(() => props.item?.student?.subjects ?? []);

const hasSubject = (name: string) =>
  studentSubjects.value.some((s: any) => s.name.toLowerCase() === name);

const hasMaths = computed(() => hasSubject('maths'));
const hasEnglish = computed(() => hasSubject('english'));

const selectedName = computed(() => {
  const item = props.item;
  if (!item) return '';

  if (['Student', 'StudentWithParent', 'Parent'].includes(item.type)) {
    const parentName = `${item.parent?.firstName} ${item.parent?.lastName}`;
    if (item.student) {
      return `${item.student.firstName} ${item.student.lastName} (${parentName})`;
    }
    return parentName;
  }
  if (item.type === 'Staff') {
    return `${item.staff?.firstName} ${item.staff?.lastName}`;
  }
  if (item.type === 'Guest') {
    return `${item.guest?.firstName} ${item.guest?.lastName}`;
  }
  return '';
});

const hasChanges = () => {
  if (!originalFeedback.value) return true;
  const form = feedbackForm.value;
  const orig = originalFeedback.value;
  return (
    Number(form.mathScore) !== orig.mathScore ||
    Number(form.englishScore) !== orig.englishScore ||
    form.mathTime !== orig.mathTime ||
    form.englishTime !== orig.englishTime ||
    form.feedback !== orig.feedback ||
    form.isPercentFeedbackRequired !== orig.isPercentFeedbackRequired
  );
};

const getScorePayload = (hasSubject: boolean, isChecked: boolean, score: string) => {
  if (!hasSubject) return null;
  if (isChecked) return 100;
  return score ? Number(score) : null;
};

const getTimePayload = (hasSubject: boolean, time: string) => {
  if (!hasSubject) return null;
  return time ? Number(time) : null;
};

const submitFeedback = async () => {
  if (!props.item?.student?.id) return;

  if (!hasChanges()) {
    toast.info('No changes detected');
    return;
  }

  try {
    loading.value = true;
    const form = feedbackForm.value;
    const payload = {
      mathScore: getScorePayload(hasMaths.value, form.isMathChecked, form.mathScore),
      englishScore: getScorePayload(hasEnglish.value, form.isEnglishChecked, form.englishScore),
      mathTime: getTimePayload(hasMaths.value, form.mathTime),
      englishTime: getTimePayload(hasEnglish.value, form.englishTime),
      isPercentFeedbackRequired: form.isPercentFeedbackRequired,
      createdDate: new Date().toISOString().split('T')[0],
      child: props.item.student.id,
      feedback: form.feedback
    };

    if (feedbackStore.todayFeedback) {
      await feedbackStore.updateFeedback(props.item.student.id, payload);
      toast.success('Feedback updated successfully');
    } else {
      await feedbackStore.createFeedback(payload);
      toast.success('Feedback submitted successfully');
    }
    emit('onSuccess');
    emit('update:show', false);
  } catch {
    toast.error('Failed to save feedback');
  } finally {
    loading.value = false;
  }
};

const populateFormFromFeedback = (feedback: any) => {
  const form = feedbackForm.value;
  form.isMathChecked = feedback.mathScore === 100;
  form.isEnglishChecked = feedback.englishScore === 100;

  const getScoreString = (score: number | null | undefined) =>
    score !== null && score !== undefined && score !== 100 ? String(score) : '';

  form.mathScore = getScoreString(feedback.mathScore);
  form.englishScore = getScoreString(feedback.englishScore);
  previousScores.value.math = form.mathScore;
  previousScores.value.english = form.englishScore;
  form.mathTime = feedback.mathTime || '';
  form.englishTime = feedback.englishTime || '';
  form.feedback = feedback.feedback || '';
  form.isPercentFeedbackRequired = feedback.isPercentFeedbackRequired ?? false;

  originalFeedback.value = {
    mathScore: feedback.mathScore,
    englishScore: feedback.englishScore,
    mathTime: feedback.mathTime,
    englishTime: feedback.englishTime,
    feedback: feedback.feedback,
    isPercentFeedbackRequired: feedback.isPercentFeedbackRequired ?? false
  };
};

watch(
  () => props.show,
  async (val) => {
    if (!val) {
      resetErrors();
      return;
    }

    resetForm();
    resetErrors();
    feedbackStore.resetTodayFeedback();

    if (props.item?.student?.id) {
      try {
        loading.value = true;
        const feedback = await feedbackStore.fetchTodayFeedbackByChild(props.item.student.id);
        if (feedback) {
          populateFormFromFeedback(feedback);
        }
      } finally {
        loading.value = false;
      }
    }
  }
);

const createCheckedWatcher = (
  subject: 'math' | 'english',
  scoreField: 'mathScore' | 'englishScore',
  errorField: 'mathScore' | 'englishScore'
) => {
  return (checked: boolean) => {
    if (checked) {
      previousScores.value[subject] = feedbackForm.value[scoreField];
      feedbackForm.value[scoreField] = '';
      errors.value[errorField] = '';
    } else {
      feedbackForm.value[scoreField] = previousScores.value[subject];
    }
  };
};

watch(
  () => feedbackForm.value.isMathChecked,
  createCheckedWatcher('math', 'mathScore', 'mathScore')
);
watch(
  () => feedbackForm.value.isEnglishChecked,
  createCheckedWatcher('english', 'englishScore', 'englishScore')
);
</script>

<template>
  <Modal size="md" :open="show" :closable="true" @close="emit('update:show', false)">
    <template #title>
      <div class="flex flex-col">
        <span>Feedback</span>
        <small class="text-sm text-secondary-500">{{ selectedName }}</small>
      </div>
    </template>

    <div class="text-center mb-3" v-if="loading">
      <Spinner size="md" />
    </div>

    <div v-if="!loading" class="w-full text-base flex flex-col gap-2">
      <div class="grid grid-cols-12 gap-2">
        <div class="col-span-5"></div>
        <div class="col-span-3 text-left"><strong>Wrong</strong></div>
        <div class="col-span-4">
          <strong>Time <small>(M)</small></strong>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-2 items-center" v-if="hasMaths">
        <div class="col-span-5">
          <div class="flex gap-3 items-center w-full justify-between">
            <span class="text-sm"><b>Maths</b></span>
            <Checkbox v-model="feedbackForm.isMathChecked" label="100%" />
          </div>
        </div>
        <div class="col-span-3 text-left">
          <input
            type="text"
            v-model="feedbackForm.mathScore"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            :disabled="feedbackForm.isMathChecked"
            @input="
              onScoreInput(($event.target as HTMLInputElement).value, 'mathScore');
              clearError('mathScore');
            "
            :class="[
              'w-12 px-2 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.mathScore ? 'border-danger-500' : 'border-secondary-200',
              feedbackForm.isMathChecked ? 'bg-secondary-100 text-secondary-400' : 'bg-white'
            ]"
          />
          <p v-if="errors.mathScore" class="text-xs text-danger-500 mt-1">{{ errors.mathScore }}</p>
        </div>
        <div class="col-span-4">
          <input
            type="text"
            v-model="feedbackForm.mathTime"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            @input="clearError('mathTime')"
            :class="[
              'w-full px-2 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.mathTime ? 'border-danger-500' : 'border-secondary-200'
            ]"
          />
          <p v-if="errors.mathTime" class="text-xs text-danger-500 mt-1">{{ errors.mathTime }}</p>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-2 items-center" v-if="hasEnglish">
        <div class="col-span-5">
          <div class="flex gap-3 items-center w-full justify-between">
            <span class="text-sm"><b>Eng</b></span>
            <Checkbox v-model="feedbackForm.isEnglishChecked" label="100%" />
          </div>
        </div>
        <div class="col-span-3 text-left">
          <input
            type="text"
            v-model="feedbackForm.englishScore"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            :disabled="feedbackForm.isEnglishChecked"
            @input="
              onScoreInput(($event.target as HTMLInputElement).value, 'englishScore');
              clearError('englishScore');
            "
            :class="[
              'w-full px-2 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.englishScore ? 'border-danger-500' : 'border-secondary-200',
              feedbackForm.isEnglishChecked ? 'bg-secondary-100 text-secondary-400' : 'bg-white'
            ]"
          />
          <p v-if="errors.englishScore" class="text-xs text-danger-500 mt-1">
            {{ errors.englishScore }}
          </p>
        </div>
        <div class="col-span-4">
          <input
            type="text"
            v-model="feedbackForm.englishTime"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            @input="clearError('englishTime')"
            :class="[
              'w-full px-2 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              errors.englishTime ? 'border-danger-500' : 'border-secondary-200'
            ]"
          />
          <p v-if="errors.englishTime" class="text-xs text-danger-500 mt-1">
            {{ errors.englishTime }}
          </p>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-left mb-2"><b>Feedback</b></label>
        <Textarea v-model="feedbackForm.feedback" :rows="7" />
        <div class="mt-2">
          <Checkbox
            v-model="feedbackForm.isPercentFeedbackRequired"
            label="In person feedback required."
          />
        </div>
      </div>
    </div>

    <template #footer>
      <Button :disabled="loading" @click="submitFeedback">
        {{ feedbackStore.todayFeedback ? 'Update' : 'Submit' }}
      </Button>
    </template>
  </Modal>
</template>
