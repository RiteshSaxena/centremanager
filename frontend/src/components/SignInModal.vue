<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from '@/components/base/Modal.vue';
import SignaturePad from '@/components/SignaturePad.vue';
import type { SearchResult } from '@/types';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    selectedUser: SearchResult | null;
  }>(),
  {
    show: false,
    loading: false,
    selectedUser: null
  }
);

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

  if (props.selectedUser?.type === 'parent') {
    emit('onSubmit', {
      signature: signaturePad.value.getImage(),
      isParentWithStudent: isParentWithStudent.value
    });
    return;
  }
  emit('onSubmit', {
    signature: signaturePad.value.getImage()
  });
};

const emit = defineEmits(['update:show', 'onSubmit']);
</script>

<template>
  <Modal v-if="show" title="Sign In" @close="emit('update:show', false)">
    <div>
      <signature-pad ref="signaturePad" />
      <div class="form-check mt-4" v-if="selectedUser?.type === 'parent'">
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
