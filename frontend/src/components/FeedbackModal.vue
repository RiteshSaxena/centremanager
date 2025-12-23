<script setup lang="ts">
import type { LogRecord } from '@/types';

import { computed, reactive, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useFeedbackStore } from '@/stores/feedback';
import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
// import SignaturePad from '@/components/SignaturePad.vue';
const feedbackStore = useFeedbackStore();
const props = withDefaults(
  defineProps<{
    show: boolean;
    item: LogRecord | null;
    // isQrMode?: boolean;
  }>(),
  {
    show: false,
    item: null,
    // isQrMode: false
  }
);

const emit = defineEmits(['update:show', 'onSuccess']);

const toast = useToast();
const logBookStore = useLogBookStore();

const qrMode = ref(false);
const loading = ref(false);
// const signaturePad = ref<typeof SignaturePad | null>(null);

watch(
  () => props.show,
  (val) => {
    if (val) {

      // signaturePad.value?.reset();
    }
  }
);
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
const originalFeedback = ref<any>(null);

const feedbackForm = reactive({
  mathScore: '',
  englishScore: '',
  mathTime: '',
  englishTime: '',
  feedback: ''
});

const resetForm = () => {
  feedbackForm.mathScore = '';
  feedbackForm.englishScore = '';
  feedbackForm.mathTime = '';
  feedbackForm.englishTime = '';
  feedbackForm.feedback = '';
  originalFeedback.value = null;
};

const hasChanges = () => {
  if (!originalFeedback.value) return true;

  return (
    Number(feedbackForm.mathScore) !== originalFeedback.value.mathScore ||
    Number(feedbackForm.englishScore) !== originalFeedback.value.englishScore ||
    feedbackForm.mathTime !== originalFeedback.value.mathTime ||
    feedbackForm.englishTime !== originalFeedback.value.englishTime ||
    feedbackForm.feedback !== originalFeedback.value.feedback
  );
};

const hasAtLeastOneValue = () => {
  console.log(feedbackForm,'6666666666666')
  return (
    feedbackForm.mathScore ||
    feedbackForm.englishScore ||
    feedbackForm.mathTime ||
    feedbackForm.englishTime ||
    feedbackForm.feedback.trim()
  );
};

const submitFeedback = async () => {
  console.log('pr',props.item?.student?.id, props.item)
  if (!props.item?.student?.id) return;

  // VALIDATION: no values entered
  if (!hasAtLeastOneValue()) {
    console.log('222222222222222')
    toast.error('Please enter at least one feedback value before submitting');
    return;
  }

  if (!hasChanges()) {
    toast.info('No changes detected');
    return;
  }

  try {
    loading.value = true;

    const payload = {
      mathScore: feedbackForm.mathScore
        ? Number(feedbackForm.mathScore.replace('%', ''))
        : null,
      englishScore: feedbackForm.englishScore
        ? Number(feedbackForm.englishScore.replace('%', ''))
        : null,
      mathTime: feedbackForm.mathTime
        ? Number(feedbackForm.mathTime)
        : null,
      englishTime: feedbackForm.englishTime
        ? Number(feedbackForm.englishTime)
        : null,
      isPercentFeedbackRequired: true,
      createdDate: new Date().toISOString().split('T')[0],
      child: props.item.student.id,
      feedback: feedbackForm.feedback
    };

    if (feedbackStore.todayFeedback) {
      // UPDATE
      await feedbackStore.updateFeedback(
        props.item.student.id,
        payload
      );
      toast.success('Feedback updated successfully');
    } else {
      // CREATE
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
      // RESET EVERYTHING FIRST
      resetForm();
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
            feedbackForm.mathScore = feedback.mathScore?.toString() || '';
            feedbackForm.englishScore = feedback.englishScore?.toString() || '';
            feedbackForm.mathTime = feedback.mathTime || '';
            feedbackForm.englishTime = feedback.englishTime || '';
            feedbackForm.feedback = feedback.feedback || '';

            originalFeedback.value = {
              mathScore: feedback.mathScore,
              englishScore: feedback.englishScore,
              mathTime: feedback.mathTime,
              englishTime: feedback.englishTime,
              feedback: feedback.feedback,
            };
          }
        } finally {
          loading.value = false; // STOP LOADER
        }
      }
    }
  }
);

</script>

<template>
  <Modal :large="false" v-if="show" :show-footer-close-button="!qrMode" :title="`Feedback  - ${selectedName}`"
    @close="emit('update:show', false)">
    <!--  LOADER -->
    <div class="text-center mb-3" v-if="loading">
      <div class="spinner-border text-dark text-center" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-if="!loading" class="w-100 text-center d-flex flex-column gap-2">
      <div class="row">
        <div class="col-4"></div>
        <div class="col-4"><strong>Score</strong></div>
        <div class="col-4"><strong>Time <small>(M)</small></strong></div>
      </div>
      <div class="row">
        <div class="col-4">
          <span>Maths</span>
        </div>
        <div class="col-4">
          <input type="text" name="score" v-model="feedbackForm.mathScore" inputmode="numeric" pattern="[0-9]*"
            maxlength="4" @input="onScoreInput" class="form-control">
        </div>
        <div class="col-4">
          <input type="text" name="time" v-model="feedbackForm.mathTime" inputmode="numeric" pattern="[0-9]*"
            maxlength="2" class="form-control">
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <span>Eng</span>
        </div>
        <div class="col-4">
          <input type="text" name="score" v-model="feedbackForm.englishScore" inputmode="numeric" pattern="[0-9]*"
            maxlength="4" @input="onScoreInput" class="form-control">
        </div>
        <div class="col-4">
          <input type="text" name="time" v-model="feedbackForm.englishTime" inputmode="numeric" pattern="[0-9]*"
            maxlength="2" class="form-control">
        </div>
      </div>
      <div class="row">
        <div class="col-12 align-items-start justify-content-start d-flex">
          <label>Feedback</label>
        </div>
        <div class="col-12">
          <textarea name="" v-model="feedbackForm.feedback" class="form-control" rows="5" id=""></textarea>
        </div>
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
