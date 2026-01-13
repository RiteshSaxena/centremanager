<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useFeedbackStore, useLogBookStore } from '@/stores';
import Modal from '@/components/base/Modal.vue';

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

    if (props.item.feedback) {
      await feedbackStore.updateFeedback(props.item.student.id, payload);
      toast.success('Feedback updated successfully');
    } else {
      await feedbackStore.createFeedback(payload);
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
    :large="false"
    v-if="show"
    :show-footer-close-button="true"
    @close="emit('update:show', false)"
  >
    <template #title>
      <div class="d-flex flex-column">
        <span>Feedback</span>
        <small>{{ selectedName }}</small>
      </div>
    </template>

    <div class="text-center mb-3" v-if="loading">
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-if="!loading" class="w-100 fs-5 d-flex flex-column gap-2">
      <div class="row gx-2">
        <div class="col-5"></div>
        <div class="col-3 text-left"><strong>Wrong</strong></div>
        <div class="col-4">
          <strong>Time <small>(M)</small></strong>
        </div>
      </div>

      <div class="row gx-2" v-if="hasMaths">
        <div class="col-5">
          <div class="d-flex gap-3 align-items-center w-100 justify-content-between">
            <span class="fs-6"><b>Maths</b></span>
            <label class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="feedbackForm.isMathChecked"
              />
              <span class="form-check-label fs-6">100%</span>
            </label>
          </div>
        </div>
        <div class="col-3 text-start">
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
            class="form-control max-width-50"
            :class="{ 'is-invalid': errors.mathScore }"
          />
          <div v-if="errors.mathScore" class="invalid-feedback">{{ errors.mathScore }}</div>
        </div>
        <div class="col-4">
          <input
            type="text"
            v-model="feedbackForm.mathTime"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            class="form-control"
            @input="clearError('mathTime')"
            :class="{ 'is-invalid': errors.mathTime }"
          />
          <div v-if="errors.mathTime" class="invalid-feedback">{{ errors.mathTime }}</div>
        </div>
      </div>

      <div class="row gx-2" v-if="hasEnglish">
        <div class="col-5">
          <div class="d-flex gap-3 align-items-center w-100 justify-content-between">
            <span class="fs-6"><b>Eng</b></span>
            <label class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                v-model="feedbackForm.isEnglishChecked"
              />
              <span class="form-check-label fs-6">100%</span>
            </label>
          </div>
        </div>
        <div class="col-3 text-start">
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
            class="form-control"
            :class="{ 'is-invalid': errors.englishScore }"
          />
          <div v-if="errors.englishScore" class="invalid-feedback">{{ errors.englishScore }}</div>
        </div>
        <div class="col-4">
          <input
            type="text"
            v-model="feedbackForm.englishTime"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="2"
            class="form-control"
            @input="clearError('englishTime')"
            :class="{ 'is-invalid': errors.englishTime }"
          />
          <div v-if="errors.englishTime" class="invalid-feedback">{{ errors.englishTime }}</div>
        </div>
      </div>

      <div class="row">
        <div class="col-12 align-items-start justify-content-start d-flex">
          <label><b>Feedback</b></label>
        </div>
        <div class="col-12">
          <textarea v-model="feedbackForm.feedback" class="form-control" rows="7"></textarea>
        </div>
        <label for="inperson" class="text-start mt-2">
          <input
            type="checkbox"
            v-model="feedbackForm.isPercentFeedbackRequired"
            name="inperson"
            id="inperson"
          />
          In person feedback required.
        </label>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-info" :disabled="loading" @click="submitFeedback">
        {{ props.item?.feedback ? 'Update' : 'Submit' }}
      </button>
    </template>
  </Modal>
</template>

<style scoped>
.is-invalid {
  border-color: #dc3545 !important;
  background-image: none !important;
}
</style>
