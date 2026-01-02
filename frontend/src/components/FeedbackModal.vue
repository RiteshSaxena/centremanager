<script setup lang="ts">
import type { LogRecord } from '@/types';
import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useFeedbackStore } from '@/stores/feedback';
import Modal from '@/components/base/Modal.vue';

const feedbackStore = useFeedbackStore();
const props = withDefaults(
  defineProps<{
    show: boolean;
    item: LogRecord | null;
  }>(),
  {
    show: false,
    item: null,
  }
);

const emit = defineEmits(['update:show', 'onSuccess']);
const toast = useToast();
const errors = ref({
  mathScore: '',
  englishScore: '',
  mathTime: '',
  englishTime: '',
});
const qrMode = ref(false);
const loading = ref(false);
const originalFeedback = ref<any>(null);
const previousMathScore = ref<string>('');
const previousEnglishScore = ref<string>('');

const feedbackForm = ref({
  mathScore: '',
  englishScore: '',
  mathTime: '',
  englishTime: '',
  feedback: '',
  isPercentFeedbackRequired: false,
  isEnglishChecked: false,
  isMathChecked: false
});

const resetForm = () => {
  feedbackForm.value.mathScore = '';
  feedbackForm.value.englishScore = '';
  feedbackForm.value.mathTime = '';
  feedbackForm.value.englishTime = '';
  feedbackForm.value.feedback = '';
  feedbackForm.value.isPercentFeedbackRequired = false;
  originalFeedback.value = null;
  feedbackForm.value.isMathChecked = false;
  feedbackForm.value.isEnglishChecked = false;
};

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = '';
};

const resetErrors = () => {
  errors.value = {
    mathScore: '',
    englishScore: '',
    mathTime: '',
    englishTime: '',
  };
};

const validateForm = () => {
  let isValid = true;
  if (!feedbackForm.value.mathScore) {
    errors.value.mathScore = 'Math score is required.';
    isValid = false;
  }
  if (!feedbackForm.value.englishScore) {
    errors.value.englishScore = 'English score is required.';
    isValid = false;
  }
  if (!feedbackForm.value.mathTime) {
    errors.value.mathTime = 'Math time is required.';
    isValid = false;
  }
  if (!feedbackForm.value.englishTime) {
    errors.value.englishTime = 'English time is required.';
    isValid = false;
  }
  return isValid;
};

const hasChanges = () => {
  if (!originalFeedback.value) return true;
  return (
    Number(feedbackForm.value.mathScore) !== originalFeedback.value.mathScore ||
    Number(feedbackForm.value.englishScore) !== originalFeedback.value.englishScore ||
    feedbackForm.value.mathTime !== originalFeedback.value.mathTime ||
    feedbackForm.value.englishTime !== originalFeedback.value.englishTime ||
    feedbackForm.value.feedback !== originalFeedback.value.feedback ||
    feedbackForm.value.isPercentFeedbackRequired !==
    originalFeedback.value.isPercentFeedbackRequired
  );
};

function onScoreInput(value: string, field: 'mathScore' | 'englishScore') {
  let v = value.replace(/\D/g, '');
  if (v === '') {
    feedbackForm.value[field] = '';
    return;
  }
  let num = parseInt(v, 10);
  // Allow only 0–99
  if (num > 99) num = 99;
  feedbackForm.value[field] = String(num);
}


const submitFeedback = async () => {
  if (!props.item?.student?.id) return;
  // VALIDATION: no values entered
  // if (!validateForm()) {
  //   return;
  // }
  if (!hasChanges()) {
    toast.info('No changes detected');
    return;
  }
  try {
    loading.value = true;
    const payload = {
      mathScore: feedbackForm.value.isMathChecked ? 100 : feedbackForm.value.mathScore ? Number(feedbackForm.value.mathScore) : null,
      englishScore: feedbackForm.value.isEnglishChecked ? 100 : feedbackForm.value.englishScore ? Number(feedbackForm.value.englishScore) : null,
      mathTime: feedbackForm.value.mathTime ? Number(feedbackForm.value.mathTime) : null,
      englishTime: feedbackForm.value.englishTime ? Number(feedbackForm.value.englishTime) : null,
      isPercentFeedbackRequired: feedbackForm.value.isPercentFeedbackRequired,
      createdDate: new Date().toISOString().split('T')[0],
      child: props.item.student.id,
      feedback: feedbackForm.value.feedback
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

const selectedName = computed(() => {
  if (props.item) {
    if (
      props.item.type === 'Student' ||
      props.item.type === 'StudentWithParent' ||
      props.item.type === 'Parent'
    ) {
      if (props.item.student) {
        return `${props.item.student.firstName} ${props.item.student.lastName} (${props.item.parent?.firstName} ${props.item.parent?.lastName})`;
      }
      return `${props.item.parent?.firstName} ${props.item.parent?.lastName}`;
    } else if (props.item?.type === 'Staff') {
      return `${props.item.staff?.firstName} ${props.item.staff?.lastName}`;
    } else if (props.item?.type === 'Guest') {
      return `${props.item.guest?.firstName} ${props.item.guest?.lastName}`;
    }
  }

  return '';
});
watch(
  () => props.show,
  async (val) => {
    if (val) {
      resetForm();
      resetErrors();
      feedbackStore.resetTodayFeedback();
      // THEN fetch fresh data
      if (props.item?.student?.id) {
        try {
          loading.value = true;
          const feedback =
            await feedbackStore.fetchTodayFeedbackByChild(
              props.item.student.id
            );
          if (feedback) {
            feedbackForm.value.isMathChecked = feedback.mathScore === 100;
            feedbackForm.value.isEnglishChecked = feedback.englishScore === 100;
            // only bind input if NOT 100
            feedbackForm.value.mathScore = feedback.mathScore !== null && feedback.mathScore !== undefined && feedback.mathScore !== 100 ? String(feedback.mathScore) : '';
            feedbackForm.value.englishScore = feedback.englishScore !== null && feedback.englishScore !== undefined && feedback.englishScore !== 100 ? String(feedback.englishScore) : '';
            previousMathScore.value = feedback.mathScore !== 100 ? String(feedback.mathScore ?? '') : '';
            previousEnglishScore.value = feedback.englishScore !== 100 ? String(feedback.englishScore ?? '') : '';
            feedbackForm.value.mathTime = feedback.mathTime || '';
            feedbackForm.value.englishTime = feedback.englishTime || '';
            feedbackForm.value.feedback = feedback.feedback || '';
            feedbackForm.value.isPercentFeedbackRequired =
              feedback.isPercentFeedbackRequired ?? false;
            originalFeedback.value = {
              mathScore: feedback.mathScore,
              englishScore: feedback.englishScore,
              mathTime: feedback.mathTime,
              englishTime: feedback.englishTime,
              feedback: feedback.feedback,
              isPercentFeedbackRequired: feedback.isPercentFeedbackRequired ?? false,
            };
          }
        } finally {
          loading.value = false;
        }
      }
    } else {
      resetErrors()
    }
  }
);

watch(
  () => feedbackForm.value.isMathChecked,
  (checked) => {
    if (checked) {
      // save current value before clearing
      previousMathScore.value = feedbackForm.value.mathScore;
      feedbackForm.value.mathScore = '';
      errors.value.mathScore = '';
    } else {
      // restore previous value when unchecked
      feedbackForm.value.mathScore = previousMathScore.value;
    }
  }
);

watch(
  () => feedbackForm.value.isEnglishChecked,
  (checked) => {
    if (checked) {
      // save current value before clearing
      previousEnglishScore.value = feedbackForm.value.englishScore;
      feedbackForm.value.englishScore = '';
      errors.value.englishScore = '';
    } else {
      // restore previous value when unchecked
      feedbackForm.value.englishScore = previousEnglishScore.value;
    }
  }
);


</script>

<template>
  <!-- <Modal :large="false" v-if="show" :show-footer-close-button="!qrMode" :title="Feedback - ${selectedName}"
    @close="emit('update:show', false)"> -->
  <Modal :large="false" v-if="show" :show-footer-close-button="!qrMode" @close="emit('update:show', false)">
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
        <div class="col-4"><strong>Time <small>(M)</small></strong></div>
      </div>
      <div class="row gx-2">
        <div class="col-5">
          <div class="d-flex gap-3 align-items-center w-100 justify-content-between">
            <span class="fs-6"><b>Maths</b></span>
            <label class="form-check">
              <input type="checkbox" class="form-check-input" v-model="feedbackForm.isMathChecked" />
              <span class="form-check-label fs-6">100%</span>
            </label>
          </div>
        </div>
        <div class="col-3 text-start">
          
            <input type="text" name="score" v-model="feedbackForm.mathScore" inputmode="numeric" pattern="[0-9]*"
              maxlength="2" :disabled="feedbackForm.isMathChecked"
              @input="onScoreInput(($event.target as HTMLInputElement).value, 'mathScore'); clearError('mathScore')"
              class="form-control max-width-50" :class="{ 'is-invalid': errors.mathScore }">
            <div v-if="errors.mathScore" class="invalid-feedback">
              {{ errors.mathScore }}
            </div>

        </div>

        <div class="col-4">
          <input type="text" name="time" v-model="feedbackForm.mathTime" inputmode="numeric" pattern="[0-9]*"
            maxlength="2" class="form-control" @input="clearError('mathTime')"
            :class="{ 'is-invalid': errors.mathTime }">
          <div v-if="errors.mathTime" class="invalid-feedback">
            {{ errors.mathTime }}
          </div>
        </div>
      </div>
      <div class="row gx-2">
        <div class="col-5">
          <div class="d-flex gap-3 align-items-center w-100 justify-content-between">
            <span class="fs-6"><b>Eng</b></span>
            <label class="form-check">
              <input type="checkbox" class="form-check-input" v-model="feedbackForm.isEnglishChecked" />
              <span class="form-check-label fs-6">100%</span>
            </label>
          </div>
        </div>
        <div class="col-3 text-start">
            <input type="text" name="score" v-model="feedbackForm.englishScore" inputmode="numeric" pattern="[0-9]*"
              maxlength="2" :disabled="feedbackForm.isEnglishChecked"
              @input="onScoreInput(($event.target as HTMLInputElement).value, 'englishScore'); clearError('englishScore')"
              class="form-control" :class="{ 'is-invalid': errors.englishScore }">
            <div v-if="errors.englishScore" class="invalid-feedback">
              {{ errors.englishScore }}
            </div>
        </div>

        <div class="col-4">
          <input type="text" name="time" v-model="feedbackForm.englishTime" inputmode="numeric" pattern="[0-9]*"
            maxlength="2" class="form-control" @input="clearError('englishTime')"
            :class="{ 'is-invalid': errors.englishTime }">
          <div v-if="errors.englishTime" class="invalid-feedback">
            {{ errors.englishTime }}
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12 align-items-start justify-content-start d-flex">
          <label><b>Feedback</b></label>
        </div>
        <div class="col-12">
          <textarea name="" v-model="feedbackForm.feedback" class="form-control" rows="7" id=""></textarea>
        </div>
        <label for="inperson" class="text-start mt-2">
          <input type="checkbox" v-model="feedbackForm.isPercentFeedbackRequired" name="inperson" id="inperson">
          In person feedback required.
        </label>
      </div>
    </div>

    <template #footer>
      <button v-if="!qrMode" type="button" class="btn btn-info" :disabled="loading" @click="submitFeedback">
        <!-- {{ loading ? '...' : 'Submit' }} -->
        {{ feedbackStore.todayFeedback ? 'Update' : 'Submit' }}
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