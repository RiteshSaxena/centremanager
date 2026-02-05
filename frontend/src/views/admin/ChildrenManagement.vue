<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Input, Button, Table, Badge, Pagination } from '@/components/ui';
import type { TableColumn } from '@/components/ui/Table.vue';
import type { Student } from '@/types';

import ChildModal from '@/components/admin/ChildModal.vue';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal.vue';
import { useStudentStore } from '@/stores';

const studentStore = useStudentStore();

const search = ref('');
const showChildModal = ref(false);
const showDeleteModal = ref(false);
const selectedChild = ref<Student | null>(null);
const saving = ref(false);
const deleting = ref(false);

// Pagination
const currentPage = ref(1);
const pageSize = 50;

const columns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'schoolYear', header: 'Year', hideOnMobile: true },
  { key: 'gender', header: 'Gender', hideOnMobile: true },
  { key: 'actions', header: 'Actions', hideOnMobile: true }
];

const filteredChildren = computed(() => {
  let children = studentStore.students;
  if (search.value.trim()) {
    const term = search.value.toLowerCase();
    children = children.filter(
      (c) =>
        c.firstName?.toLowerCase().includes(term) ||
        c.lastName?.toLowerCase().includes(term) ||
        c.status?.toLowerCase().includes(term)
    );
  }
  return children;
});

const totalPages = computed(() => Math.ceil(filteredChildren.value.length / pageSize));

const paginatedChildren = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredChildren.value.slice(start, end);
});

const tableData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize;
  return paginatedChildren.value.map((child, index) => ({
    ...child,
    index: startIndex + index + 1,
    name: `${child.firstName || ''} ${child.lastName || ''}`.trim() || '-'
  }));
});

// Reset page when search changes
watch(search, () => {
  currentPage.value = 1;
});

const getStatusVariant = (status: string): 'success' | 'danger' | 'warning' | 'info' | 'neutral' => {
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

const openCreateModal = () => {
  selectedChild.value = null;
  showChildModal.value = true;
};

const openEditModal = (child: Student) => {
  selectedChild.value = child;
  showChildModal.value = true;
};

const openDeleteModal = (child: Student) => {
  selectedChild.value = child;
  showDeleteModal.value = true;
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
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to save child');
  } finally {
    saving.value = false;
  }
};

const handleDelete = async () => {
  if (!selectedChild.value) return;

  try {
    deleting.value = true;
    await studentStore.deleteChild(selectedChild.value.id);
    showDeleteModal.value = false;
    selectedChild.value = null;
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to delete child');
  } finally {
    deleting.value = false;
  }
};

const handleRefresh = async () => {
  // Refresh selected child data after parent changes
  if (selectedChild.value) {
    const updatedChild = await studentStore.fetchStudent(selectedChild.value.id);
    selectedChild.value = { ...updatedChild, qrCode: selectedChild.value.qrCode };
  }
};

onMounted(() => {
  studentStore.fetchStudents();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-children text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Children Management</h2>
          <p class="text-sm text-secondary-500">Manage students and children</p>
        </div>
      </div>
    </div>

    <!-- Content Card -->
    <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden">
      <div class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <i class="fa-solid fa-user-graduate text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">All Children</h3>
              <p class="text-xs text-primary-600">{{ filteredChildren.length }} total</p>
            </div>
          </div>
          <Button @click="openCreateModal">
            <i class="fa-solid fa-plus mr-1"></i>
            Add Child
          </Button>
        </div>
      </div>

      <div class="p-5">
        <!-- Search -->
        <div class="bg-secondary-50 rounded-xl border border-secondary-200 p-4 mb-4">
          <div class="flex items-center gap-2 mb-3">
            <i class="fa-solid fa-magnifying-glass text-primary-600"></i>
            <label class="text-sm font-semibold text-secondary-700">Search Children</label>
          </div>
          <Input v-model="search" type="search" placeholder="Search by name or status..." />
        </div>

        <!-- Table -->
        <Table
          :columns="columns"
          :data="tableData"
          :loading="studentStore.loading"
          header-class="bg-white border-b border-secondary-200"
          empty-text="No children found"
        >
          <template #cell-index="{ value }">
            <span class="text-secondary-400 text-xs font-medium">{{ value }}</span>
          </template>
          <template #cell-name="{ row }">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-child text-primary-600 text-xs"></i>
              </div>
              <div>
                <span class="font-semibold text-secondary-900">{{ row.name }}</span>
                <span v-if="row.isEarlyLearner" class="ml-2 text-xs text-primary-500">(Early Learner)</span>
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
          <template #cell-gender="{ row }">
            <span class="text-secondary-600">{{ row.gender || '-' }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div class="flex items-center gap-2">
              <Button size="sm" variant="ghost" @click="openEditModal(row)">
                <i class="fa-solid fa-pen"></i>
              </Button>
              <Button size="sm" variant="ghost" @click="openDeleteModal(row)">
                <i class="fa-solid fa-trash text-danger-500"></i>
              </Button>
            </div>
          </template>

          <!-- Mobile card view -->
          <template #mobile-card="{ row }">
            <div class="flex items-center justify-between py-3 border-b border-secondary-100">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <i class="fa-solid fa-child text-primary-600"></i>
                </div>
                <div>
                  <p class="font-semibold text-secondary-900">{{ row.name }}</p>
                  <p class="text-xs text-secondary-500">
                    {{ row.schoolYear || 'No year' }} | {{ row.gender || 'No gender' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="getStatusVariant(row.status)" class="mr-2">
                  {{ row.status || '-' }}
                </Badge>
                <Button size="sm" variant="ghost" @click="openEditModal(row)">
                  <i class="fa-solid fa-pen"></i>
                </Button>
                <Button size="sm" variant="ghost" @click="openDeleteModal(row)">
                  <i class="fa-solid fa-trash text-danger-500"></i>
                </Button>
              </div>
            </div>
          </template>

          <!-- Pagination -->
          <template #footer>
            <Pagination
              v-model:currentPage="currentPage"
              :totalPages="totalPages"
              :totalItems="filteredChildren.length"
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
    />

    <!-- Delete Confirm Modal -->
    <DeleteConfirmModal
      v-model:show="showDeleteModal"
      :loading="deleting"
      title="Delete Child"
      message="Are you sure you want to delete this child? All related data including attendance records will be deleted."
      :item-name="selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : ''"
      @confirm="handleDelete"
    />
  </div>
</template>
