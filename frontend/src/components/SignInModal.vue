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

const isParentWithStudent = ref(false);

const onSubmit = async () => {
  if (!signaturePad.value || signaturePad.value.isEmpty()) {
    throw new Error('Please sign to continue');
  }

  if (!props.item) {
    throw new Error('User not found');
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
    const payload: any = {
      signature: signaturePad.value.getImage().signature
    };
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
    :title="`Sign In - ${item?.firstName} ${item?.lastName}`"
    @close="emit('update:show', false)"
  >
    <div>
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
      <button type="button" class="btn btn-info" @click.prevent="onSubmit" :disabled="loading">
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
