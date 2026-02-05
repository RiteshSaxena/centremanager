<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import { Modal, Input, Select, Button } from '@/components/ui';
import type { Slot, DayOfWeek } from '@/types';
import type { Student } from '@/types';
import type { SelectOption } from '@/components/ui/Select.vue';
import { useSlotStore, useStudentStore } from '@/stores';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    slotData?: Slot | null;
  }>(),
  {
    show: false,
    loading: false,
    slotData: null
  }
);

const emit = defineEmits(['update:show', 'submit', 'refresh']);

const slotStore = useSlotStore();
const studentStore = useStudentStore();

const isEdit = ref(false);
const activeTab = ref<'details' | 'students'>('details');
const allStudents = ref<Student[]>([]);
const searchQuery = ref('');
const savingStudents = ref(false);

// Track pending student changes (not yet saved)
const pendingAdditions = ref<Student[]>([]);
const pendingRemovals = ref<Set<number>>(new Set());

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

const tabs = [
  { id: 'details', label: 'Details', icon: 'fa-clock' },
  { id: 'students', label: 'Students', icon: 'fa-users' }
];

// Current students in the slot (including pending additions, excluding pending removals)
const currentStudents = computed(() => {
  const original = props.slotData?.children || [];
  // Filter out pending removals and add pending additions
  const filtered = original.filter((s) => !pendingRemovals.value.has(s.id));
  return [...filtered, ...pendingAdditions.value];
});

// Students not in this slot (available to add)
const availableStudents = computed(() => {
  const currentIds = new Set(currentStudents.value.map((s) => s.id));
  let available = allStudents.value.filter((s) => !currentIds.has(s.id));

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    available = available.filter(
      (s) => s.firstName?.toLowerCase().includes(query) || s.lastName?.toLowerCase().includes(query)
    );
  }

  return available;
});

// Check if there are pending changes
const hasStudentChanges = computed(() => {
  return pendingAdditions.value.length > 0 || pendingRemovals.value.size > 0;
});

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
  activeTab.value = 'details';
  searchQuery.value = '';
  pendingAdditions.value = [];
  pendingRemovals.value = new Set();
};

watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      if (props.slotData) {
        isEdit.value = true;
        formData.name = props.slotData.name || '';
        formData.day = props.slotData.day || '';
        formData.startTime = props.slotData.startTime || '';
        formData.endTime = props.slotData.endTime || '';
        // Fetch all students for the add student feature
        if (studentStore.students.length === 0) {
          await studentStore.fetchStudents();
        }
        allStudents.value = studentStore.students;
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

const addStudent = (student: Student) => {
  // If this student was previously marked for removal, just unmark them
  if (pendingRemovals.value.has(student.id)) {
    pendingRemovals.value.delete(student.id);
    pendingRemovals.value = new Set(pendingRemovals.value); // Trigger reactivity
  } else {
    // Add to pending additions
    pendingAdditions.value = [...pendingAdditions.value, student];
  }
};

const removeStudent = (student: Student) => {
  // If this student was pending addition, just remove from pending
  const pendingIndex = pendingAdditions.value.findIndex((s) => s.id === student.id);
  if (pendingIndex !== -1) {
    pendingAdditions.value = pendingAdditions.value.filter((s) => s.id !== student.id);
  } else {
    // Mark for removal
    pendingRemovals.value.add(student.id);
    pendingRemovals.value = new Set(pendingRemovals.value); // Trigger reactivity
  }
};

const saveStudentChanges = async () => {
  if (!props.slotData || !hasStudentChanges.value) return;

  try {
    savingStudents.value = true;

    // Process additions
    for (const student of pendingAdditions.value) {
      const freshStudent = await studentStore.fetchStudent(student.id);
      const currentSlotIds = freshStudent.slots?.map((s) => s.id) || [];
      if (!currentSlotIds.includes(props.slotData.id)) {
        await studentStore.updateChild(student.id, {
          slots: [...currentSlotIds, props.slotData.id]
        });
      }
    }

    // Process removals
    for (const studentId of pendingRemovals.value) {
      const freshStudent = await studentStore.fetchStudent(studentId);
      const currentSlotIds =
        freshStudent.slots?.map((s) => s.id).filter((id) => id !== props.slotData!.id) || [];
      await studentStore.updateChild(studentId, { slots: currentSlotIds });
    }

    // Clear pending changes
    pendingAdditions.value = [];
    pendingRemovals.value = new Set();

    emit('refresh');
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to save student changes');
  } finally {
    savingStudents.value = false;
  }
};

const close = () => {
  emit('update:show', false);
};
</script>

<template>
  <Modal
    :open="show"
    :title="isEdit ? 'Edit Slot' : 'Add Slot'"
    :size="isEdit ? 'lg' : 'md'"
    @close="close"
  >
    <!-- Tabs (only show when editing) -->
    <div v-if="isEdit" class="flex border-b border-secondary-200 -mx-6 -mt-5 px-6 mb-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
        :class="
          activeTab === tab.id
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
        "
        @click="activeTab = tab.id as any"
      >
        <i :class="['fa-solid', tab.icon, 'text-xs']"></i>
        {{ tab.label }}
        <span
          v-if="tab.id === 'students'"
          class="ml-1 px-1.5 py-0.5 text-xs rounded-full"
          :class="
            activeTab === 'students'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-secondary-100 text-secondary-600'
          "
        >
          {{ currentStudents.length }}
        </span>
      </button>
    </div>

    <!-- Details Tab -->
    <form v-show="!isEdit || activeTab === 'details'" id="slot-form" @submit.prevent="onSubmit">
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

    <!-- Students Tab -->
    <div v-if="isEdit" v-show="activeTab === 'students'" class="space-y-4">
      <!-- Pending Changes Banner -->
      <div
        v-if="hasStudentChanges"
        class="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg"
      >
        <div class="flex items-center gap-2 text-warning-700">
          <i class="fa-solid fa-circle-info"></i>
          <span class="text-sm font-medium">You have unsaved changes</span>
        </div>
        <Button size="sm" :disabled="savingStudents" @click="saveStudentChanges">
          <i v-if="savingStudents" class="fa-solid fa-spinner fa-spin mr-1"></i>
          {{ savingStudents ? 'Saving...' : 'Save Changes' }}
        </Button>
      </div>

      <!-- Current Students -->
      <div>
        <h4 class="text-sm font-semibold text-secondary-700 mb-3">
          Students in this Slot ({{ currentStudents.length }})
        </h4>
        <div
          v-if="currentStudents.length === 0"
          class="text-sm text-secondary-500 py-6 text-center bg-secondary-50 rounded-lg"
        >
          <i class="fa-solid fa-users text-2xl mb-2 text-secondary-300"></i>
          <p>No students assigned to this slot yet</p>
        </div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="student in currentStudents"
            :key="student.id"
            class="flex items-center justify-between p-3 rounded-lg"
            :class="
              pendingAdditions.some((s) => s.id === student.id)
                ? 'bg-success-50 border border-success-200'
                : 'bg-secondary-50'
            "
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <i class="fa-solid fa-child text-primary-600 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-secondary-900 text-sm">
                  {{ student.firstName }} {{ student.lastName }}
                  <span
                    v-if="pendingAdditions.some((s) => s.id === student.id)"
                    class="text-success-600 text-xs ml-1"
                    >(new)</span
                  >
                </p>
                <p v-if="student.schoolYear" class="text-xs text-secondary-500">
                  {{ student.schoolYear }}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              :disabled="savingStudents"
              @click="removeStudent(student)"
            >
              <i class="fa-solid fa-xmark text-danger-500"></i>
            </Button>
          </div>
        </div>
      </div>

      <!-- Add Students -->
      <div class="border-t border-secondary-200 pt-4">
        <h4 class="text-sm font-semibold text-secondary-700 mb-3">Add Students</h4>

        <!-- Search -->
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Search students by name..."
          class="mb-3"
        />

        <!-- Available Students List -->
        <div
          v-if="availableStudents.length === 0"
          class="text-sm text-secondary-500 py-4 text-center bg-secondary-50 rounded-lg"
        >
          {{ searchQuery ? 'No matching students found' : 'All students are already in this slot' }}
        </div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="student in availableStudents"
            :key="student.id"
            class="flex items-center justify-between p-3 bg-white border border-secondary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center">
                <i class="fa-solid fa-child text-secondary-500 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-secondary-900 text-sm">
                  {{ student.firstName }} {{ student.lastName }}
                </p>
                <p v-if="student.schoolYear || student.status" class="text-xs text-secondary-500">
                  {{ [student.schoolYear, student.status].filter(Boolean).join(' • ') }}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              :disabled="savingStudents"
              @click="addStudent(student)"
            >
              <i class="fa-solid fa-plus mr-1"></i>
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="outline" @click="close">Cancel</Button>
      <Button
        v-if="!isEdit || activeTab === 'details'"
        type="submit"
        form="slot-form"
        :disabled="loading"
      >
        {{ loading ? 'Saving...' : isEdit ? 'Update' : 'Create' }}
      </Button>
    </template>
  </Modal>
</template>
