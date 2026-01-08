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
const signaturePad = ref<typeof SignaturePad | null>(null);
const feedbackData = ref<{
  mathScore: number | null;
  englishScore: number | null;
  mathTime: number | null;
  englishTime: number | null;
  feedback: string;
  createdByName?: string;
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
            feedback: feedback.feedback || '',
            createdByName: feedback?.createdByUser
      ? `${feedback?.createdByUser?.firstName} ${feedback.createdByUser?.lastName}`
      : ''
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
</script>

<template>
  <Modal
    size="xl"
    :open="show"
    :closable="!qrMode"
    :title="`Sign Out - ${selectedName}`"
    @close="emit('update:show', false)"
  >
    <!--LOADER -->
    <div v-if="loading" class="w-full flex justify-center items-center py-12">
      <Spinner size="lg" />
    </div>
    <template v-else>
      <div class="w-full text-lg text-left flex flex-col gap-2">
        <div class="grid grid-cols-3 gap-2">
          <div></div>
          <div><strong>Score</strong></div>
          <div>
            <strong>Time <small>(M)</small></strong>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <span><b>Maths</b></span>
          </div>
          <div>
            <span :class="getScoreClass(feedbackData?.mathScore)">
              <b>{{ getScoreText(feedbackData?.mathScore) }}</b>
            </span>
          </div>
          <div>
            <span :class="getTimeClass(feedbackData?.mathTime)">
              {{ feedbackData?.mathTime ?? '--' }}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <span><b>Eng</b></span>
          </div>
          <div>
            <span :class="getScoreClass(feedbackData?.englishScore)">
              <b>{{ getScoreText(feedbackData?.englishScore) }}</b>
            </span>
          </div>
          <div>
            <span :class="getTimeClass(feedbackData?.englishTime)">
              {{ feedbackData?.englishTime ?? '--' }}
            </span>
          </div>
        </div>
        <div class="mt-4">
          <label class="block text-left mb-1"><b>Feedback
            <span v-if="feedbackData?.createdByName">({{ feedbackData?.createdByName }})</span>
          </b></label>
          <p v-if="feedbackData?.feedback" class="text-secondary-700">
            {{ feedbackData.feedback }}
          </p>
          <p v-else class="text-secondary-400">No feedback available</p>
        </div>
      </div>
      <div v-if="!qrMode" class="mt-4">
        <label class="block mb-2 text-lg"><b>Sign Below</b></label>
        <signature-pad ref="signaturePad" />
      </div>
      <div v-else class="w-full text-center py-12">
        <Spinner size="lg" />
      </div>
    </template>
    <template #footer>
      <Button
        v-if="!qrMode"
        @click.prevent="onSubmit"
        :disabled="loading"
      >
        {{ loading ? '...' : 'Submit' }}
      </Button>
    </template>
  </Modal>
</template>
