<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { useLogBookStore } from '@/stores';

import Modal from '@/components/base/Modal.vue';
import InputField from '@/components/base/InputField.vue';
import SignaturePad from '@/components/SignaturePad.vue';

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

const loading = ref(false);

watch(
  () => props.show,
  (val) => {
    if (val) {
      step.value = 1;
      signaturePad.value?.reset();
    }
  }
);

const onSubmit = async () => {
  try {
    loading.value = true;
    if (!signaturePad.value || signaturePad.value.isEmpty()) {
      throw new Error('Please sign to continue');
    }

    const payload: any = {
      firstName: guestData.firstName,
      lastName: guestData.lastName,
      phoneNumber: guestData.phoneNumber.toString(),
      signature: signaturePad.value.getImage()
    };

    if (guestData.email) {
      payload.email = guestData.email;
    }

    await logBookStore.guestSignIn(payload);

    toast.success('Guest signed successfully');
    logBookStore.fetchList();
    emit('update:show', false);
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits(['update:show']);
</script>

<template>
  <Modal
    v-if="show"
    :show-footer-close-button="step === 1"
    title="Guest Sign In"
    @close="emit('update:show', false)"
  >
    <form id="add-guardian-form" v-if="step === 1" @submit.prevent="step = 2">
      <InputField
        v-model="guestData.firstName"
        type="text"
        :required="true"
        class="mb-2"
        placeholder="First Name"
      />
      <InputField
        v-model="guestData.lastName"
        type="text"
        :required="true"
        class="mb-2"
        placeholder="Last Name"
      />
      <InputField v-model="guestData.email" type="email" class="mb-2" placeholder="Email" />
      <InputField
        v-model="guestData.phoneNumber"
        type="number"
        :required="true"
        placeholder="Phone Number"
      />
    </form>
    <div v-else>
      <signature-pad ref="signaturePad" />
    </div>
    <template #footer>
      <button v-if="step === 1" type="submit" form="add-guardian-form" class="btn btn-info">
        Next
      </button>
      <button v-if="step === 2" type="button" class="btn btn-secondary" @click.prevent="step = 1">
        Back
      </button>
      <button
        v-if="step === 2"
        type="button"
        class="btn btn-info"
        @click.prevent="onSubmit"
        :disabled="loading"
      >
        {{ loading ? '...' : 'Submit' }}
      </button>
    </template>
  </Modal>
</template>
