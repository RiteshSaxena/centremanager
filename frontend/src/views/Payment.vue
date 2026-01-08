<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash';
import type { SearchResult } from '@/types';

import { Input, Button, Table, Pagination } from '@/components/ui';
import type { TableColumn } from '@/components/ui/Table.vue';
import SearchResults from '@/components/SearchResults.vue';
import AddPaymentModal from '@/components/AddPaymentModal.vue';

import { useSearchStore, useStudentStore } from '@/stores';

const searchStore = useSearchStore();
const studentStore = useStudentStore();

const search = ref<string>('');
const searchedId = ref<number | null>(null);
const studentId = ref<number | null>(null);
const selectedName = ref<string>('');
const selectedAmount = ref<string | number>('');
const paymentHistory = ref<any[]>([]);
const loading = ref(false);
const showAddPaymentModal = ref(false);

// Pagination state
const currentPage = ref(1);
const dueCurrentPage = ref(1);
const pageSize = 10; // Lowered from 25 to make pagination easier to test

// Table column definitions
const dueColumns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'dueAmount', header: 'Due Amount' },
  { key: 'action', header: 'Action', hideOnMobile: true }
];

const historyColumns: TableColumn[] = [
  { key: 'index', header: '#', width: '60px' },
  { key: 'name', header: 'Name' },
  { key: 'amount', header: 'Amount' },
  { key: 'date', header: 'Date' },
  { key: 'notes', header: 'Notes', hideOnMobile: true }
];

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value, true);
}, 500);

const dueStudents = computed(() => {
  return studentStore.books.dueStudents as any[];
});

const paginatedDueStudents = computed(() => {
  const start = (dueCurrentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return dueStudents.value.slice(start, end);
});

const dueTotalPages = computed(() => Math.ceil(dueStudents.value.length / pageSize));

// Transform due students for table display
const dueTableData = computed(() => {
  return paginatedDueStudents.value.map((student, index) => ({
    ...student,
    index: (dueCurrentPage.value - 1) * pageSize + index + 1,
    name: `${student.firstName} ${student.lastName}`,
    dueAmountFormatted: student.dueAmount > 1 ? `€${student.dueAmount}` : '-'
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
    amountFormatted: `€${payment.amount}`,
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
    paymentHistory.value = await studentStore.fetchPayments(childId);
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

watch(showAddPaymentModal, () => {
  if (!showAddPaymentModal.value) {
    studentId.value = null;
  }
});

const addPayment = async () => {
  if (studentId.value) {
    studentId.value = null;
    await fetchPayments();
    await studentStore.dueStudents();
  }
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
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm">
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
      <div class="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
        <div
          class="bg-gradient-to-r from-danger-50 to-danger-100 px-5 py-4 border-b border-danger-200"
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
          <Table
            :columns="dueColumns"
            :data="dueTableData"
            header-class="bg-white border-b border-secondary-200"
            empty-text="No overdue payments"
          >
            <template #cell-index="{ value }">
              <span class="text-secondary-500">{{ value }}</span>
            </template>
            <template #cell-name="{ row }">
              <span class="font-medium text-secondary-900">{{ row.name }}</span>
            </template>
            <template #cell-dueAmount="{ row }">
              <span class="font-semibold text-danger-600">{{ row.dueAmountFormatted }}</span>
            </template>
            <template #cell-action="{ row }">
              <Button size="sm" @click="openPaymentModal(row)">Add Payment</Button>
            </template>

            <!-- Mobile card view -->
            <template #mobile-card="{ row }">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-secondary-900">{{ row.name }}</p>
                  <p class="text-sm mt-1">
                    <span class="text-secondary-500">Due:</span>
                    <span class="font-semibold text-danger-600 ml-1">{{
                      row.dueAmountFormatted
                    }}</span>
                  </p>
                </div>
                <Button size="sm" @click="openPaymentModal(row)">Add</Button>
              </div>
            </template>

            <!-- Pagination in footer -->
            <template #footer>
              <Pagination
                v-model:currentPage="dueCurrentPage"
                :totalPages="dueTotalPages"
                :totalItems="dueStudents.length"
                :pageSize="pageSize"
              />
            </template>
          </Table>
        </div>
      </div>

      <!-- Payment History Section -->
      <div class="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden">
        <div
          class="bg-gradient-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200"
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
          <!-- Search -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-secondary-700 mb-2">
              Search by Student
            </label>
            <div class="flex gap-2 items-center max-w-md">
              <Input v-model="search" type="search" placeholder="Enter student name..." />
              <Button v-if="search.trim().length" variant="ghost" size="sm" @click="clearSearch">
                <i class="fa-solid fa-xmark"></i>
              </Button>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="search.trim().length" class="mb-4">
            <SearchResults @onSelect="onSelectFromSearch" />
          </div>

          <!-- Selected filter indicator -->
          <div v-if="searchedId" class="mb-4">
            <div class="p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <i class="fa-solid fa-filter text-primary-600"></i>
                  <span class="text-sm text-primary-900">
                    Showing payments for: <strong>{{ selectedName }}</strong>
                  </span>
                </div>
                <Button variant="ghost" size="sm" @click="clearSelected">
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
              <span class="text-secondary-500">{{ value }}</span>
            </template>
            <template #cell-name="{ row }">
              <span class="font-medium text-secondary-900">{{ row.name }}</span>
            </template>
            <template #cell-amount="{ row }">
              <span class="font-semibold text-success-600">{{ row.amountFormatted }}</span>
            </template>
            <template #cell-date="{ row }">
              <span class="text-secondary-700">{{ row.date }}</span>
            </template>
            <template #cell-notes="{ row }">
              <span class="text-secondary-500">{{ row.notesDisplay }}</span>
            </template>

            <!-- Mobile card view -->
            <template #mobile-card="{ row }">
              <div class="flex justify-between items-start mb-2">
                <p class="font-medium text-secondary-900">{{ row.name }}</p>
                <span class="font-semibold text-success-600">{{ row.amountFormatted }}</span>
              </div>
              <div class="text-sm text-secondary-500 space-y-1">
                <p>{{ row.date }}</p>
                <p v-if="row.notes">{{ row.notes }}</p>
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
      @onSuccess="addPayment"
    />
  </div>
</template>
