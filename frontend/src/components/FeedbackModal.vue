<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useFeedbackStore, useLogBookStore } from '@/stores';
import { Modal } from '@/components/ui';
import { Button, Spinner, Checkbox, Textarea } from '@/components/ui';
import type { Feedback } from '@/types/log-book';

const logBookStore = useLogBookStore();
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
const formatting = ref(false);
const feedbackFormatted = ref(false);
const originalFeedback = ref<any>(null);
const previousScores = ref({ math: '', english: '' });
const modalRef = ref<HTMLElement | null>(null);

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
  feedbackFormatted.value = false;
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
    const parentName = `${item.parent?.firstName || ''} ${item.parent?.lastName || ''}`.trim();
    if (item.student) {
      const studentName = `${item.student.firstName} ${item.student.lastName}`;
      return parentName ? `${studentName} (${parentName})` : studentName;
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

const selectedNameMobile = computed(() => {
  const item = props.item;
  if (!item) return '';

  if (['Student', 'StudentWithParent', 'Parent'].includes(item.type)) {
    const parentName = `${item.parent?.firstName || ''} ${item.parent?.lastName || ''}`.trim();
    if (item.student) {
      const studentName = `${item.student.firstName} ${item.student.lastName}`;
      return parentName ? `${studentName}<br>(${parentName})` : studentName;
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

let isAIFormatting = false;

const formatFeedbackText = async () => {
  const text = feedbackForm.value.feedback.trim();
  if (!text) return;
  try {
    formatting.value = true;
    const student = props.item?.student;
    const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : '';
    const subjects = (student?.subjects ?? []).map((s: any) => s.name);
    const formatted = await feedbackStore.formatFeedback({ feedback: text, studentName, subjects });
    isAIFormatting = true;
    feedbackForm.value.feedback = formatted;
    feedbackFormatted.value = true;
  } catch {
    toast.error('Failed to format feedback');
  } finally {
    formatting.value = false;
  }
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
      createdDate: new Date().toISOString().split('T')[0]!,
      child: props.item.student.id,
      feedback: form.feedback
    };

    await feedbackStore.createOrUpdateFeedback(payload);

    if (props.item.feedback) {
      toast.success('Feedback updated successfully');
    } else {
      toast.success('Feedback submitted successfully');
    }
    await logBookStore.fetchList();
    emit('onSuccess');
    emit('update:show', false);
  } catch {
    toast.error('Failed to save feedback');
  } finally {
    loading.value = false;
  }
};

const populateFormFromFeedback = (feedback: Feedback) => {
  const form = feedbackForm.value;
  form.isMathChecked = feedback.mathScore === 100;
  form.isEnglishChecked = feedback.englishScore === 100;

  const getScoreString = (score: number | null | undefined) =>
    score !== null && score !== undefined && score !== 100 ? String(score) : '';

  form.mathScore = getScoreString(feedback.mathScore);
  form.englishScore = getScoreString(feedback.englishScore);
  previousScores.value.math = form.mathScore;
  previousScores.value.english = form.englishScore;
  form.mathTime = feedback.mathTime?.toString() || '';
  form.englishTime = feedback.englishTime?.toString() || '';
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

    if (props.item?.student?.id) {
      try {
        loading.value = true;
        if (props.item.feedback) {
          populateFormFromFeedback(props.item.feedback);
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
  () => feedbackForm.value.feedback,
  () => {
    if (isAIFormatting) {
      isAIFormatting = false;
      return;
    }
    feedbackFormatted.value = false;
  }
);

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
  <Modal
    size="lg"
    :open="show"
    :closable="true"
    :initial-focus="modalRef as any"
    @close="emit('update:show', false)"
  >
    <template #title>
      <div ref="modalRef" tabindex="-1" class="flex items-center gap-2 outline-none">
        <div
          class="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary-500 flex items-center justify-center"
        >
          <i class="fa-solid fa-chart-line text-white text-sm md:text-base"></i>
        </div>
        <div>
          <h3 class="text-base md:text-lg font-bold text-secondary-900">Student Feedback</h3>
          <p class="text-xs md:text-sm text-secondary-600">{{ selectedName }}</p>
        </div>
      </div>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="w-full flex justify-center items-center py-6 md:py-8">
      <Spinner size="lg" />
    </div>

    <div v-else class="space-y-3 md:space-y-4">
      <!-- Performance Card -->
      <div
        v-if="hasMaths || hasEnglish"
        class="bg-white rounded-lg md:rounded-xl border-2 border-secondary-200 p-3 md:p-4"
      >
        <h3
          class="text-xs md:text-sm font-bold text-secondary-900 mb-2 md:mb-3 uppercase tracking-wide"
        >
          Today's Performance
        </h3>

        <div class="space-y-3 md:space-y-4">
          <!-- Mathematics -->
          <div
            v-if="hasMaths"
            class="pb-3 md:pb-4"
            :class="{ 'border-b-2 border-secondary-200': hasEnglish }"
          >
            <div class="flex items-center gap-2 mb-2 md:mb-3">
              <div
                class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-500 flex items-center justify-center"
              >
                <i class="fa-solid fa-calculator text-white text-xs md:text-sm"></i>
              </div>
              <h4 class="text-sm md:text-base font-bold text-secondary-900">Mathematics</h4>
            </div>

            <div class="grid grid-cols-3 gap-2 md:gap-3">
              <div>
                <label
                  class="block text-[10px] md:text-xs font-semibold text-secondary-700 mb-1 md:mb-1.5"
                  >100%</label
                >
                <div
                  class="h-10 md:h-12 flex items-center justify-center bg-secondary-50 rounded-lg border-2 border-secondary-200"
                >
                  <Checkbox
                    v-model="feedbackForm.isMathChecked"
                    label=""
                    class="scale-110 md:scale-125"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-[10px] md:text-xs font-semibold text-secondary-700 mb-1 md:mb-1.5"
                  >Wrong</label
                >
                <input
                  type="text"
                  v-model="feedbackForm.mathScore"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="2"
                  placeholder="0"
                  tabindex="1"
                  :disabled="feedbackForm.isMathChecked"
                  @input="
                    onScoreInput(($event.target as HTMLInputElement).value, 'mathScore');
                    clearError('mathScore');
                  "
                  :class="[
                    'w-full h-10 md:h-12 px-2 md:px-3 text-base md:text-lg font-bold text-center rounded-lg border-2 focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all',
                    errors.mathScore ? 'border-danger-500 bg-danger-50' : 'border-secondary-300',
                    feedbackForm.isMathChecked
                      ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                      : 'bg-white'
                  ]"
                />
                <p
                  v-if="errors.mathScore"
                  class="text-[10px] md:text-xs text-danger-600 mt-0.5 md:mt-1 font-medium"
                >
                  {{ errors.mathScore }}
                </p>
              </div>

              <div>
                <label
                  class="block text-[10px] md:text-xs font-semibold text-secondary-700 mb-1 md:mb-1.5"
                  >Time</label
                >
                <input
                  type="text"
                  v-model="feedbackForm.mathTime"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="3"
                  placeholder="0"
                  tabindex="2"
                  @input="clearError('mathTime')"
                  :class="[
                    'w-full h-10 md:h-12 px-2 md:px-3 text-base md:text-lg font-bold text-center rounded-lg border-2 focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white',
                    errors.mathTime ? 'border-danger-500 bg-danger-50' : 'border-secondary-300'
                  ]"
                />
                <p
                  v-if="errors.mathTime"
                  class="text-[10px] md:text-xs text-danger-600 mt-0.5 md:mt-1 font-medium"
                >
                  {{ errors.mathTime }}
                </p>
              </div>
            </div>
          </div>

          <!-- English -->
          <div v-if="hasEnglish">
            <div class="flex items-center gap-2 mb-2 md:mb-3">
              <div
                class="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-500 flex items-center justify-center"
              >
                <i class="fa-solid fa-book-open text-white text-xs md:text-sm"></i>
              </div>
              <h4 class="text-sm md:text-base font-bold text-secondary-900">English</h4>
            </div>

            <div class="grid grid-cols-3 gap-2 md:gap-3">
              <div>
                <label
                  class="block text-[10px] md:text-xs font-semibold text-secondary-700 mb-1 md:mb-1.5"
                  >100%</label
                >
                <div
                  class="h-10 md:h-12 flex items-center justify-center bg-secondary-50 rounded-lg border-2 border-secondary-200"
                >
                  <Checkbox
                    v-model="feedbackForm.isEnglishChecked"
                    label=""
                    class="scale-110 md:scale-125"
                    :tabindex="hasMaths ? 3 : 1"
                  />
                </div>
              </div>

              <div>
                <label
                  class="block text-[10px] md:text-xs font-semibold text-secondary-700 mb-1 md:mb-1.5"
                  >Wrong</label
                >
                <input
                  type="text"
                  v-model="feedbackForm.englishScore"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="2"
                  placeholder="0"
                  :tabindex="hasMaths ? 4 : 2"
                  :disabled="feedbackForm.isEnglishChecked"
                  @input="
                    onScoreInput(($event.target as HTMLInputElement).value, 'englishScore');
                    clearError('englishScore');
                  "
                  :class="[
                    'w-full h-10 md:h-12 px-2 md:px-3 text-base md:text-lg font-bold text-center rounded-lg border-2 focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all',
                    errors.englishScore ? 'border-danger-500 bg-danger-50' : 'border-secondary-300',
                    feedbackForm.isEnglishChecked
                      ? 'bg-secondary-100 text-secondary-400 cursor-not-allowed'
                      : 'bg-white'
                  ]"
                />
                <p
                  v-if="errors.englishScore"
                  class="text-[10px] md:text-xs text-danger-600 mt-0.5 md:mt-1 font-medium"
                >
                  {{ errors.englishScore }}
                </p>
              </div>

              <div>
                <label
                  class="block text-[10px] md:text-xs font-semibold text-secondary-700 mb-1 md:mb-1.5"
                  >Time</label
                >
                <input
                  type="text"
                  v-model="feedbackForm.englishTime"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="3"
                  placeholder="0"
                  :tabindex="hasMaths ? 5 : 3"
                  @input="clearError('englishTime')"
                  :class="[
                    'w-full h-10 md:h-12 px-2 md:px-3 text-base md:text-lg font-bold text-center rounded-lg border-2 focus:ring-4 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white',
                    errors.englishTime ? 'border-danger-500 bg-danger-50' : 'border-secondary-300'
                  ]"
                />
                <p
                  v-if="errors.englishTime"
                  class="text-[10px] md:text-xs text-danger-600 mt-0.5 md:mt-1 font-medium"
                >
                  {{ errors.englishTime }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div
        class="bg-secondary-50 rounded-lg md:rounded-xl border-2 border-secondary-200 p-3 md:p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <i class="fa-solid fa-comment-dots text-secondary-600 text-sm md:text-base"></i>
          <label class="text-xs md:text-sm font-bold text-secondary-900">Notes (Optional)</label>
        </div>
        <Textarea
          v-model="feedbackForm.feedback"
          :rows="6"
          :disabled="formatting"
          placeholder="Enter any additional feedback..."
          :tabindex="hasMaths && hasEnglish ? 6 : hasMaths || hasEnglish ? 4 : 2"
          class="text-sm"
        />
        <div class="flex items-center justify-between mt-2">
          <Checkbox
            v-model="feedbackForm.isPercentFeedbackRequired"
            :tabindex="hasMaths && hasEnglish ? 7 : hasMaths || hasEnglish ? 5 : 3"
            label="Requires in-person follow-up"
            class="text-xs md:text-sm"
          />
          <Button
            v-if="feedbackForm.feedback.trim()"
            size="sm"
            :variant="feedbackFormatted ? 'outline' : 'primary'"
            :disabled="formatting || feedbackFormatted"
            @click="formatFeedbackText"
            class="text-xs! py-1! px-2! shrink-0"
          >
            <i v-if="formatting" class="fa-solid fa-spinner fa-spin mr-1"></i>
            <i v-else-if="feedbackFormatted" class="fa-solid fa-check mr-1"></i>
            <i v-else class="fa-solid fa-wand-magic-sparkles mr-1"></i>
            {{ formatting ? 'Formatting...' : feedbackFormatted ? 'Formatted' : 'Improve with AI' }}
          </Button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-2 w-full">
        <Button
          variant="outline"
          size="sm"
          @click="emit('update:show', false)"
          :disabled="loading"
          class="flex-1 md:px-4! md:py-2!"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          @click="submitFeedback"
          :disabled="loading || formatting"
          class="flex-1 md:px-4! md:py-2!"
        >
          <i v-if="!loading" class="fa-solid fa-check mr-1 md:mr-2"></i>
          {{ props.item?.feedback ? 'Update' : 'Submit' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
