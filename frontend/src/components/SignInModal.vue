<script setup lang="ts">
import type { SearchResult } from '@/types';

import { ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import SignaturePad from '@/components/SignaturePad.vue';
import { Modal, Button, Spinner, Checkbox } from '@/components/ui';

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

const clearSignature = () => {
  signaturePad.value?.reset();
};

const closeModal = () => {
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
    :open="show"
    size="xl"
    :closable="!qrMode"
    :title="`Sign In - ${item?.firstName} ${item?.lastName}`"
    @close="closeModal"
  >
    <!-- QR Mode Processing -->
    <div v-if="qrMode" class="w-full text-center py-8 md:py-12">
      <Spinner size="lg" />
      <p class="text-sm md:text-base text-secondary-600 mt-3 md:mt-4">Processing sign in...</p>
    </div>

    <div v-else>
      <!-- Person Info Card -->
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
            <p class="text-xs md:text-base text-primary-600 font-medium mb-0.5 md:mb-1">Signing In</p>
            <p class="text-sm md:text-2xl font-bold text-primary-900">
              {{ item?.firstName }} {{ item?.lastName }}
            </p>
          </div>
        </div>
      </div>

      <!-- Signature Section -->
      <div class="bg-white rounded-xl md:rounded-2xl border-2 border-secondary-200 p-3 md:p-6">
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
        <p class="text-sm md:text-base text-secondary-600 mb-3 md:mb-4">Please sign below to confirm sign in</p>
        <signature-pad ref="signaturePad" />
        <div class="mt-3 md:mt-4" v-if="item?.type === 'parent'">
          <Checkbox v-model="isParentWithStudent" label="Is Parent coming with student?" />
        </div>
      </div>
    </div>

    <template #footer>
      <div v-if="!qrMode" class="flex gap-2 md:gap-3 w-full">
        <Button
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
          {{ loading ? 'Processing...' : 'Confirm Sign In' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
