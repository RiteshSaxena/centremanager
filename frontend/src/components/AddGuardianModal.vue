<script setup lang="ts">
import { reactive, ref } from 'vue';

import { Modal, Input, Button } from '@/components/ui';

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

const errors = ref({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: ''
});

const validate = () => {
  let isValid = true;
  errors.value = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  };

  if (!guardianData.firstName.trim()) {
    errors.value.firstName = 'First name is required';
    isValid = false;
  }

  if (!guardianData.lastName.trim()) {
    errors.value.lastName = 'Last name is required';
    isValid = false;
  }

  if (guardianData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianData.email)) {
    errors.value.email = 'Please enter a valid email address';
    isValid = false;
  }

  if (!guardianData.phoneNumber.trim()) {
    errors.value.phoneNumber = 'Phone number is required';
    isValid = false;
  } else if (!/^\d{10,}$/.test(guardianData.phoneNumber.toString().replace(/\D/g, ''))) {
    errors.value.phoneNumber = 'Please enter a valid phone number (at least 10 digits)';
    isValid = false;
  }

  return isValid;
};

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = '';
};

const onSubmit = () => {
  if (!validate()) {
    return;
  }

  const payload: any = {
    firstName: guardianData.firstName.trim(),
    lastName: guardianData.lastName.trim(),
    phoneNumber: guardianData.phoneNumber.trim()
  };

  if (guardianData.email) {
    payload.email = guardianData.email.toLowerCase().trim();
  }
  emit('onSubmit', payload);
};

const emit = defineEmits(['update:show', 'onSubmit']);
</script>

<template>
  <Modal :open="show" title="Add Guardian" @close="emit('update:show', false)">
    <form id="add-guardian-form" @submit.prevent="onSubmit">
      <div class="space-y-3">
        <Input
          v-model="guardianData.firstName"
          type="text"
          placeholder="First Name"
          label="First Name"
          :error="errors.firstName"
          @input="clearError('firstName')"
        />
        <Input
          v-model="guardianData.lastName"
          type="text"
          placeholder="Last Name"
          label="Last Name"
          :error="errors.lastName"
          @input="clearError('lastName')"
        />
        <Input
          v-model="guardianData.email"
          type="email"
          placeholder="Email (Optional)"
          label="Email"
          :error="errors.email"
          @input="clearError('email')"
        />
        <Input
          v-model="guardianData.phoneNumber"
          type="tel"
          placeholder="Phone Number"
          label="Phone Number"
          :error="errors.phoneNumber"
          @input="clearError('phoneNumber')"
        />
      </div>
    </form>
    <template #footer>
      <Button type="submit" form="add-guardian-form" :disabled="loading">
        {{ loading ? '...' : 'Add' }}
      </Button>
    </template>
  </Modal>
</template>
