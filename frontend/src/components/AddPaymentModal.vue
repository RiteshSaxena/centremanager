<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import Modal from '@/components/base/Modal.vue';
import InputField from '@/components/base/InputField.vue';

import { useStudentStore } from '@/stores';

const props = withDefaults(
  defineProps<{
    show: boolean;
    childId: number | null;
  }>(),
  {
    show: false
  }
);

const guestData = reactive({
  amount: '',
  paymentDate: '',
  notes: ''
});

const studentStore = useStudentStore();

const loading = ref(false);

watch(
  () => props.show,
  (val) => {
    if (val) {
      guestData.amount = '';
      guestData.paymentDate = '';
      guestData.notes = '';
    }
  }
);

const onSubmit = async () => {
  try {
    loading.value = true;

    await studentStore.addPayment({
      child: props.childId,
      amount: parseFloat(guestData.amount),
      paymentDate: guestData.paymentDate,
      notes: guestData.notes
    });
    emit('update:show', false);
    emit('onSuccess');
  } finally {
    loading.value = false;
  }
};

const emit = defineEmits(['update:show', 'onSuccess']);
</script>

<template>
  <Modal
    v-if="show"
    :show-footer-close-button="true"
    title="Add Payment"
    @close="emit('update:show', false)"
  >
    <form id="add-guardian-form" @submit.prevent="onSubmit">
      <InputField
        :is-floating="true"
        :is-white="true"
        v-model="guestData.amount"
        type="number"
        :required="true"
        class="mb-2"
        placeholder="Amount"
      />
      <InputField
        :is-floating="true"
        :is-white="true"
        v-model="guestData.paymentDate"
        type="date"
        :required="true"
        class="mb-2"
        placeholder="Last Name"
      />
      <InputField
        :is-floating="true"
        :is-white="true"
        v-model="guestData.notes"
        type="text"
        class="mb-2"
        placeholder="Notes (Optional)"
      />
    </form>
    <template #footer>
      <button type="submit" class="btn btn-info" form="add-guardian-form" :disabled="loading">
        {{ loading ? '...' : 'Save' }}
      </button>
    </template>
  </Modal>
</template>
