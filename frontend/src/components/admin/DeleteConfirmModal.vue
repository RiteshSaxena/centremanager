<script setup lang="ts">
import { Modal, Button } from '@/components/ui';

withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    title?: string;
    message?: string;
    itemName?: string;
  }>(),
  {
    show: false,
    loading: false,
    title: 'Delete Confirmation',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    itemName: ''
  }
);

const emit = defineEmits(['update:show', 'confirm']);

const close = () => {
  emit('update:show', false);
};

const confirm = () => {
  emit('confirm');
};
</script>

<template>
  <Modal :open="show" :title="title" size="sm" @close="close">
    <div class="text-center">
      <div
        class="mx-auto mb-4 w-14 h-14 rounded-full bg-danger-100 flex items-center justify-center"
      >
        <i class="fa-solid fa-trash text-danger-600 text-2xl"></i>
      </div>
      <p class="text-secondary-600">
        {{ message }}
      </p>
      <p v-if="itemName" class="mt-2 font-semibold text-secondary-900">
        "{{ itemName }}"
      </p>
    </div>
    <template #footer>
      <Button variant="outline" @click="close">Cancel</Button>
      <Button variant="danger" :disabled="loading" @click="confirm">
        {{ loading ? 'Deleting...' : 'Delete' }}
      </Button>
    </template>
  </Modal>
</template>
