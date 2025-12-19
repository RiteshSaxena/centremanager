<script setup lang="ts">
import type { LogRecord } from '@/types';

import { computed, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
import SignaturePad from '@/components/SignaturePad.vue';

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

watch(
  () => props.show,
  (val) => {
    if (val) {
      qrMode.value = props.isQrMode && !!props.item?.signatureId;
      if (qrMode.value) {
        setTimeout(() => {
          onSubmit();
        }, 500);
      }
      signaturePad.value?.reset();
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
    <div class="w-100 fs-5 text-start d-flex flex-column gap-2">
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
          <span class="text-success">100%</span>
        </div>
        <div class="col-4">
          <span>29</span>
        </div>
      </div>
      <div class="row">
        <div class="col-4">
          <span><b>Eng</b></span>
        </div>
        <div class="col-4">
          <span class="text-warning"><b>-2</b></span>
        </div>
        <div class="col-4">
          <span>32</span>
        </div>
      </div>
      <div class="row">
        <div class="col-12 mt-4 align-items-start justify-content-start d-flex">
          <label><b>Feedback</b></label>
        </div>
        <div class="col-12">
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Inventore vel magnam magni similique minima sed, numquam autem consequatur sint perferendis dicta laborum hic aut voluptates quos iusto dolorem veritatis officiis?</p>
        </div>
      </div>
    </div>
    <div v-if="qrMode" class="w-100 text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else>
      <signature-pad ref="signaturePad" />
    </div>

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
