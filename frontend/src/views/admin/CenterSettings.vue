<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { Input, Button, Checkbox } from '@/components/ui';
import { useCenterStore } from '@/stores';
import axios from '@/axios';
import { useToast } from 'vue-toastification';

const centerStore = useCenterStore();

const formData = reactive({
  name: '',
  displayName: '',
  region: '',
  phoneNumber: '',
  email: '',
  isFeedbackNotification: true
});

const errors = ref({
  name: '',
  displayName: '',
  region: '',
  phoneNumber: '',
  email: ''
});

const saving = ref(false);
const success = ref(false);
const sendingEmails = ref(false);
const toast = useToast();

const loadCenter = () => {
  if (centerStore.center) {
    formData.name = centerStore.center.name || '';
    formData.displayName = centerStore.center.displayName || '';
    formData.region = centerStore.center.region || '';
    formData.phoneNumber = centerStore.center.phoneNumber || '';
    formData.email = centerStore.center.email || '';
    formData.isFeedbackNotification = centerStore.center.isFeedbackNotification ?? true;
  }
};

watch(() => centerStore.center, loadCenter, { immediate: true });

const validate = () => {
  let isValid = true;
  errors.value = {
    name: '',
    displayName: '',
    region: '',
    phoneNumber: '',
    email: ''
  };

  if (!formData.name.trim()) {
    errors.value.name = 'Center name is required';
    isValid = false;
  } else if (formData.name.trim().length < 2 || formData.name.trim().length > 64) {
    errors.value.name = 'Name must be between 2 and 64 characters';
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
      region: formData.region.trim() || undefined,
      phoneNumber: formData.phoneNumber.trim() || null,
      email: formData.email.trim() || null,
      isFeedbackNotification: formData.isFeedbackNotification
    });

    success.value = true;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to update settings');
  } finally {
    saving.value = false;
  }
};

const sendFeedbackEmails = async () => {
  const confirmed = window.confirm(
    'This will send all pending feedback emails to hemant.kumar@techcurl.com. Continue?'
  );
  if (!confirmed) return;

  try {
    sendingEmails.value = true;
    const response = await axios.post('/feedback/send-emails');
    const data = response.data;

    if (data.success) {
      toast.success(
        `Emails sent successfully! Sent: ${data.sent}, Failed: ${data.failed}, Total: ${data.total}`
      );
    } else {
      toast.warning('No pending feedback emails to send');
    }
  } catch (error: any) {
    console.error('Failed to send feedback emails:', error);
    toast.error(error?.response?.data?.error?.message || 'Failed to send feedback emails');
  } finally {
    sendingEmails.value = false;
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
    <div
      class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden max-w-2xl"
    >
      <div
        class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200"
      >
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
              v-model="formData.region"
              type="text"
              placeholder="Region"
              label="Region"
              :error="errors.region"
              @input="clearError('region')"
            />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                v-model="formData.phoneNumber"
                type="tel"
                placeholder="Phone Number"
                label="Phone Number"
                :error="errors.phoneNumber"
                @input="clearError('phoneNumber')"
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

            <div class="pt-4 border-t border-secondary-100">
              <h4 class="text-sm font-semibold text-secondary-700 mb-3">Email Notifications</h4>
              <Checkbox
                v-model="formData.isFeedbackNotification"
                label="Enable Feedback Email Notifications"
              />
              <p class="text-xs text-secondary-500 mt-1 ml-6">
                When enabled, parents will automatically receive daily feedback emails at 1 PM and 7 PM
              </p>

              <!-- Manual Email Trigger -->
              <div class="mt-4 p-4 bg-secondary-50 rounded-xl border border-secondary-200">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <h5 class="text-sm font-semibold text-secondary-900 mb-1">
                      <i class="fa-solid fa-paper-plane text-primary-500 mr-2"></i>
                      Send Pending Feedback Emails Now
                    </h5>
                    <p class="text-xs text-secondary-600">
                      Manually trigger sending all completed feedback emails that haven't been sent yet.
                      Emails will be sent to hemant.kumar@techcurl.com for testing.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    :disabled="sendingEmails"
                    @click="sendFeedbackEmails"
                  >
                    <i v-if="sendingEmails" class="fa-solid fa-spinner fa-spin mr-1"></i>
                    <i v-else class="fa-solid fa-paper-plane mr-1"></i>
                    {{ sendingEmails ? 'Sending...' : 'Send Now' }}
                  </Button>
                </div>
              </div>
            </div>

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
