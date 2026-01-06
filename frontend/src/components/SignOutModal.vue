<script setup lang="ts">
import type { LogRecord } from '@/types';

import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
import SignaturePad from '@/components/SignaturePad.vue';
import { useFeedbackStore } from '@/stores/feedback';

const feedbackStore = useFeedbackStore();
const props = withDefaults(
  defineProps<{
    show: boolean;
    item: LogRecord | null;
    isQrMode?: boolean;
  }>(),
  {
    show: false,
    item: null,
    isQrMode: false
  }
);

const emit = defineEmits(['update:show', 'onSuccess']);
const toast = useToast();
const logBookStore = useLogBookStore();
const qrMode = ref(false);
const loading = ref(false);
const signaturePad = ref<typeof SignaturePad | null>(null);
const feedbackData = ref<{
  mathScore: number | null;
  englishScore: number | null;
  mathTime: number | null;
  englishTime: number | null;
  feedback: string;
} | null>(null);

watch(
  () => props.show,
  async (val) => {
    if (!val) return;
    qrMode.value = props.isQrMode && !!props.item?.signatureId;
    if (qrMode.value) {
      setTimeout(() => {
        onSubmit();
      }, 500);
    }
    signaturePad.value?.reset();
    feedbackData.value = null;
    // FETCH FEEDBACK DATA
    if (props.item?.student?.id) {
      try {
        loading.value = true;
        const feedback = await feedbackStore.fetchTodayFeedbackByChild(props.item.student.id);

        if (feedback) {
          feedbackData.value = {
            mathScore: feedback.mathScore,
            englishScore: feedback.englishScore,
            mathTime: feedback.mathTime !== null ? Number(feedback.mathTime) : null,
            englishTime: feedback.englishTime !== null ? Number(feedback.englishTime) : null,
            feedback: feedback.feedback || ''
          };
        }
      } finally {
        loading.value = false;
      }
    }
  }
);

const onSubmit = async () => {
  if (!props.item) {
    toast.error('User not found');
    return;
  }

  if (!qrMode.value) {
    if (!signaturePad.value || signaturePad.value.isEmpty()) {
      toast.error('Please sign to continue');
      return;
    }
  }

  try {
    loading.value = true;
    const payload: any = {
      signIn: props.item?.id
    };

    if (qrMode.value) {
      payload.signatureId = props.item?.signatureId;
    } else {
      payload.signature = signaturePad.value?.getImage();
    }

    await logBookStore.signOut(payload);

    emit('onSuccess');
    emit('update:show', false);
    const audio = new Audio('../assets/sign-out.wav');
    await audio.play();
    toast.success(`Successfully signed out - ${selectedName.value}`);
    logBookStore.fetchList().then();
  } finally {
    loading.value = false;
  }
};

const getScoreClass = (score: number | null | undefined) => {
  if (score === null || score === undefined) return 'text-muted';
  return score === 100 ? 'text-success' : 'text-warning';
};

const getScoreText = (score: number | null | undefined) => {
  if (score === null || score === undefined) return '--';
  if (score === 100) {
    return '100%';
  }
  return `-${score}`;
};

const getTimeClass = (time: number | null | undefined) => {
  if (time === null || time === undefined) return 'text-muted';
  return time <= 20 ? 'text-success' : 'text-warning';
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
</script>

<template>
  <Modal
    :large="true"
    v-if="show"
    :show-footer-close-button="!qrMode"
    :title="`Sign Out - ${selectedName}`"
    @close="emit('update:show', false)"
  >
    <!--LOADER -->
    <div v-if="loading" class="w-100 d-flex justify-content-center align-items-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <template v-else>
      <div class="w-100 fs-4 text-start d-flex flex-column gap-2">
        <div class="row">
          <div class="col-4"></div>
          <div class="col-4"><strong>Score</strong></div>
          <div class="col-4">
            <strong>Time <small>(M)</small></strong>
          </div>
        </div>
        <div class="row">
          <div class="col-4">
            <span><b>Maths</b></span>
          </div>
          <div class="col-4">
            <span :class="getScoreClass(feedbackData?.mathScore)">
              <b>{{ getScoreText(feedbackData?.mathScore) }}</b>
            </span>
          </div>
          <div class="col-4">
            <span :class="getTimeClass(feedbackData?.mathTime)">
              {{ feedbackData?.mathTime ?? '--' }}
            </span>
          </div>
        </div>
        <div class="row">
          <div class="col-4">
            <span><b>Eng</b></span>
          </div>
          <div class="col-4">
            <span :class="getScoreClass(feedbackData?.englishScore)">
              <b>{{ getScoreText(feedbackData?.englishScore) }}</b>
            </span>
          </div>
          <div class="col-4">
            <span :class="getTimeClass(feedbackData?.englishTime)">
              {{ feedbackData?.englishTime ?? '--' }}
            </span>
          </div>
        </div>
        <div class="row">
          <div class="col-12 mt-4 align-items-start justify-content-start d-flex">
            <label><b>Feedback</b></label>
          </div>
          <div class="col-12">
            <p v-if="feedbackData?.feedback">
              {{ feedbackData.feedback }}
            </p>
            <p v-else class="text-muted">No feedback available</p>
          </div>
        </div>
      </div>
      <div v-if="!qrMode">
        <label class="mb-2 fs-5"><b>Sign Below</b></label>
        <signature-pad ref="signaturePad" />
      </div>
      <div v-else class="w-100 text-center my-5">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </template>
    <template #footer>
      <button
        v-if="!qrMode"
        type="button"
        class="btn btn-info"
        @click.prevent="onSubmit"
        :disabled="loading"
      >
        {{ loading ? '...' : 'Submit' }}
      </button>
    </template>
  </Modal>
</template>
