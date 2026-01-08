<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

import { useLogBookStore } from '@/stores';

import SignaturePad from '@/components/SignaturePad.vue';
import { Modal, Input, Button } from '@/components/ui';

const props = withDefaults(
  defineProps<{
    show: boolean;
  }>(),
  {
    show: false
  }
);

const toast = useToast();
const logBookStore = useLogBookStore();

const step = ref(1);
const signaturePad = ref<typeof SignaturePad | null>(null);

const guestData = reactive({
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

const loading = ref(false);

const validateStep1 = () => {
  let isValid = true;
  errors.value = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  };

  if (!guestData.firstName.trim()) {
    errors.value.firstName = 'First name is required';
    isValid = false;
  }

  if (!guestData.lastName.trim()) {
    errors.value.lastName = 'Last name is required';
    isValid = false;
  }

  if (guestData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email)) {
    errors.value.email = 'Please enter a valid email address';
    isValid = false;
  }

  if (guestData.phoneNumber && !/^\d{10,}$/.test(guestData.phoneNumber.toString().replace(/\D/g, ''))) {
    errors.value.phoneNumber = 'Please enter a valid phone number (at least 10 digits)';
    isValid = false;
  }

  return isValid;
};

const goToStep2 = () => {
  if (validateStep1()) {
    step.value = 2;
  }
};

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = '';
};

watch(
  () => props.show,
  (val) => {
    if (val) {
      guestData.firstName = '';
      guestData.lastName = '';
      guestData.email = '';
      guestData.phoneNumber = '';
      errors.value = {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
      };
      step.value = 1;
      signaturePad.value?.reset();
    }
  }
);

const onSubmit = async () => {
  try {
    loading.value = true;
    if (!signaturePad.value || signaturePad.value.isEmpty()) {
      toast.error('Please sign to continue');
      return;
    }

    const payload: any = {
      firstName: guestData.firstName.trim(),
      lastName: guestData.lastName.trim(),
      signature: signaturePad.value.getImage()
    };

    if (guestData.email) {
      payload.email = guestData.email.toLowerCase().trim();
    }

    if (guestData.phoneNumber) {
      payload.phoneNumber = guestData.phoneNumber.toString().trim();
    }

    await logBookStore.guestSignIn(payload);

    toast.success('Guest signed successfully');
    emit('update:show', false);
    await logBookStore.fetchList();
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits(['update:show']);
</script>

<template>
  <Modal
    :open="show"
    :size="step === 2 ? 'xl' : 'md'"
    :closable="step === 1"
    title="Guest Sign In"
    @close="emit('update:show', false)"
  >
    <form id="add-guardian-form" v-if="step === 1" @submit.prevent="goToStep2">
      <div class="space-y-3">
        <Input
          v-model="guestData.firstName"
          type="text"
          placeholder="First Name"
          label="First Name"
          :error="errors.firstName"
          @input="clearError('firstName')"
        />
        <Input
          v-model="guestData.lastName"
          type="text"
          placeholder="Last Name"
          label="Last Name"
          :error="errors.lastName"
          @input="clearError('lastName')"
        />
        <Input
          v-model="guestData.email"
          type="email"
          placeholder="Email (Optional)"
          label="Email"
          :error="errors.email"
          @input="clearError('email')"
        />
        <Input
          v-model="guestData.phoneNumber"
          type="tel"
          placeholder="Phone Number (Optional)"
          label="Phone Number"
          :error="errors.phoneNumber"
          @input="clearError('phoneNumber')"
        />
      </div>
    </form>
    <div v-else>
      <signature-pad ref="signaturePad" />
    </div>
    <template #footer>
      <Button v-if="step === 1" type="submit" form="add-guardian-form">
        Next
      </Button>
      <Button v-if="step === 2" variant="secondary" @click.prevent="step = 1">
        Back
      </Button>
      <Button
        v-if="step === 2"
        @click.prevent="onSubmit"
        :disabled="loading"
      >
        {{ loading ? '...' : 'Submit' }}
      </Button>
    </template>
  </Modal>
</template>
