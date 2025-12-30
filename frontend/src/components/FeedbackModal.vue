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
const feedbackForm = ref({
  mathScore: '',
  englishScore: '',
  mathTime: '',
  englishTime: '',
  feedback: '',
  isPercentFeedbackRequired: false
});

function onScoreInput(e: Event) {
  const input = e.target as HTMLInputElement;
  let v = input.value;
  if (v === "-") {
    return;
  }
  v = v.replace(/[^0-9\-.%]/g, '');
  v = v.replace(/(?!^)-/g, '');
  const hasPercent = v.endsWith('%');
  v = v.replace('%', '');
  let num = Number(v);
  if (isNaN(num)) {
    input.value = "";
    return;
  }
  if (num > 100) num = 100;
  if (num < 0) {
    input.value = num.toString();
    return;
  }
  input.value = num.toString() + "%";
}

const resetForm = () => {
  feedbackForm.value.mathScore = '';
  feedbackForm.value.englishScore = '';
  feedbackForm.value.mathTime = '';
  feedbackForm.value.englishTime = '';
  feedbackForm.value.feedback = '';
  feedbackForm.value.isPercentFeedbackRequired = false;
  originalFeedback.value = null;
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

const submitFeedback = async () => {
  if (!props.item?.student?.id) return;
  // VALIDATION: no values entered
  if (!validateForm()) {
    return;
  }
  if (!hasChanges()) {
    toast.info('No changes detected');
    return;
  }
  try {
    loading.value = true;
    const payload = {
      mathScore: feedbackForm.value.mathScore
        ? Number(feedbackForm.value.mathScore.replace('%', ''))
        : null,
      englishScore: feedbackForm.value.englishScore
        ? Number(feedbackForm.value.englishScore.replace('%', ''))
        : null,
      mathTime: feedbackForm.value.mathTime
        ? Number(feedbackForm.value.mathTime)
        : null,
      englishTime: feedbackForm.value.englishTime
        ? Number(feedbackForm.value.englishTime)
        : null,
      isPercentFeedbackRequired: feedbackForm.value.isPercentFeedbackRequired,
      createdDate: new Date().toISOString().split('T')[0],
      child: props.item.student.id,
      feedback: feedbackForm.value.feedback
    };
    if (feedbackStore.todayFeedback) {
      await feedbackStore.updateFeedback(
        props.item.student.id,
        payload
      );
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
            feedbackForm.value.mathScore = feedback.mathScore?.toString() || '';
            feedbackForm.value.englishScore = feedback.englishScore?.toString() || '';
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
</script>

<template>
  <Modal :large="false" v-if="show" :show-footer-close-button="!qrMode" :title="`Feedback  - ${selectedName}`"
    @close="emit('update:show', false)">
    <div class="text-center mb-3" v-if="loading">
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-if="!loading" class="w-100 fs-5 text-center d-flex flex-column gap-2">
      <div class="row">
        <div class="col-4"></div>
        <div class="col-4"><strong>Score</strong></div>
        <div class="col-4"><strong>Time <small>(M)</small></strong></div>
      </div>
      <div class="row">
        <div class="col-4">
          <span><b>Maths</b></span>
        </div>
        <div class="col-4">
          <input type="text" name="score" v-model="feedbackForm.mathScore" inputmode="numeric" pattern="[0-9]*"
            maxlength="4" @input="onScoreInput($event); clearError('mathScore')" class="form-control"
            :class="{ 'is-invalid': errors.mathScore }">
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
      <div class="row">
        <div class="col-4">
          <span><b>Eng</b></span>
        </div>
        <div class="col-4">
          <input type="text" name="score" v-model="feedbackForm.englishScore" inputmode="numeric" pattern="[0-9]*"
            maxlength="4" @input="onScoreInput($event), clearError('englishScore')" class="form-control"
            :class="{ 'is-invalid': errors.englishScore }">
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