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
  <Modal size="xl" :open="show" :closable="true" title="Student Feedback" @close="emit('update:show', false)">
    <!-- Loading State -->
    <div v-if="loading" class="w-full flex justify-center items-center py-12">
      <Spinner size="lg" />
    </div>

    <div v-else class="space-y-6">
      <!-- Student Info Card -->
      <div class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6 border border-primary-200">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
            <i class="fa-solid fa-user text-white text-2xl"></i>
          </div>
          <div>
            <p class="text-base text-primary-600 font-medium mb-1">Student</p>
            <p class="text-2xl font-bold text-primary-900">{{ selectedName }}</p>
          </div>
        </div>
      </div>

      <!-- Performance Section -->
      <div class="space-y-4">
        <h3 class="text-lg font-bold text-secondary-900 uppercase tracking-wide">Today's Performance</h3>

        <!-- Mathematics Card -->
        <div v-if="hasMaths" class="bg-white rounded-2xl border-2 border-secondary-200 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-calculator text-blue-600 text-xl"></i>
            </div>
            <h4 class="text-xl font-bold text-secondary-900">Mathematics</h4>
            <div class="ml-auto">
              <Checkbox v-model="feedbackForm.isMathChecked" label="100% Score" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-secondary-700 mb-2">Wrong Answers</label>
              <input
                type="text"
                v-model="feedbackForm.mathScore"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="2"
                placeholder="Enter number"
                :disabled="feedbackForm.isMathChecked"
                @input="
                  onScoreInput(($event.target as HTMLInputElement).value, 'mathScore');
                  clearError('mathScore');
                "
                :class="[
                  'w-full px-4 py-3 text-base rounded-xl border-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  errors.mathScore ? 'border-danger-500' : 'border-secondary-200',
                  feedbackForm.isMathChecked ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-white'
                ]"
              />
              <p v-if="errors.mathScore" class="text-sm text-danger-500 mt-1 font-medium">{{ errors.mathScore }}</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-secondary-700 mb-2">Time Taken (Minutes)</label>
              <input
                type="text"
                v-model="feedbackForm.mathTime"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="2"
                placeholder="Enter minutes"
                @input="clearError('mathTime')"
                :class="[
                  'w-full px-4 py-3 text-base rounded-xl border-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  errors.mathTime ? 'border-danger-500' : 'border-secondary-200'
                ]"
              />
              <p v-if="errors.mathTime" class="text-sm text-danger-500 mt-1 font-medium">{{ errors.mathTime }}</p>
            </div>
          </div>
        </div>

        <!-- English Card -->
        <div v-if="hasEnglish" class="bg-white rounded-2xl border-2 border-secondary-200 p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <i class="fa-solid fa-book-open text-purple-600 text-xl"></i>
            </div>
            <h4 class="text-xl font-bold text-secondary-900">English</h4>
            <div class="ml-auto">
              <Checkbox v-model="feedbackForm.isEnglishChecked" label="100% Score" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-secondary-700 mb-2">Wrong Answers</label>
              <input
                type="text"
                v-model="feedbackForm.englishScore"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="2"
                placeholder="Enter number"
                :disabled="feedbackForm.isEnglishChecked"
                @input="
                  onScoreInput(($event.target as HTMLInputElement).value, 'englishScore');
                  clearError('englishScore');
                "
                :class="[
                  'w-full px-4 py-3 text-base rounded-xl border-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  errors.englishScore ? 'border-danger-500' : 'border-secondary-200',
                  feedbackForm.isEnglishChecked ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed' : 'bg-white'
                ]"
              />
              <p v-if="errors.englishScore" class="text-sm text-danger-500 mt-1 font-medium">{{ errors.englishScore }}</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-secondary-700 mb-2">Time Taken (Minutes)</label>
              <input
                type="text"
                v-model="feedbackForm.englishTime"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="2"
                placeholder="Enter minutes"
                @input="clearError('englishTime')"
                :class="[
                  'w-full px-4 py-3 text-base rounded-xl border-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors',
                  errors.englishTime ? 'border-danger-500' : 'border-secondary-200'
                ]"
              />
              <p v-if="errors.englishTime" class="text-sm text-danger-500 mt-1 font-medium">{{ errors.englishTime }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Feedback Section -->
      <div class="bg-secondary-50 rounded-2xl border-2 border-secondary-200 p-6">
        <div class="flex items-center gap-3 mb-4">
          <i class="fa-solid fa-comment-dots text-secondary-600 text-xl"></i>
          <label class="text-lg font-bold text-secondary-900">Instructor Notes</label>
        </div>
        <Textarea
          v-model="feedbackForm.feedback"
          :rows="6"
          placeholder="Enter detailed feedback for the student..."
          class="mb-4"
        />
        <div class="flex items-center gap-2">
          <Checkbox
            v-model="feedbackForm.isPercentFeedbackRequired"
            label="In-person feedback required"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3 w-full">
        <Button
          variant="outline"
          size="lg"
          @click="emit('update:show', false)"
          :disabled="loading"
          class="flex-1 text-lg h-14"
        >
          Cancel
        </Button>
        <Button
          size="lg"
          @click="submitFeedback"
          :disabled="loading"
          class="flex-1 text-lg h-14"
        >
          <i v-if="!loading" class="fa-solid fa-check mr-2 text-xl"></i>
          {{ feedbackStore.todayFeedback ? 'Update Feedback' : 'Submit Feedback' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
