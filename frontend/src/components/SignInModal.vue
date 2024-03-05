<script setup lang="ts">
import type { SearchResult } from '@/types';

import { ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
import SignaturePad from '@/components/SignaturePad.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    item: SearchResult | null;
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

const isParentWithStudent = ref(false);

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

  // if (props.item.type === 'parent') {
  //   emit('onSubmit', {
  //     signature: signaturePad.value.getImage(),
  //     isParentWithStudent: isParentWithStudent.value
  //   });
  //   return;
  // }
  // emit('onSubmit', {
  //   signature: signaturePad.value.getImage()
  // });

  try {
    loading.value = true;
    const payload: any = {};

    if (qrMode.value) {
      payload.signatureId = props.item?.signatureId;
    } else {
      payload.signature = signaturePad.value?.getImage();
    }

    if (props.item.type === 'staff') {
      payload.staff = props.item.id;
      payload.type = 'Staff';
    } else if (props.item.type === 'parent') {
      if (isParentWithStudent.value) {
        payload.type = 'StudentWithParent';
      } else {
        payload.type = 'Student';
      }
      payload.parent = props.item.id;
      payload.student = props.item.student;
    }

    await logBookStore.signIn(payload);

    emit('onSuccess');
    emit('update:show', false);
    const audio = new Audio('../assets/sign-in.wav');
    await audio.play();
    toast.success('Signed Successfully');
    logBookStore.fetchList().then();
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Modal
    v-if="show"
    :large="true"
    :show-footer-close-button="!qrMode"
    :title="`Sign In - ${item?.firstName} ${item?.lastName}`"
    @close="emit('update:show', false)"
  >
    <div v-if="qrMode" class="w-100 text-center my-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div v-else>
      <signature-pad ref="signaturePad" />
      <div class="form-check" v-if="item?.type === 'parent'">
        <input
          class="form-check-input"
          type="checkbox"
          v-model="isParentWithStudent"
          id="isParentComing"
        />
        <label class="form-check-label" for="isParentComing">
          Is Parent coming with student?
        </label>
      </div>
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

<style scoped lang="scss">
.form-check {
  margin-top: -2rem;
}
</style>
