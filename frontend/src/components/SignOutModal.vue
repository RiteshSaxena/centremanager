<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from '@/components/base/Modal.vue';
import SignaturePad from '@/components/SignaturePad.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    name?: string;
  }>(),
  {
    show: false,
    loading: false,
    name: ''
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

const onSubmit = async () => {
  if (!signaturePad.value || signaturePad.value.isEmpty()) {
    throw new Error('Please sign to continue');
  }

  emit('onSubmit', {
    signature: signaturePad.value.getImage()
  });
};

const emit = defineEmits(['update:show', 'onSubmit']);
</script>

<template>
  <Modal
    :large="true"
    v-if="show"
    :title="`Sign Out - ${name}`"
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
