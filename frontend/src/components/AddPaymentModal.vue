<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import { Modal, Input, Button } from '@/components/ui';

import { useStudentStore } from '@/stores';

const props = withDefaults(
  defineProps<{
    show: boolean;
    childId: number | null;
    name: string;
    amount: string | number | null;
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
      guestData.amount = props.amount ? props.amount.toString() : '';
      guestData.paymentDate = new Date().toISOString().split('T')[0];
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
    :open="show"
    :closable="true"
    :title="`Add Payment - ${name}`"
    @close="emit('update:show', false)"
  >
    <form id="add-guardian-form" @submit.prevent="onSubmit">
      <div class="space-y-3">
        <Input
          v-model="guestData.amount"
          type="number"
          placeholder="Amount"
          label="Amount"
          required
        />
        <Input
          v-model="guestData.paymentDate"
          type="date"
          placeholder="Payment Date"
          label="Payment Date"
          required
        />
        <Input
          v-model="guestData.notes"
          type="text"
          placeholder="Notes (Optional)"
          label="Notes"
        />
      </div>
    </form>
    <template #footer>
      <Button type="submit" form="add-guardian-form" :disabled="loading">
        {{ loading ? '...' : 'Save' }}
      </Button>
    </template>
  </Modal>
</template>
