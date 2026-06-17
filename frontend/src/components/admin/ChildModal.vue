<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { Modal, Input, Select, Checkbox, Button, Textarea, Spinner } from '@/components/ui';
import type { Student, ChildStatus, Subject, Parent, School } from '@/types';
import type { Slot } from '@/types/slot';
import type { SelectOption } from '@/components/ui/Select.vue';
import { useStudentStore, useSlotStore } from '@/stores';

const props = withDefaults(
  defineProps<{
    show: boolean;
    loading?: boolean;
    child?: Student | null;
  }>(),
  {
    show: false,
    loading: false,
    child: null
  }
);

const emit = defineEmits(['update:show', 'submit', 'refresh', 'delete']);

const studentStore = useStudentStore();
const slotStore = useSlotStore();

const isEdit = ref(false);
const activeTab = ref<'basic' | 'enrollment' | 'slots' | 'parents' | 'address' | 'danger'>('basic');
const subjects = ref<Subject[]>([]);
const availableSlots = ref<Slot[]>([]);
const schools = ref<School[]>([]);
const removingParentId = ref<number | null>(null);

// Parent management
const showAddParentForm = ref(false);
const addingParent = ref(false);
const newParent = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: ''
});
const parentErrors = ref({
  firstName: '',
  lastName: '',
  phoneNumber: ''
});

const formData = reactive({
  // Basic info
  firstName: '',
  lastName: '',
  status: 'New' as ChildStatus,
  gender: '' as 'Male' | 'Female' | 'Others' | '',
  schoolYear: '',
  isEarlyLearner: false,
  // Address
  houseNumber: '',
  streetName: '',
  city: '',
  postcode: '',
  // Payment
  paymentDate: '' as string | number,
  paymentAmount: '' as string | number,
  isDue: false,
  dueAmount: '' as string | number,
  // Dates
  enrollmentDate: '',
  enquiryDate: '',
  // Other
  formType: '',
  referralCode: '',
  notes: '',
  // Relations
  subjects: [] as number[],
  slots: [] as number[],
  school: '' as number | ''
});

const errors = ref({
  firstName: ''
});

const statusOptions: SelectOption[] = [
  { value: 'New', label: 'New' },
  { value: 'No Further Contact', label: 'No Further Contact' },
  { value: 'Future Follow Up', label: 'Future Follow Up' },
  { value: 'Enrolment meeting no show', label: 'Enrolment meeting no show' },
  {
    value: "Attended enrolment meeting but didn't enrol",
    label: "Attended enrolment meeting but didn't enrol"
  },
  { value: 'Send to KSiS', label: 'Send to KSiS' },
  { value: 'Send to KSiS (Free Trial)', label: 'Send to KSiS (Free Trial)' },
  { value: 'Exited', label: 'Exited' }
];

const genderOptions: SelectOption[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Others', label: 'Others' }
];

const paymentDateOptions: SelectOption[] = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`
}));

const schoolOptions = computed<SelectOption[]>(() =>
  schools.value.map((s) => ({
    value: s.id,
    label: s.city ? `${s.name} (${s.city})` : s.name
  }))
);

const dayOrder: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const sortedSlots = computed(() => {
  return [...availableSlots.value].sort((a, b) => {
    const dayA = dayOrder[a.day] || 8;
    const dayB = dayOrder[b.day] || 8;
    if (dayA !== dayB) return dayA - dayB;
    return (a.name || '').localeCompare(b.name || '');
  });
});

const tabs = computed(() => {
  const list = [
    { id: 'basic', label: 'Basic Info', icon: 'fa-user' },
    { id: 'enrollment', label: 'Enrolment & Subjects', icon: 'fa-calendar' },
    { id: 'slots', label: 'Slots', icon: 'fa-clock' },
    { id: 'parents', label: 'Parents', icon: 'fa-users' },
    { id: 'address', label: 'Address', icon: 'fa-location-dot' }
  ];
  if (isEdit.value) {
    list.push({ id: 'danger', label: 'Delete', icon: 'fa-trash' });
  }
  return list;
});

const currentParents = computed(() => props.child?.parents || []);

const resetForm = () => {
  formData.firstName = '';
  formData.lastName = '';
  formData.status = 'New';
  formData.gender = '';
  formData.schoolYear = '';
  formData.isEarlyLearner = false;
  formData.houseNumber = '';
  formData.streetName = '';
  formData.city = '';
  formData.postcode = '';
  formData.paymentDate = '';
  formData.paymentAmount = '';
  formData.isDue = false;
  formData.dueAmount = '';
  formData.enrollmentDate = '';
  formData.enquiryDate = '';
  formData.formType = '';
  formData.referralCode = '';
  formData.notes = '';
  formData.subjects = [];
  formData.slots = [];
  formData.school = '';
  errors.value = { firstName: '' };
  activeTab.value = 'basic';
  resetParentForm();
};

const resetParentForm = () => {
  newParent.firstName = '';
  newParent.lastName = '';
  newParent.email = '';
  newParent.phoneNumber = '';
  parentErrors.value = { firstName: '', lastName: '', phoneNumber: '' };
  showAddParentForm.value = false;
};

const loadFormData = () => {
  if (props.child) {
    isEdit.value = true;
    formData.firstName = props.child.firstName || '';
    formData.lastName = props.child.lastName || '';
    formData.status = (props.child.status as ChildStatus) || 'New';
    formData.gender = props.child.gender || '';
    formData.schoolYear = props.child.schoolYear || '';
    formData.isEarlyLearner = props.child.isEarlyLearner || false;
    formData.houseNumber = props.child.houseNumber || '';
    formData.streetName = props.child.streetName || '';
    formData.city = props.child.city || '';
    formData.postcode = props.child.postcode || '';
    formData.paymentDate = props.child.paymentDate || '';
    formData.paymentAmount = props.child.paymentAmount || '';
    formData.isDue = props.child.isDue || false;
    formData.dueAmount = props.child.dueAmount || '';
    formData.enrollmentDate = props.child.enrollmentDate?.split('T')[0] || '';
    formData.enquiryDate = props.child.enquiryDate?.split('T')[0] || '';
    formData.formType = props.child.formType || '';
    formData.referralCode = props.child.referralCode || '';
    formData.notes = props.child.notes || '';
    formData.subjects = props.child.subjects?.map((s) => s.id) || [];
    formData.slots = props.child.slots?.map((s) => s.id) || [];
    formData.school = props.child.school || '';
  } else {
    isEdit.value = false;
    resetForm();
  }
};

watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      loadFormData();
      // Fetch subjects, slots, and schools
      try {
        const [subjectsData, slotsData, schoolsData] = await Promise.all([
          studentStore.fetchSubjects(),
          studentStore.fetchSlots(),
          studentStore.fetchSchools()
        ]);
        subjects.value = subjectsData;
        availableSlots.value = slotsData;
        schools.value = schoolsData;
      } catch (e) {
        // If fetch fails, continue with empty arrays
        console.warn('Failed to fetch data:', e);
      }
    }
  }
);

watch(
  () => formData.isDue,
  (val) => {
    if (!val) {
      formData.dueAmount = '';
    }
  }
);

const validate = () => {
  let isValid = true;
  errors.value = { firstName: '' };

  if (!formData.firstName.trim()) {
    errors.value.firstName = 'First name is required';
    isValid = false;
    activeTab.value = 'basic';
  }

  return isValid;
};

const validateParent = () => {
  let isValid = true;
  parentErrors.value = { firstName: '', lastName: '', phoneNumber: '' };

  if (!newParent.firstName.trim()) {
    parentErrors.value.firstName = 'First name is required';
    isValid = false;
  }
  if (!newParent.lastName.trim()) {
    parentErrors.value.lastName = 'Last name is required';
    isValid = false;
  }
  if (!newParent.phoneNumber.trim()) {
    parentErrors.value.phoneNumber = 'Phone number is required';
    isValid = false;
  } else if (!/^\d{10,}$/.test(newParent.phoneNumber.replace(/\D/g, ''))) {
    parentErrors.value.phoneNumber = 'Please enter a valid phone number (at least 10 digits)';
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
    status: formData.status,
    isEarlyLearner: formData.isEarlyLearner,
    subjects: formData.subjects,
    slots: formData.slots
  };

  if (formData.gender) payload.gender = formData.gender;
  if (formData.schoolYear) payload.schoolYear = formData.schoolYear;
  if (formData.houseNumber) payload.houseNumber = formData.houseNumber.trim();
  if (formData.streetName) payload.streetName = formData.streetName.trim();
  if (formData.city) payload.city = formData.city.trim();
  if (formData.postcode) payload.postcode = formData.postcode.trim();
  if (formData.paymentDate) payload.paymentDate = Number(formData.paymentDate);
  if (formData.paymentAmount) payload.paymentAmount = Number(formData.paymentAmount);
  payload.isDue = formData.isDue;
  payload.dueAmount = formData.dueAmount ? Number(formData.dueAmount) : null;
  if (formData.enrollmentDate) payload.enrollmentDate = formData.enrollmentDate;
  if (formData.enquiryDate) payload.enquiryDate = formData.enquiryDate;
  if (formData.formType) payload.formType = formData.formType.trim();
  if (formData.referralCode) payload.referralCode = formData.referralCode.trim();
  if (formData.notes) payload.notes = formData.notes.trim();
  if (formData.school) {
    payload.school = Number(formData.school);
  } else {
    payload.school = null;
  }

  emit('submit', payload);
};

const addParent = async () => {
  if (!validateParent() || !props.child) return;

  try {
    addingParent.value = true;
    await studentStore.addParent({
      firstName: newParent.firstName.trim(),
      lastName: newParent.lastName.trim(),
      email: newParent.email.trim() || undefined,
      phoneNumber: newParent.phoneNumber.trim(),
      child: props.child.id
    });
    resetParentForm();
    emit('refresh');
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to add parent');
  } finally {
    addingParent.value = false;
  }
};

const removeParent = async (parent: Parent) => {
  if (!props.child) return;
  if (!confirm(`Remove ${parent.firstName} ${parent.lastName} as a parent?`)) return;

  try {
    removingParentId.value = parent.id;

    await studentStore.removeParent(props.child.id, parent.id);

    emit('refresh');
   
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to remove parent');
  } finally {
     setTimeout(() => {
      removingParentId.value = null
      }, 1000)
  }
};

const toggleSubject = (subjectId: number) => {
  const index = formData.subjects.indexOf(subjectId);
  if (index === -1) {
    formData.subjects.push(subjectId);
  } else {
    formData.subjects.splice(index, 1);
  }
};

const toggleSlot = (slotId: number) => {
  const index = formData.slots.indexOf(slotId);
  if (index === -1) {
    formData.slots.push(slotId);
  } else {
    formData.slots.splice(index, 1);
  }
};

const close = () => {
  emit('update:show', false);
};
</script>

<template>
  <Modal :open="show" :title="isEdit ? 'Edit Student' : 'Add Student'" size="xl" @close="close">
    <!-- Tabs -->
    <div class="flex border-b border-secondary-200 -mx-6 -mt-5 px-6 mb-4 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
        :class="
          activeTab === tab.id
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
        "
        @click="activeTab = tab.id as any"
      >
        <i :class="['fa-solid', tab.icon, 'text-xs']"></i>
        {{ tab.label }}
      </button>
    </div>

    <form id="child-form" @submit.prevent="onSubmit">
      <!-- Basic Info Tab -->
      <div v-show="activeTab === 'basic'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            v-model="formData.status"
            :options="statusOptions"
            label="Status"
            placeholder="Select status"
          />
          <Select
            v-model="formData.gender"
            :options="genderOptions"
            label="Gender"
            placeholder="Select gender"
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="formData.schoolYear"
            type="text"
            placeholder="e.g. Year 5, Reception"
            label="School Year"
          />
          <Select
            v-model="formData.school"
            :options="schoolOptions"
            label="School"
            placeholder="Select school"
          />
        </div>
        <div>
          <Checkbox v-model="formData.isEarlyLearner" label="Early Learner" />
        </div>
        <div class="border-t border-secondary-200 pt-4 mt-2">
          <div class="mb-3">
            <Checkbox v-model="formData.isDue" label="Payment Due" />
          </div>
          <Input
            v-model="formData.dueAmount"
            type="number"
            placeholder="0.00"
            label="Due Amount"
            :disabled="!formData.isDue"
          />
        </div>
      </div>

      <!-- Address Tab -->
      <div v-show="activeTab === 'address'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="formData.houseNumber"
            type="text"
            placeholder="House Number"
            label="House Number"
          />
          <Input
            v-model="formData.streetName"
            type="text"
            placeholder="Street Name"
            label="Street Name"
          />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input v-model="formData.city" type="text" placeholder="City" label="City" />
          <Input v-model="formData.postcode" type="text" placeholder="Postcode" label="Postcode" />
        </div>
      </div>

      <!-- Enrolment & Subjects Tab -->
      <div v-show="activeTab === 'enrollment'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input v-model="formData.enquiryDate" type="date" label="Enquiry Date" />
          <Input v-model="formData.enrollmentDate" type="date" label="Enrolment Date" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            v-model="formData.formType"
            type="text"
            placeholder="Form Type"
            label="Form Type"
          />
          <Input
            v-model="formData.referralCode"
            type="text"
            placeholder="Referral Code"
            label="Referral Code"
          />
        </div>
        <div class="border-t border-secondary-200 pt-4 mt-4">
          <h4 class="text-sm font-semibold text-secondary-700 mb-3">Payment Details</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              v-model="formData.paymentDate"
              :options="paymentDateOptions"
              label="Payment Day (of month)"
              placeholder="Select day"
            />
            <Input
              v-model="formData.paymentAmount"
              type="number"
              placeholder="0.00"
              label="Payment Amount"
            />
          </div>
        </div>
        <Textarea
          v-model="formData.notes"
          label="Notes"
          placeholder="Additional notes..."
          :rows="3"
        />

        <!-- Subjects -->
        <div class="border-t border-secondary-200 pt-4">
          <h4 class="text-sm font-semibold text-secondary-700 mb-3">Subjects</h4>
          <div
            v-if="subjects.length === 0"
            class="text-sm text-secondary-500 py-4 text-center bg-secondary-50 rounded-lg"
          >
            No subjects available
          </div>
          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="subject in subjects"
              :key="subject.id"
              class="flex items-center p-3 rounded-lg border cursor-pointer transition-colors"
              :class="
                formData.subjects.includes(subject.id)
                  ? 'bg-primary-50 border-primary-300'
                  : 'bg-white border-secondary-200 hover:border-secondary-300'
              "
              @click="toggleSubject(subject.id)"
            >
              <Checkbox
                :model-value="formData.subjects.includes(subject.id)"
                :label="subject.name"
                @click.stop
                @update:model-value="toggleSubject(subject.id)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Parents Tab -->
      <div v-show="activeTab === 'parents'" class="space-y-4">
        <div v-if="!isEdit" class="text-center py-8 text-secondary-500">
          <i class="fa-solid fa-info-circle text-2xl mb-2"></i>
          <p>Save the student first, then you can add parents.</p>
        </div>

        <template v-else>
          <!-- Current Parents List -->
          <div class="space-y-2">
            <h4 class="text-sm font-semibold text-secondary-700">Current Parents/Guardians</h4>
            <div
              v-if="currentParents.length === 0"
              class="text-sm text-secondary-500 py-4 text-center bg-secondary-50 rounded-lg"
            >
              No parents added yet
            </div>
            <div
              v-for="parent in currentParents"
              :key="parent.id"
              class="flex items-center justify-between p-3 bg-secondary-50 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <i class="fa-solid fa-user text-primary-600"></i>
                </div>
                <div>
                  <p class="font-medium text-secondary-900">
                    {{ parent.firstName }} {{ parent.lastName }}
                  </p>
                  <p class="text-xs text-secondary-500">
                    {{ parent.contactNumber || parent.email || 'No contact info' }}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                :disabled="removingParentId === parent.id"
                @click="removeParent(parent)"
              >
                <Spinner v-if="removingParentId === parent.id" />

                <i
                  v-else
                  class="fa-solid fa-trash text-danger-500"
                ></i>
                </Button>
            </div>
          </div>

          <!-- Add Parent Form -->
          <div class="border-t border-secondary-200 pt-4">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-semibold text-secondary-700">Add New Parent</h4>
              <Button
                v-if="!showAddParentForm"
                size="sm"
                variant="outline"
                @click="showAddParentForm = true"
              >
                <i class="fa-solid fa-plus mr-1"></i>
                Add Parent
              </Button>
            </div>

            <div v-if="showAddParentForm" class="space-y-3 p-4 bg-secondary-50 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  v-model="newParent.firstName"
                  type="text"
                  placeholder="First Name"
                  label="First Name *"
                  :error="parentErrors.firstName"
                />
                <Input
                  v-model="newParent.lastName"
                  type="text"
                  placeholder="Last Name"
                  label="Last Name *"
                  :error="parentErrors.lastName"
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  v-model="newParent.email"
                  type="email"
                  placeholder="Email (Optional)"
                  label="Email"
                />
                <Input
                  v-model="newParent.phoneNumber"
                  type="tel"
                  placeholder="Phone Number"
                  label="Phone Number *"
                  :error="parentErrors.phoneNumber"
                />
              </div>
              <div class="flex justify-end gap-2">
                <Button size="sm" variant="ghost" @click="resetParentForm"> Cancel </Button>
                <Button size="sm" :disabled="addingParent" @click="addParent">
                  {{ addingParent ? 'Adding...' : 'Add Parent' }}
                </Button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Slots Tab -->
      <div v-show="activeTab === 'slots'" class="space-y-4">
        <h4 class="text-sm font-semibold text-secondary-700 mb-3">Class Slots</h4>
        <div
          v-if="sortedSlots.length === 0"
          class="text-sm text-secondary-500 py-4 text-center bg-secondary-50 rounded-lg"
        >
          No slots available
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="slot in sortedSlots"
            :key="slot.id"
            class="flex items-center p-3 rounded-lg border cursor-pointer transition-colors"
            :class="
              formData.slots.includes(slot.id)
                ? 'bg-primary-50 border-primary-300'
                : 'bg-white border-secondary-200 hover:border-secondary-300'
            "
            @click="toggleSlot(slot.id)"
          >
            <div class="flex items-center gap-3 flex-1">
              <Checkbox
                :model-value="formData.slots.includes(slot.id)"
                @click.stop
                @update:model-value="toggleSlot(slot.id)"
              />
              <div>
                <p class="font-medium text-secondary-900">{{ slot.name }}</p>
                <p class="text-xs text-secondary-500">
                  {{ slot.day }} {{ slot.startTime }} - {{ slot.endTime }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone Tab -->
      <div v-if="isEdit" v-show="activeTab === 'danger'" class="space-y-4">
        <div class="rounded-lg border border-danger-200 bg-danger-50 p-5">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center shrink-0">
              <i class="fa-solid fa-trash text-danger-600"></i>
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-danger-900">Delete Student</h4>
              <p class="text-sm text-danger-700 mt-1">
                Permanently delete this student and all related data including attendance records. This action cannot be undone.
              </p>
              <Button
                variant="danger"
                size="sm"
                class="mt-3"
                @click="emit('delete')"
              >
                <i class="fa-solid fa-trash mr-1"></i>
                Delete Student
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <Button variant="outline" @click="close">Cancel</Button>
      <Button type="submit" form="child-form" :disabled="loading">
        {{ loading ? 'Saving...' : isEdit ? 'Update' : 'Create' }}
      </Button>
    </template>
  </Modal>
</template>
