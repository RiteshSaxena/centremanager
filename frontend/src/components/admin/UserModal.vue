<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Modal, Input, Select, Button } from '@/components/ui';
import type { User } from '@/types';
import type { SelectOption } from '@/components/ui/Select.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    user?: User | null;
  }>(),
  {
    show: false,
    loading: false,
    user: null
  }
);

const emit = defineEmits(['update:show', 'submit']);

const isEdit = ref(false);

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  type: 'staff' as 'admin' | 'staff'
});

const errors = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  type: ''
});

const typeOptions: SelectOption[] = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' }
];

const resetForm = () => {
  formData.firstName = '';
  formData.lastName = '';
  formData.email = '';
  formData.password = '';
  formData.type = 'staff';
  errors.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    type: ''
  };
};

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.user) {
        isEdit.value = true;
        formData.firstName = props.user.firstName || '';
        formData.lastName = props.user.lastName || '';
        formData.email = props.user.email || '';
        formData.password = '';
        formData.type = props.user.type || 'staff';
      } else {
        isEdit.value = false;
        resetForm();
      }
    }
  }
);

const validate = () => {
  let isValid = true;
  errors.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    type: ''
  };

  if (!formData.firstName.trim()) {
    errors.value.firstName = 'First name is required';
    isValid = false;
  }

  if (!formData.email.trim()) {
    errors.value.email = 'Email is required';
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.value.email = 'Please enter a valid email address';
    isValid = false;
  }

  if (!isEdit.value && !formData.password.trim()) {
    errors.value.password = 'Password is required';
    isValid = false;
  } else if (formData.password && formData.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters';
    isValid = false;
  }

  if (!formData.type) {
    errors.value.type = 'User type is required';
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
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.toLowerCase().trim(),
    type: formData.type
  };

  if (formData.password) {
    payload.password = formData.password;
  }

  emit('submit', payload);
};

const close = () => {
  emit('update:show', false);
};
</script>

<template>
  <Modal :open="show" :title="isEdit ? 'Edit User' : 'Add User'" @close="close">
    <form id="user-form" @submit.prevent="onSubmit">
      <div class="space-y-3">
        <Input
          v-model="formData.firstName"
          type="text"
          placeholder="First Name"
          label="First Name *"
          :error="errors.firstName"
          @input="clearError('firstName')"
        />
        <Input
          v-model="formData.lastName"
          type="text"
          placeholder="Last Name"
          label="Last Name"
          :error="errors.lastName"
          @input="clearError('lastName')"
        />
        <Input
          v-model="formData.email"
          type="email"
          placeholder="Email"
          label="Email *"
          :error="errors.email"
          @input="clearError('email')"
        />
        <Input
          v-model="formData.password"
          type="password"
          :placeholder="isEdit ? 'Leave blank to keep current' : 'Password'"
          :label="isEdit ? 'Password (optional)' : 'Password *'"
          :error="errors.password"
          @input="clearError('password')"
        />
        <Select
          v-model="formData.type"
          :options="typeOptions"
          label="User Type *"
          placeholder="Select type"
          :error="errors.type"
          @update:model-value="clearError('type')"
        />
      </div>
    </form>
    <template #footer>
      <Button variant="outline" @click="close">Cancel</Button>
      <Button type="submit" form="user-form" :disabled="loading">
        {{ loading ? 'Saving...' : isEdit ? 'Update' : 'Create' }}
      </Button>
    </template>
  </Modal>
</template>
