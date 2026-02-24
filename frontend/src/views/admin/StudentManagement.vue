<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Input, Button, Table, Badge, Pagination, Select } from '@/components/ui';
import type { TableColumn } from '@/components/ui/Table.vue';
import type { SelectOption } from '@/components/ui/Select.vue';
import type { Student, ChildStatus } from '@/types';

import ChildModal from '@/components/admin/ChildModal.vue';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal.vue';
import { useStudentStore } from '@/stores';

const studentStore = useStudentStore();

const search = ref('');
const statusFilter = ref('');
const showChildModal = ref(false);
const showDeleteModal = ref(false);
const selectedChild = ref<Student | null>(null);
const saving = ref(false);
const deleting = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = 50;

// Debounce timer
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

const columns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'schoolYear', header: 'Year', hideOnMobile: true },
  { key: 'enrollmentDate', header: 'Enrolment', hideOnMobile: true },
  { key: 'actions', header: 'Actions', hideOnMobile: true }
];

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

const totalItems = computed(() => studentStore.paginationMeta?.total ?? 0);
const totalPages = computed(() => studentStore.paginationMeta?.totalPages ?? 0);

const loadStudents = () => {
  studentStore.fetchStudentsPaginated({
    page: currentPage.value,
    pageSize,
    search: search.value.trim() || undefined,
    status: statusFilter.value || undefined,
  });
};

const formatDate = (date: string | undefined) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const tableData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize;
  return studentStore.paginatedStudents.map((child, index) => ({
    ...child,
    index: startIndex + index + 1,
    name: `${child.firstName || ''} ${child.lastName || ''}`.trim() || '-',
    enrollmentDateFormatted: formatDate(child.enrollmentDate)
  }));
});

// Debounced search watcher
watch(search, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    loadStudents();
  }, 500);
});

// Immediate reload on status filter change
watch(statusFilter, () => {
  currentPage.value = 1;
  loadStudents();
});

// Immediate reload on page change
watch(currentPage, () => {
  loadStudents();
});

const getStatusVariant = (
  status: string
): 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
  const s = status?.toLowerCase() || '';
  if (s.includes('ksis') || s === 'send to ksis' || s === 'send to ksis (free trial)') {
    return 'success';
  }
  if (s === 'exited' || s === 'no further contact') {
    return 'danger';
  }
  if (s === 'future follow up' || s.includes('meeting')) {
    return 'warning';
  }
  if (s === 'new') {
    return 'info';
  }
  return 'neutral';
};

const getGenderIcon = (gender: string | null) => {
  if (gender === 'Male') return { icon: 'fa-mars', color: 'text-blue-500', bg: 'bg-blue-100' };
  if (gender === 'Female') return { icon: 'fa-venus', color: 'text-pink-500', bg: 'bg-pink-100' };
  return { icon: 'fa-child', color: 'text-secondary-500', bg: 'bg-secondary-100' };
};

const openCreateModal = () => {
  selectedChild.value = null;
  showChildModal.value = true;
};

const openEditModal = (child: Student) => {
  selectedChild.value = child;
  showChildModal.value = true;
};

const handleSubmit = async (payload: any) => {
  try {
    saving.value = true;
    if (selectedChild.value) {
      await studentStore.updateChild(selectedChild.value.id, payload);
    } else {
      await studentStore.createChild(payload);
    }
    showChildModal.value = false;
    selectedChild.value = null;
    loadStudents();
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to save student');
  } finally {
    saving.value = false;
  }
};

const handleDeleteFromModal = () => {
  showChildModal.value = false;
  showDeleteModal.value = true;
};

const handleDelete = async () => {
  if (!selectedChild.value) return;

  try {
    deleting.value = true;
    await studentStore.deleteChild(selectedChild.value.id);
    showDeleteModal.value = false;
    selectedChild.value = null;
    loadStudents();
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to delete student');
  } finally {
    deleting.value = false;
  }
};

const handleRefresh = async () => {
  if (selectedChild.value) {
    const updatedChild = await studentStore.fetchStudent(selectedChild.value.id);
    selectedChild.value = { ...updatedChild, qrCode: selectedChild.value.qrCode };
  }
};

onMounted(() => {
  loadStudents();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-user-graduate text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Student Management</h2>
          <p class="text-sm text-secondary-500">Manage students and enrolments</p>
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden">
      <div
        class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200"
      >
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <i class="fa-solid fa-user-graduate text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">All Students</h3>
              <p class="text-xs text-primary-600">{{ totalItems }} total</p>
            </div>
          </div>
          <Button @click="openCreateModal">
            <i class="fa-solid fa-plus mr-1"></i>
            Add Student
          </Button>
        </div>
      </div>

      <div class="p-5">
        <!-- Search & Filter -->
        <div class="bg-secondary-50 rounded-xl border border-secondary-200 p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="fa-solid fa-magnifying-glass text-primary-600"></i>
            <label class="text-sm font-semibold text-secondary-700">Search & Filter</label>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input v-model="search" type="search" placeholder="Search by name..." />
            <Select
              v-model="statusFilter"
              :options="statusOptions"
              placeholder="All statuses"
            />
          </div>
        </div>

        <!-- Table -->
        <Table
          :columns="columns"
          :data="tableData"
          :loading="studentStore.loading"
          header-class="bg-white border-b border-secondary-200"
          empty-text="No students found"
        >
          <template #cell-index="{ value }">
            <span class="text-secondary-400 text-xs font-medium">{{ value }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                :class="getGenderIcon(row.gender).bg"
              >
                <i
                  :class="['fa-solid', getGenderIcon(row.gender).icon, getGenderIcon(row.gender).color, 'text-xs']"
                ></i>
              </div>
              <div>
                <span class="font-semibold text-secondary-900">{{ row.name }}</span>
                <span v-if="row.isEarlyLearner" class="ml-2 text-xs text-primary-500"
                  >(Early Learner)</span
                >
              </div>
            </div>
          </template>
          <template #cell-status="{ row }">
            <Badge :variant="getStatusVariant(row.status)">
              {{ row.status || '-' }}
            </Badge>
          </template>
          <template #cell-schoolYear="{ row }">
            <span class="text-secondary-600">{{ row.schoolYear || '-' }}</span>
          </template>
          <template #cell-enrollmentDate="{ row }">
            <span class="text-secondary-600">{{ row.enrollmentDateFormatted }}</span>
          </template>
          <template #cell-actions="{ row }">
            <Button size="sm" variant="ghost" @click="openEditModal(row)">
              <i class="fa-solid fa-pen"></i>
            </Button>
          </template>

          <!-- Mobile card view -->
          <template #mobile-card="{ row }">
            <div class="flex items-center justify-between py-3 border-b border-secondary-100 gap-2">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  :class="getGenderIcon(row.gender).bg"
                >
                  <i
                    :class="['fa-solid', getGenderIcon(row.gender).icon, getGenderIcon(row.gender).color]"
                  ></i>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-secondary-900 truncate">{{ row.name }}</p>
                  <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge :variant="getStatusVariant(row.status)" class="truncate">
                      {{ row.status || '-' }}
                    </Badge>
                    <Badge v-if="row.enrollmentDate" variant="neutral" class="text-xs truncate">
                      {{ row.enrollmentDateFormatted }}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" class="shrink-0" @click="openEditModal(row)">
                <i class="fa-solid fa-pen"></i>
              </Button>
            </div>
          </template>

          <!-- Pagination -->
          <template #footer>
            <Pagination
              v-model:currentPage="currentPage"
              :totalPages="totalPages"
              :totalItems="totalItems"
              :pageSize="pageSize"
            />
          </template>
        </Table>
      </div>
    </div>

    <!-- Child Modal -->
    <ChildModal
      v-model:show="showChildModal"
      :child="selectedChild"
      :loading="saving"
      @submit="handleSubmit"
      @refresh="handleRefresh"
      @delete="handleDeleteFromModal"
    />

    <!-- Delete Confirm Modal -->
    <DeleteConfirmModal
      v-model:show="showDeleteModal"
      :loading="deleting"
      title="Delete Student"
      message="Are you sure you want to delete this student? All related data including attendance records will be deleted."
      :item-name="selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ''"
      @confirm="handleDelete"
    />
  </div>
</template>
