<script setup lang="ts">
import { reactive } from 'vue';

import Modal from '@/components/base/Modal.vue';
import InputField from '@/components/base/InputField.vue';

withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
  }>(),
  {
    show: false,
    loading: false
  }
);

const guardianData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: ''
});

const onSubmit = () => {
  emit('onSubmit', guardianData);
};

const emit = defineEmits(['update:show', 'onSubmit']);
</script>

<template>
  <Modal v-if="show" title="Add Guardian" @close="emit('update:show', false)">
    <form id="add-guardian-form" @submit.prevent="onSubmit">
      <InputField
        v-model="guardianData.firstName"
        type="text"
        :required="true"
        class="mb-2"
        placeholder="First Name"
      />
      <InputField
        v-model="guardianData.lastName"
        type="text"
        :required="true"
        class="mb-2"
        placeholder="Last Name"
      />
      <InputField
        v-model="guardianData.email"
        type="email"
        :required="true"
        class="mb-2"
        placeholder="Email"
      />
      <InputField
        v-model="guardianData.phoneNumber"
        type="text"
        :required="true"
        placeholder="Phone Number"
      />
    </form>
    <template #footer>
      <button type="submit" form="add-guardian-form" class="btn btn-info" :disabled="loading">
        {{ loading ? '...' : 'Add' }}
      </button>
    </template>
  </Modal>
</template>
