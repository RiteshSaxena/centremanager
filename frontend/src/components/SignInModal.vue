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
    @close="emit('update:show', false)"
  >
    <div v-if="qrMode" class="w-full text-center py-12">
      <Spinner size="lg" />
    </div>
    <div v-else>
      <signature-pad ref="signaturePad" />
      <div class="-mt-8" v-if="item?.type === 'parent'">
        <Checkbox
          v-model="isParentWithStudent"
          label="Is Parent coming with student?"
        />
      </div>
    </div>
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
