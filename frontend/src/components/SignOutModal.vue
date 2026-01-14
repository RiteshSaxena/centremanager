<script setup lang="ts">
import type { LogRecord } from '@/types';

import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import SignaturePad from '@/components/SignaturePad.vue';
import { Modal, Button, Spinner } from '@/components/ui';
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
const step = ref(1);
const signaturePad = ref<typeof SignaturePad | null>(null);
const feedbackData = ref<{
  mathScore: number | null;
  englishScore: number | null;
  mathTime: number | null;
  englishTime: number | null;
  feedback: string;
  createdByName?: string;
} | null>(null);

const shouldShowFeedback = computed(() => {
  if (
    !(props.item?.type === 'Student' || props.item?.type === 'StudentWithParent') ||
    feedbackData.value === null
  ) {
    return false;
  }

  // Check if at least one of the 5 feedback fields has data
  const hasData =
    feedbackData.value.mathScore !== null ||
    feedbackData.value.englishScore !== null ||
    feedbackData.value.mathTime !== null ||
    feedbackData.value.englishTime !== null ||
    (feedbackData.value.feedback && feedbackData.value.feedback.trim().length > 0);

  return hasData;
});

watch(
  () => props.show,
  async (val) => {
    if (!val) return;
    qrMode.value = props.isQrMode && !!props.item?.signatureId;
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
            feedback: feedback.feedback || '',
            createdByName: feedback?.createdByUser
              ? `${feedback?.createdByUser?.firstName} ${feedback.createdByUser?.lastName}`
              : ''
          };

          // Check if at least one of the 5 feedback fields has actual data
          const hasData =
            feedback.mathScore !== null ||
            feedback.englishScore !== null ||
            feedback.mathTime !== null ||
            feedback.englishTime !== null ||
            (feedback.feedback && feedback.feedback.trim().length > 0);

          // If has meaningful feedback data, start at step 1, otherwise go directly to step 2
          step.value = hasData ? 1 : 2;

          // In QR mode without feedback, submit immediately
          if (qrMode.value && !hasData) {
            setTimeout(() => {
              onSubmit();
            }, 500);
          }
        } else {
          // No feedback, go directly to signature step
          step.value = 2;
          // In QR mode, submit immediately
          if (qrMode.value) {
            setTimeout(() => {
              onSubmit();
            }, 500);
          }
        }
      } finally {
        loading.value = false;
      }
    } else {
      // Not a student, go directly to signature step
      step.value = 2;
      // In QR mode, submit immediately
      if (qrMode.value) {
        setTimeout(() => {
          onSubmit();
        }, 500);
      }
    }
  }
);

const nextStep = () => {
  // In QR mode with feedback, clicking Next submits directly
  if (qrMode.value && shouldShowFeedback.value) {
    onSubmit();
  } else {
    step.value = 2;
  }
};

const clearSignature = () => {
  signaturePad.value?.reset();
};

const closeModal = () => {
  step.value = 1;
  emit('update:show', false);
};

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
  if (score === null || score === undefined) return 'text-secondary-400';
  return score === 100 ? 'text-success-500' : 'text-warning-500';
};

const getScoreText = (score: number | null | undefined) => {
  if (score === null || score === undefined) return '--';
  if (score === 100) {
    return '100%';
  }
  return `-${score}`;
};

const getTimeClass = (time: number | null | undefined) => {
  if (time === null || time === undefined) return 'text-secondary-400';
  return time <= 20 ? 'text-success-500' : 'text-warning-500';
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

const modalTitle = computed(() => {
  if (step.value === 1 && shouldShowFeedback.value) {
    return 'Review Performance';
  }
  if (qrMode.value) {
    return 'Sign Out';
  }
  return 'Sign Below to Confirm';
});
</script>

<template>
  <Modal size="xl" :open="show" :closable="!qrMode" :title="modalTitle" @close="closeModal">
    <!--LOADER -->
    <div v-if="loading" class="w-full flex justify-center items-center py-8 md:py-12">
      <Spinner size="lg" />
    </div>
    <template v-else>
      <!-- Person Info Card (Always shown) -->
      <div
        class="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl md:rounded-2xl p-3 md:p-6 mb-4 md:mb-6 border border-primary-200"
      >
        <div class="flex items-center gap-2 md:gap-4">
          <div
            class="w-10 h-10 md:w-16 md:h-16 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0"
          >
            <i class="fa-solid fa-user text-white text-base md:text-2xl"></i>
          </div>
          <div>
            <p class="text-xs md:text-base text-primary-600 font-medium mb-0.5 md:mb-1">Signing Out</p>
            <p class="text-sm md:text-2xl font-bold text-primary-900">{{ selectedName }}</p>
          </div>
        </div>
      </div>

      <!-- Step 1: Performance Review -->
      <div v-if="step === 1 && shouldShowFeedback">
        <h3 class="text-sm md:text-base font-semibold text-secondary-700 uppercase tracking-wide mb-3 md:mb-4">
          Today's Performance
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5 mb-4 md:mb-5">
          <!-- Math Card -->
          <div class="bg-white rounded-xl md:rounded-2xl border-2 border-secondary-200 p-3 md:p-6 shadow-sm">
            <div class="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
              <div
                class="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0"
              >
                <i class="fa-solid fa-calculator text-blue-600 text-sm md:text-xl"></i>
              </div>
              <h4 class="text-base md:text-xl font-bold text-secondary-900">Mathematics</h4>
            </div>
            <div class="space-y-2 md:space-y-4">
              <div class="flex justify-between items-center py-1.5 md:py-2 border-b border-secondary-100">
                <span class="text-sm md:text-base text-secondary-600 font-medium">Score:</span>
                <span :class="['text-xl md:text-3xl font-bold', getScoreClass(feedbackData?.mathScore)]">
                  {{ getScoreText(feedbackData?.mathScore) }}
                </span>
              </div>
              <div class="flex justify-between items-center py-1.5 md:py-2">
                <span class="text-sm md:text-base text-secondary-600 font-medium">Time:</span>
                <span :class="['text-lg md:text-2xl font-semibold', getTimeClass(feedbackData?.mathTime)]">
                  {{ feedbackData?.mathTime ? `${feedbackData.mathTime} min` : '--' }}
                </span>
              </div>
            </div>
          </div>

          <!-- English Card -->
          <div class="bg-white rounded-xl md:rounded-2xl border-2 border-secondary-200 p-3 md:p-6 shadow-sm">
            <div class="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
              <div
                class="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0"
              >
                <i class="fa-solid fa-book-open text-purple-600 text-sm md:text-xl"></i>
              </div>
              <h4 class="text-base md:text-xl font-bold text-secondary-900">English</h4>
            </div>
            <div class="space-y-2 md:space-y-4">
              <div class="flex justify-between items-center py-1.5 md:py-2 border-b border-secondary-100">
                <span class="text-sm md:text-base text-secondary-600 font-medium">Score:</span>
                <span :class="['text-xl md:text-3xl font-bold', getScoreClass(feedbackData?.englishScore)]">
                  {{ getScoreText(feedbackData?.englishScore) }}
                </span>
              </div>
              <div class="flex justify-between items-center py-1.5 md:py-2">
                <span class="text-sm md:text-base text-secondary-600 font-medium">Time:</span>
                <span :class="['text-lg md:text-2xl font-semibold', getTimeClass(feedbackData?.englishTime)]">
                  {{ feedbackData?.englishTime ? `${feedbackData.englishTime} min` : '--' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Feedback Section -->
        <div class="bg-secondary-50 rounded-xl md:rounded-2xl border-2 border-secondary-200 p-3 md:p-6">
          <div class="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
            <i class="fa-solid fa-comment-dots text-secondary-500 text-base md:text-xl mt-0.5 md:mt-1 flex-shrink-0"></i>
            <div class="flex-1">
              <h4 class="font-bold text-secondary-900 text-sm md:text-lg mb-1.5 md:mb-2">
                Instructor Feedback
                <span
                  v-if="feedbackData?.createdByName"
                  class="font-normal text-secondary-600 text-xs md:text-sm ml-1 md:ml-2"
                >
                  by {{ feedbackData.createdByName }}
                </span>
              </h4>
              <p v-if="feedbackData?.feedback" class="text-sm md:text-base text-secondary-700 leading-relaxed">
                {{ feedbackData.feedback }}
              </p>
              <p v-else class="text-sm md:text-base text-secondary-400 italic">
                No feedback provided for today
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Signature Section -->
      <div
        v-if="!qrMode && step === 2"
        class="bg-white rounded-xl md:rounded-2xl border-2 border-secondary-200 p-3 md:p-6"
      >
        <div class="flex items-center justify-between mb-3 md:mb-4">
          <div class="flex items-center gap-2 md:gap-3">
            <i class="fa-solid fa-signature text-primary-600 text-base md:text-2xl flex-shrink-0"></i>
            <label class="text-base md:text-xl font-bold text-secondary-900">Signature Required</label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            @click.prevent="clearSignature"
            :disabled="loading"
            class="text-secondary-500 hover:text-secondary-700"
          >
            <i class="fa-solid fa-eraser mr-1 text-xs md:text-sm"></i>
            <span class="text-xs md:text-sm">Clear</span>
          </Button>
        </div>
        <p class="text-sm md:text-base text-secondary-600 mb-3 md:mb-4">Please sign below to confirm sign out</p>
        <signature-pad ref="signaturePad" />
      </div>

      <!-- QR Mode Processing (only when no feedback to show) -->
      <div v-if="qrMode && !shouldShowFeedback" class="w-full text-center py-8 md:py-12">
        <Spinner size="lg" />
        <p class="text-sm md:text-base text-secondary-600 mt-3 md:mt-4">Processing sign out...</p>
      </div>
    </template>

    <template #footer>
      <!-- Step 1 Footer (Review) -->
      <div v-if="step === 1 && shouldShowFeedback" class="flex gap-2 md:gap-4 w-full">
        <Button
          v-if="!qrMode"
          variant="outline"
          size="md"
          @click="closeModal"
          :disabled="loading"
          class="flex-1 text-sm md:text-base"
        >
          Cancel
        </Button>
        <Button
          size="md"
          @click.prevent="nextStep"
          :disabled="loading"
          :class="qrMode ? 'w-full' : 'flex-1'"
          class="text-sm md:text-base"
        >
          {{ qrMode ? 'Next - Confirm Sign Out' : 'Next - Add Signature' }}
          <i class="fa-solid fa-arrow-right ml-1 md:ml-2 text-sm md:text-base"></i>
        </Button>
      </div>

      <!-- Step 2 Footer (Signature) -->
      <div v-if="!qrMode && step === 2" class="flex gap-2 md:gap-3 w-full">
        <Button
          v-if="shouldShowFeedback"
          variant="outline"
          size="md"
          @click="step = 1"
          :disabled="loading"
          class="flex-1 text-sm md:text-base"
        >
          <i class="fa-solid fa-arrow-left mr-1 md:mr-2 text-sm md:text-base"></i>
          Back
        </Button>
        <Button
          v-else
          variant="outline"
          size="md"
          @click="closeModal"
          :disabled="loading"
          class="flex-1 text-sm md:text-base"
        >
          Cancel
        </Button>
        <Button size="md" @click.prevent="onSubmit" :disabled="loading" class="flex-1 text-sm md:text-base">
          <i v-if="!loading" class="fa-solid fa-check mr-1 md:mr-2 text-sm md:text-base"></i>
          {{ loading ? 'Processing...' : 'Confirm' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
