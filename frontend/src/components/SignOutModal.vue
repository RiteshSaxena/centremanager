<script setup lang="ts">
import { ref, watch } from 'vue';
import Modal from '@/components/base/Modal.vue';
import SignaturePad from '@/components/SignaturePad.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
  }>(),
  {
    show: false,
    loading: false
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
  <Modal v-if="show" title="Sign Out" @close="emit('update:show', false)">
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
