<script setup lang="ts">
import Modal from '@/components/base/Modal.vue';
import InputField from '@/components/base/InputField.vue';

withDefaults(
  defineProps<{
    show: boolean;
  }>(),
  {
    show: false
  }
);

const emit = defineEmits(['update:show']);
</script>

<template>
  <Modal v-if="show" title="Guest Sign In" @close="emit('update:show', false)">
    <form id="add-guardian-form">
      <InputField class="mb-2" placeholder="First Name" />
      <InputField class="mb-2" placeholder="Last Name" />
      <InputField class="mb-2" placeholder="Email" />
      <InputField placeholder="Phone Number" />
    </form>
    <template #footer>
      <button type="submit" form="add-guardian-form" class="btn btn-info">Add</button>
    </template>
  </Modal>
</template>
