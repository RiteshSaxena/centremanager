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
  }>(),
  {
    show: false,
    item: null
  }
);

const emit = defineEmits(['update:show', 'onSuccess']);

const toast = useToast();
const logBookStore = useLogBookStore();

const loading = ref(false);
const signaturePad = ref<typeof SignaturePad | null>(null);

watch(
  () => props.show,
  (val) => {
    if (val) {
      signaturePad.value?.reset();
    }
  }
);

const onSubmit = async () => {
  if (!signaturePad.value || signaturePad.value.isEmpty()) {
    toast.error('Please sign to continue');
    return;
  }

  try {
    loading.value = true;
    const payload: any = {
      signature: signaturePad.value.getImage(),
      signIn: props.item?.id
    };

    await logBookStore.signOut(payload);

    emit('onSuccess');
    emit('update:show', false);
    toast.success('Signed out Successfully');
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
    :title="`Sign Out - ${selectedName}`"
    @close="emit('update:show', false)"
  >
    <div>
      <signature-pad ref="signaturePad" />
    </div>
    <template #footer>
      <button type="button" class="btn btn-info" @click.prevent="onSubmit" :disabled="loading">
        {{ loading ? '...' : 'Submit' }}
      </button>
    </template>
  </Modal>
</template>
