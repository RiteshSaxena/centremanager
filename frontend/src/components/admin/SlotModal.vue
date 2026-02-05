<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Modal, Input, Select, Button } from '@/components/ui';
import type { Slot, DayOfWeek } from '@/types';
import type { SelectOption } from '@/components/ui/Select.vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    slot?: Slot | null;
  }>(),
  {
    show: false,
    loading: false,
    slot: null
  }
);

const emit = defineEmits(['update:show', 'submit']);

const isEdit = ref(false);

const formData = reactive({
  name: '',
  day: '' as DayOfWeek | '',
  startTime: '',
  endTime: ''
});

const errors = ref({
  name: '',
  day: '',
  startTime: '',
  endTime: ''
});

const dayOptions: SelectOption[] = [
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
  { value: 'Sunday', label: 'Sunday' }
];

const resetForm = () => {
  formData.name = '';
  formData.day = '';
  formData.startTime = '';
  formData.endTime = '';
  errors.value = {
    name: '',
    day: '',
    startTime: '',
    endTime: ''
  };
};

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.slot) {
        isEdit.value = true;
        formData.name = props.slot.name || '';
        formData.day = props.slot.day || '';
        formData.startTime = props.slot.startTime || '';
        formData.endTime = props.slot.endTime || '';
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
    name: '',
    day: '',
    startTime: '',
    endTime: ''
  };

  if (!formData.name.trim()) {
    errors.value.name = 'Slot name is required';
    isValid = false;
  }

  if (!formData.day) {
    errors.value.day = 'Day is required';
    isValid = false;
  }

  if (!formData.startTime) {
    errors.value.startTime = 'Start time is required';
    isValid = false;
  }

  if (!formData.endTime) {
    errors.value.endTime = 'End time is required';
    isValid = false;
  }

  if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
    errors.value.endTime = 'End time must be after start time';
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

  const payload = {
    name: formData.name.trim(),
    day: formData.day as DayOfWeek,
    startTime: formData.startTime,
    endTime: formData.endTime
  };

  emit('submit', payload);
};

const close = () => {
  emit('update:show', false);
};
</script>

<template>
  <Modal :open="show" :title="isEdit ? 'Edit Slot' : 'Add Slot'" @close="close">
    <form id="slot-form" @submit.prevent="onSubmit">
      <div class="space-y-3">
        <Input
          v-model="formData.name"
          type="text"
          placeholder="e.g., Morning Session"
          label="Slot Name *"
          :error="errors.name"
          @input="clearError('name')"
        />
        <Select
          v-model="formData.day"
          :options="dayOptions"
          label="Day *"
          placeholder="Select day"
          :error="errors.day"
          @update:model-value="clearError('day')"
        />
        <div class="grid grid-cols-2 gap-3">
          <Input
            v-model="formData.startTime"
            type="time"
            label="Start Time *"
            :error="errors.startTime"
            @input="clearError('startTime')"
          />
          <Input
            v-model="formData.endTime"
            type="time"
            label="End Time *"
            :error="errors.endTime"
            @input="clearError('endTime')"
          />
        </div>
      </div>
    </form>
    <template #footer>
      <Button variant="outline" @click="close">Cancel</Button>
      <Button type="submit" form="slot-form" :disabled="loading">
        {{ loading ? 'Saving...' : isEdit ? 'Update' : 'Create' }}
      </Button>
    </template>
  </Modal>
</template>
