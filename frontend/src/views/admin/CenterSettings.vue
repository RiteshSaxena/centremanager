<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { Input, Checkbox, Button } from '@/components/ui';
import { useCenterStore } from '@/stores';

const centerStore = useCenterStore();

const formData = reactive({
  name: '',
  displayName: '',
  address: '',
  phone: '',
  email: '',
  booksEnabled: false
});

const errors = ref({
  name: '',
  displayName: '',
  address: '',
  phone: '',
  email: ''
});

const saving = ref(false);
const success = ref(false);

const loadCenter = () => {
  if (centerStore.center) {
    formData.name = centerStore.center.name || '';
    formData.displayName = centerStore.center.displayName || '';
    formData.address = centerStore.center.address || '';
    formData.phone = centerStore.center.phone || '';
    formData.email = centerStore.center.email || '';
    formData.booksEnabled = centerStore.center.booksEnabled || false;
  }
};

watch(() => centerStore.center, loadCenter, { immediate: true });

const validate = () => {
  let isValid = true;
  errors.value = {
    name: '',
    displayName: '',
    address: '',
    phone: '',
    email: ''
  };

  if (!formData.name.trim()) {
    errors.value.name = 'Center name is required';
    isValid = false;
  }

  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.value.email = 'Please enter a valid email address';
    isValid = false;
  }

  return isValid;
};

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = '';
  success.value = false;
};

const onSubmit = async () => {
  if (!validate()) {
    return;
  }

  try {
    saving.value = true;
    success.value = false;

    await centerStore.updateCenter({
      name: formData.name.trim(),
      displayName: formData.displayName.trim() || undefined,
      address: formData.address.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      booksEnabled: formData.booksEnabled
    });

    success.value = true;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to update settings');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  centerStore.fetchCenter();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-gear text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Center Settings</h2>
          <p class="text-sm text-secondary-500">Configure your center details</p>
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden max-w-2xl">
      <div class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
            <i class="fa-solid fa-building text-white text-lg"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-primary-900">Center Information</h3>
            <p class="text-xs text-primary-600">Update your center's profile</p>
          </div>
        </div>
      </div>

      <div class="p-5">
        <!-- Success Message -->
        <div
          v-if="success"
          class="mb-4 p-4 bg-success-50 border border-success-200 rounded-xl flex items-center gap-3"
        >
          <div class="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
            <i class="fa-solid fa-check text-success-600"></i>
          </div>
          <p class="text-sm font-medium text-success-700">Settings updated successfully!</p>
        </div>

        <form @submit.prevent="onSubmit">
          <div class="space-y-4">
            <Input
              v-model="formData.name"
              type="text"
              placeholder="Center Name"
              label="Center Name *"
              :error="errors.name"
              @input="clearError('name')"
            />
            <Input
              v-model="formData.displayName"
              type="text"
              placeholder="Display Name (optional)"
              label="Display Name"
              :error="errors.displayName"
              @input="clearError('displayName')"
            />
            <Input
              v-model="formData.address"
              type="text"
              placeholder="Region"
              label="Address"
              :error="errors.address"
              @input="clearError('address')"
            />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                v-model="formData.phone"
                type="tel"
                placeholder="Phone Number"
                label="Phone"
                :error="errors.phone"
                @input="clearError('phone')"
              />
              <Input
                v-model="formData.email"
                type="email"
                placeholder="Email Address"
                label="Email"
                :error="errors.email"
                @input="clearError('email')"
              />
            </div>

            <!-- <div class="pt-4 border-t border-secondary-100">
              <h4 class="text-sm font-semibold text-secondary-700 mb-3">Features</h4>
              <Checkbox
                v-model="formData.booksEnabled"
                label="Enable Books/Payments Tracking"
              />
            </div> -->

            <div class="pt-4 flex justify-end">
              <Button type="submit" :disabled="saving || centerStore.loading">
                <i v-if="saving" class="fa-solid fa-spinner fa-spin mr-1"></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
