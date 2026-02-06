<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';

import { Modal, Input, Button } from '@/components/ui';

import { useStudentStore } from '@/stores';

const props = withDefaults(
  defineProps<{
    show: boolean;
    childId: number | null;
    name: string;
    amount: string | number | null;
    payment?: any | null;
  }>(),
  {
    show: false,
    payment: null
  }
);

const isEdit = computed(() => !!props.payment);

const formData = reactive({
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
      if (props.payment) {
        // Edit mode - populate from existing payment
        formData.amount = props.payment.amount?.toString() || '';
        formData.paymentDate = props.payment.paymentDate || '';
        formData.notes = props.payment.notes || '';
      } else {
        // Create mode
        formData.amount = props.amount ? props.amount.toString() : '';
        formData.paymentDate = new Date().toISOString().split('T')[0];
        formData.notes = '';
      }
    }
  }
);

const onSubmit = async () => {
  try {
    loading.value = true;

    if (isEdit.value) {
      await studentStore.updatePayment(props.payment.id, {
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        notes: formData.notes || undefined
      });
    } else {
      await studentStore.addPayment({
        child: props.childId,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        notes: formData.notes
      });
    }
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
    :open="show"
    :closable="true"
    :title="isEdit ? `Edit Payment - ${name}` : `Add Payment - ${name}`"
    @close="emit('update:show', false)"
  >
    <form id="add-guardian-form" @submit.prevent="onSubmit">
      <div class="space-y-3">
        <Input
          v-model="formData.amount"
          type="number"
          placeholder="Amount"
          label="Amount"
          required
        />
        <Input
          v-model="formData.paymentDate"
          type="date"
          placeholder="Payment Date"
          label="Payment Date"
          required
        />
        <Input v-model="formData.notes" type="text" placeholder="Notes (Optional)" label="Notes" />
      </div>
    </form>
    <template #footer>
      <Button variant="outline" @click="emit('update:show', false)">Cancel</Button>
      <Button type="submit" form="add-guardian-form" :disabled="loading">
        {{ loading ? '...' : isEdit ? 'Update' : 'Save' }}
      </Button>
    </template>
  </Modal>
</template>
