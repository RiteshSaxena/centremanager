<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash';
import type { SearchResult } from '@/types';

import { Input, Button, Table, Pagination, Select } from '@/components/ui';
import type { TableColumn } from '@/components/ui/Table.vue';
import type { SelectOption } from '@/components/ui/Select.vue';
import SearchResults from '@/components/SearchResults.vue';
import AddPaymentModal from '@/components/AddPaymentModal.vue';
import ChildModal from '@/components/admin/ChildModal.vue';
import type { Student } from '@/types';

import { useSearchStore, useStudentStore, useUserStore } from '@/stores';

const searchStore = useSearchStore();
const studentStore = useStudentStore();
const userStoreInstance = useUserStore();

const isAdmin = computed(() => userStoreInstance.user?.type === 'admin');

const search = ref<string>('');
const dueSearch = ref<string>('');
const searchedId = ref<number | null>(null);
const studentId = ref<number | null>(null);
const selectedName = ref<string>('');
const selectedAmount = ref<string | number>('');
const paymentHistory = ref<any[]>([]);
const loading = ref(false);
const showAddPaymentModal = ref(false);
const editingPayment = ref<any | null>(null);
const showChildModal = ref(false);
const selectedStudent = ref<Student | null>(null);
const savingStudent = ref(false);
const timeRange = ref('3');

const timeRangeOptions: SelectOption[] = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '', label: 'All time' }
];

const getFromDate = (months: string) => {
  if (!months) return undefined;
  const d = new Date();
  d.setMonth(d.getMonth() - parseInt(months));
  return d.toISOString().split('T')[0];
};

// Pagination state
const currentPage = ref(1);
const pageSize = 50; // Lowered from 25 to make pagination easier to test

// Table column definitions
const dueColumns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'dueAmount', header: 'Due Amount' },
  { key: 'action', header: 'Action', hideOnMobile: true }
];

const historyColumns = computed<TableColumn[]>(() => {
  const cols: TableColumn[] = [
    { key: 'index', header: '#', width: '60px' },
    { key: 'name', header: 'Name' },
    { key: 'amount', header: 'Amount' },
    { key: 'date', header: 'Date' },
    { key: 'notes', header: 'Notes', hideOnMobile: true }
  ];
  if (isAdmin.value) {
    cols.push({ key: 'action', header: '', width: '80px', hideOnMobile: true });
  }
  return cols;
});

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value, true);
}, 500);

const dueStudents = computed(() => {
  return studentStore.books.dueStudents as any[];
});

// Transform due students for table display with search filter
const dueTableData = computed(() => {
  let filteredStudents = dueStudents.value;

  // Apply search filter
  if (dueSearch.value.trim()) {
    const searchTerm = dueSearch.value.trim().toLowerCase();
    filteredStudents = filteredStudents.filter((student) => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
  }

  return filteredStudents.map((student, index) => ({
    ...student,
    index: index + 1,
    name: `${student.firstName} ${student.lastName}`,
    dueAmountFormatted: student.dueAmount > 1 ? `£${student.dueAmount}` : '-'
  }));
});

const paginatedHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return paymentHistory.value.slice(start, end);
});

// Transform payment history for table display
const historyTableData = computed(() => {
  return paginatedHistory.value.map((payment, index) => ({
    ...payment,
    index: (currentPage.value - 1) * pageSize + index + 1,
    name: `${payment.child?.firstName || ''} ${payment.child?.lastName || ''}`,
    amountFormatted: `£${payment.amount}`,
    date: payment.paymentDate,
    notesDisplay: payment.notes || '-'
  }));
});

const totalPages = computed(() => Math.ceil(paymentHistory.value.length / pageSize));

const clearSearch = () => {
  search.value = '';
  searchStore.clearResults();
};

const clearSelected = () => {
  studentId.value = null;
  selectedName.value = '';
  searchedId.value = null;
  currentPage.value = 1;
  fetchPayments();
};

watch(search, () => {
  if (search.value.trim().length) {
    debouncedSearch(search.value.trim());
  } else {
    clearSearch();
  }
});

const onSelectFromSearch = (item: SearchResult) => {
  studentId.value = null;
  selectedName.value = '';
  searchedId.value = null;
  selectedAmount.value = '';
  if (item.type === 'student') {
    studentId.value = item.id;
    searchedId.value = item.id;
    selectedName.value = `${item.firstName} ${item.lastName}`;
    currentPage.value = 1;
    fetchPayments(item.id);
  }
  clearSearch();
};

const fetchPayments = async (childId?: number) => {
  try {
    loading.value = true;
    paymentHistory.value = await studentStore.fetchPayments(childId, getFromDate(timeRange.value));
  } finally {
    loading.value = false;
  }
};

const openPaymentModal = (child: any) => {
  studentId.value = child.id;
  selectedName.value = `${child.firstName} ${child.lastName}`;
  showAddPaymentModal.value = true;
  selectedAmount.value = child.dueAmount || '';
};

const openEditModal = (payment: any) => {
  editingPayment.value = payment;
  studentId.value = payment.child?.id || null;
  selectedName.value = `${payment.child?.firstName || ''} ${payment.child?.lastName || ''}`;
  selectedAmount.value = '';
  showAddPaymentModal.value = true;
};

const openStudentModal = async (row: any) => {
  try {
    const student = await studentStore.fetchStudent(row.id);
    selectedStudent.value = student;
    showChildModal.value = true;
  } catch {
    alert('Failed to load student');
  }
};

const handleStudentSubmit = async (payload: any) => {
  if (!selectedStudent.value) return;
  try {
    savingStudent.value = true;
    await studentStore.updateChild(selectedStudent.value.id, payload);
    showChildModal.value = false;
    selectedStudent.value = null;
    await studentStore.dueStudents();
  } catch (error: any) {
    alert(error?.response?.data?.error?.message || 'Failed to save student');
  } finally {
    savingStudent.value = false;
  }
};

const handleStudentRefresh = async () => {
  if (selectedStudent.value) {
    selectedStudent.value = await studentStore.fetchStudent(selectedStudent.value.id);
  }
};

watch(timeRange, () => {
  currentPage.value = 1;
  fetchPayments(searchedId.value || undefined);
});

watch(showAddPaymentModal, () => {
  if (!showAddPaymentModal.value) {
    studentId.value = null;
    editingPayment.value = null;
  }
});

const addPayment = async () => {
  editingPayment.value = null;
  await fetchPayments(searchedId.value || undefined);
  await studentStore.dueStudents();
};

onMounted(async () => {
  await fetchPayments();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-sterling-sign text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Payment Management</h2>
          <p class="text-sm text-secondary-500">Track overdue payments and payment history</p>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- Payments Overdue Section -->
      <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden">
        <div
          class="bg-linear-to-r from-danger-50 to-danger-100 px-5 py-4 border-b border-danger-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-danger-500 flex items-center justify-center">
              <i class="fa-solid fa-exclamation-triangle text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-danger-900">Payments Overdue</h3>
              <p class="text-xs text-danger-600">Students with outstanding payments</p>
            </div>
          </div>
        </div>

        <div class="p-5">
          <!-- Search Filter -->
          <div class="bg-secondary-50 rounded-xl border border-secondary-200 p-4 mb-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fa-solid fa-magnifying-glass text-danger-600"></i>
              <label class="text-sm font-semibold text-secondary-700">Search by Student</label>
            </div>
            <div class="flex gap-2 items-center">
              <Input
                v-model="dueSearch"
                type="search"
                placeholder="Enter student name..."
                class="flex-1"
              />
              <Button
                v-if="dueSearch.trim().length"
                variant="ghost"
                size="sm"
                @click="dueSearch = ''"
              >
                <i class="fa-solid fa-xmark"></i>
              </Button>
            </div>
          </div>

          <Table
            :columns="dueColumns"
            :data="dueTableData"
            header-class="bg-white border-b border-secondary-200"
            empty-text="No overdue payments"
          >
            <template #cell-index="{ value }">
              <span class="text-secondary-400 text-xs font-medium">{{ value }}</span>
            </template>
            <template #cell-name="{ row }">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center shrink-0"
                >
                  <i class="fa-solid fa-user text-danger-600 text-xs"></i>
                </div>
                <span class="font-semibold text-secondary-900">{{ row.name }}</span>
                <button
                  class="w-6 h-6 rounded-md bg-secondary-100 hover:bg-primary-100 text-secondary-400 hover:text-primary-600 transition-colors flex items-center justify-center"
                  @click="openStudentModal(row)"
                >
                  <i class="fa-solid fa-pen text-[10px]"></i>
                </button>
              </div>
            </template>
            <template #cell-dueAmount="{ row }">
              <span
                class="inline-flex items-center px-3 py-1 rounded-lg bg-danger-100 font-bold text-danger-700 text-sm"
              >
                {{ row.dueAmountFormatted }}
              </span>
            </template>
            <template #cell-action="{ row }">
              <Button size="sm" @click="openPaymentModal(row)">
                <i class="fa-solid fa-plus mr-1"></i>
                Add Payment
              </Button>
            </template>

            <!-- Mobile card view -->
            <template #mobile-card="{ row }">
              <div class="grid grid-cols-7 border-b py-2 border-secondary-100">
                <div class="col-span-4 flex items-center gap-1.5">
                  <p class="font-semibold text-secondary-900 truncate">{{ row.name }}</p>
                  <button
                    class="w-6 h-6 rounded-md bg-secondary-100 hover:bg-primary-100 text-secondary-400 hover:text-primary-600 transition-colors flex items-center justify-center shrink-0"
                    @click="openStudentModal(row)"
                  >
                    <i class="fa-solid fa-pen text-[10px]"></i>
                  </button>
                </div>
                <div class="col-span-3 gap-2 flex flex-row items-center justify-between">
                  <div class="flex items-center justify-between gap-2">
                    <!-- <span class="text-sm text-secondary-600">Due:</span> -->
                    <span
                      class="inline-flex items-center px-3 py-1 rounded-lg bg-danger-100 font-bold text-danger-700 text-sm"
                    >
                      {{ row.dueAmountFormatted }}
                    </span>
                  </div>
                  <Button class="gap-1!" size="sm" @click="openPaymentModal(row)">
                    <i class="fa-solid fa-plus"></i>
                    Add
                  </Button>
                </div>
              </div>
            </template>
          </Table>
        </div>
      </div>

      <!-- Payment History Section -->
      <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden">
        <div
          class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <i class="fa-solid fa-clock-rotate-left text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">Payment History</h3>
              <p class="text-xs text-primary-600">View all payment transactions</p>
            </div>
          </div>
        </div>

        <div class="p-5">
          <!-- Search & Filter Section -->
          <div class="bg-secondary-50 rounded-xl border border-secondary-200 p-4 mb-4">
            <div class="flex items-center gap-2 mb-3">
              <i class="fa-solid fa-magnifying-glass text-primary-600"></i>
              <label class="text-sm font-semibold text-secondary-700">Search & Filter</label>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex gap-2 items-center">
                <Input
                  v-model="search"
                  type="search"
                  placeholder="Enter student name..."
                  class="flex-1"
                />
                <Button v-if="search.trim().length" variant="ghost" size="sm" @click="clearSearch">
                  <i class="fa-solid fa-xmark"></i>
                </Button>
              </div>
              <Select
                v-model="timeRange"
                :options="timeRangeOptions"
                placeholder="Time range"
              />
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="search.trim().length" class="mb-4">
            <SearchResults @onSelect="onSelectFromSearch" />
          </div>

          <!-- Selected filter indicator -->
          <div v-if="searchedId" class="mb-4">
            <div class="p-4 bg-primary-50 border-2 border-primary-200 rounded-xl shadow-xs">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shrink-0"
                  >
                    <i class="fa-solid fa-filter text-white text-sm"></i>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-primary-600 uppercase tracking-wide">
                      Filtered By
                    </p>
                    <p class="text-sm font-bold text-primary-900">{{ selectedName }}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" @click="clearSelected">
                  <i class="fa-solid fa-xmark mr-1"></i> Clear
                </Button>
              </div>
            </div>
          </div>

          <Table
            :columns="historyColumns"
            :data="historyTableData"
            :loading="loading"
            header-class="bg-white border-b border-secondary-200"
            empty-text="No payment records found"
          >
            <template #cell-index="{ value }">
              <span class="text-secondary-400 text-xs font-medium">{{ value }}</span>
            </template>
            <template #cell-name="{ row }">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0"
                >
                  <i class="fa-solid fa-user text-primary-600 text-xs"></i>
                </div>
                <span class="font-semibold text-secondary-900">{{ row.name }}</span>
              </div>
            </template>
            <template #cell-amount="{ row }">
              <span
                class="inline-flex items-center px-3 py-1 rounded-lg bg-success-100 font-bold text-success-700 text-sm"
              >
                {{ row.amountFormatted }}
              </span>
            </template>
            <template #cell-date="{ row }">
              <div class="flex items-center gap-2 text-secondary-600">
                <i class="fa-solid fa-calendar text-secondary-400 text-xs"></i>
                <span class="text-sm">{{ row.date }}</span>
              </div>
            </template>
            <template #cell-notes="{ row }">
              <span class="text-sm text-secondary-500 italic">{{ row.notesDisplay }}</span>
            </template>
            <template v-if="isAdmin" #cell-action="{ row }">
              <Button size="sm" variant="ghost" @click="openEditModal(row)">
                <i class="fa-solid fa-pen text-secondary-500"></i>
              </Button>
            </template>

            <!-- Mobile card view -->
            <template #mobile-card="{ row }">
              <div class="space-y-2 mb-1 pt-3 border p-3.5 rounded-lg border-secondary-100">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0"
                  >
                    <i class="fa-solid fa-user text-primary-600"></i>
                  </div>
                  <div class="flex-1">
                    <p class="font-semibold text-secondary-900">{{ row.name }}</p>
                    <div class="flex items-center gap-1.5 text-xs text-secondary-500 mt-0.5">
                      <i class="fa-solid fa-calendar text-secondary-400"></i>
                      <span>{{ row.date }}</span>
                    </div>
                  </div>
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-lg bg-success-100 font-bold text-success-700 text-sm"
                  >
                    {{ row.amountFormatted }}
                  </span>
                </div>
                <div class="flex items-center justify-between" :class="row.notes || isAdmin ? 'pt-2 border-t border-secondary-100' : ''">
                  <p v-if="row.notes" class="text-xs text-secondary-500 italic">{{ row.notes }}</p>
                  <Button v-if="isAdmin" size="sm" variant="ghost" @click="openEditModal(row)">
                    <i class="fa-solid fa-pen text-xs text-secondary-500 mr-1"></i>
                    Edit
                  </Button>
                </div>
              </div>
            </template>

            <!-- Pagination in footer -->
            <template #footer>
              <Pagination
                v-model:currentPage="currentPage"
                :totalPages="totalPages"
                :totalItems="paymentHistory.length"
                :pageSize="pageSize"
              />
            </template>
          </Table>
        </div>
      </div>
    </div>

    <!-- Add Payment Modal -->
    <AddPaymentModal
      v-model:show="showAddPaymentModal"
      :child-id="studentId"
      :name="selectedName"
      :amount="selectedAmount"
      :payment="editingPayment"
      @onSuccess="addPayment"
    />
    <!-- Student Edit Modal -->
    <ChildModal
      v-model:show="showChildModal"
      :child="selectedStudent"
      :loading="savingStudent"
      @submit="handleStudentSubmit"
      @refresh="handleStudentRefresh"
    />
  </div>
</template>
