<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash';
import type { SearchResult } from '@/types';

import InputField from '@/components/base/InputField.vue';
import SearchResults from '@/components/SearchResults.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

import { useSearchStore, useStudentStore } from '@/stores';
import AddPaymentModal from '@/components/AddPaymentModal.vue';

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

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value, true);
}, 500);

const dueStudents = computed(() => {
  return studentStore.books.dueStudents as any[];
});

const clearSearch = () => {
  search.value = '';
  searchStore.clearResults();
};

const clearSelected = () => {
  studentId.value = null;
  selectedName.value = '';
  searchedId.value = null;
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
    await fetchPayments(studentId.value);
    await studentStore.dueStudents();
  }
};

onMounted(async () => {
  await fetchPayments();
  // new DataTable('#due-students-table', {
  //   paging: true,
  //   pageLength: 25,
  //   searching: false,
  //   ordering: false,
  //   info: false,
  //   lengthChange: false,
  //   autoWidth: false
  // });
  // new DataTable('#pay-history-table', {
  //   paging: true,
  //   pageLength: 25,
  //   searching: false,
  //   ordering: false,
  //   info: false,
  //   lengthChange: false,
  //   autoWidth: false
  // });
});
</script>

<template>
  <div class="mt-5">
    <h4 class="fw-bold">Payments Overdue</h4>
    <DataTable
      table-class="payment-table"
      :value="dueStudents"
      paginator
      :rows="50"
      class="mt-3"
    >
      <Column field="id" header="#">
        <template #body="{ index }">
          {{ index + 1 }}
        </template>
      </Column>
      <Column field="firstName" header="Name">
        <template #body="{ data }"> {{ data.firstName }} {{ data.lastName }} </template>
      </Column>
      <Column field="dueAmount" header="Due Amount">
        <template #body="{ data }">
          {{ data.dueAmount > 1 ? data.dueAmount : '-' }}
        </template>
      </Column>
      <Column field="payment" header="Payment">
        <template #body="{ data }">
          <button type="button" class="btn btn-info btn-sm" @click="openPaymentModal(data)">
            Add Payment
          </button>
        </template>
      </Column>
      <template #empty>No records found</template>
    </DataTable>
  </div>
  <h4 class="fw-bold mt-5">Payment History</h4>
  <div class="position-relative">
    <form class="mt-4 d-flex gap-2 align-items-center" @submit.prevent="fetchPayments()">
      <div class="d-flex gap-1 report-search align-items-center">
        <InputField v-model="search" placeholder="Enter student name to filter payment history" />
        <button
          v-if="search.trim().length"
          type="button"
          class="btn btn-secondary rounded-3"
          @click="clearSearch"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </form>
    <SearchResults
      class="mt-3 report-search z-3 position-absolute shadow"
      v-if="search.trim().length"
      @onSelect="onSelectFromSearch"
    />
  </div>
  <p class="mt-4 mb-0" v-if="searchedId">
    Showing payment history for: <strong>{{ selectedName }}</strong>
  </p>

  <DataTable :value="paymentHistory" paginator :rows="50" class="rounded mt-4" :loading="loading">
    <Column field="id" header="#">
      <template #body="{ index }">
        {{ index + 1 }}
      </template>
    </Column>
    <Column field="firstName" header="Name">
      <template #body="{ data }"> {{ data.child.firstName }} {{ data.child.lastName }} </template>
    </Column>
    <Column field="amount" header="Amount"></Column>
    <Column field="paymentDate" header="Payment Date"></Column>
    <Column field="notes" header="Notes"></Column>
    <template #empty>No records found</template>
  </DataTable>

  <div v-if="studentId" class="mt-4">
    <button type="button" class="btn btn-info" @click="showAddPaymentModal = true">
      Add Payment for {{ selectedName }}
    </button>
    <button type="button" class="btn btn-secondary rounded-3 ms-2" @click="clearSelected">
      Clear selection
    </button>
  </div>
  <AddPaymentModal
    v-model:show="showAddPaymentModal"
    :child-id="studentId"
    :name="selectedName"
    :amount="selectedAmount"
    @onSuccess="addPayment"
  />
</template>

<style scoped lang="scss">
.table-responsive {
  table {
    min-width: 322px;
  }
}
.report-search {
  width: 100%;
  max-width: 400px;
}
th,
td {
  color: #193b4d !important;
}
thead th:first-child {
  border-top-left-radius: 1rem;
}

thead th:last-child {
  border-top-right-radius: 1rem;
}
tbody tr:last-child th:first-child,
tbody tr:last-child td:first-child {
  border-bottom-left-radius: 1rem;
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: 1rem;
}
th:first-child {
  padding-left: 1.5rem;
}
tbody tr:last-child td,
tbody tr:last-child th {
  border-bottom-width: 0;
}

thead.table-danger th {
  background-color: #ff6961;
  color: white !important;
}
</style>
