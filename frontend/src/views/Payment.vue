<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash';

import type { SearchResult } from '@/types';

import InputField from '@/components/base/InputField.vue';
import SearchResults from '@/components/SearchResults.vue';

import { useSearchStore, useStudentStore } from '@/stores';
import AddPaymentModal from '@/components/AddPaymentModal.vue';

const searchStore = useSearchStore();
const studentStore = useStudentStore();

const search = ref<string>('');
const studentId = ref<number | null>(null);
const selectedName = ref<string>('');
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
  if (item.type === 'student') {
    studentId.value = item.id;
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

const addPayment = async () => {
  if (studentId.value) {
    await fetchPayments(studentId.value);
    await studentStore.dueStudents();
  }
};

onMounted(async () => {
  await fetchPayments();
});
</script>

<template>
  <h3 class="fw-bold mt-4">Payments</h3>
  <form class="mt-4 d-flex gap-2 align-items-center">
    <div class="d-flex gap-1 report-search">
      <InputField v-model="search" placeholder="Enter Student name to search" />
      <button
        v-if="search.trim().length"
        type="button"
        class="btn btn-secondary rounded-3"
        @click="clearSearch"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
      <button
        v-if="studentId"
        type="button"
        class="btn btn-secondary rounded-3"
        @click="clearSelected"
      >
        Clear search
      </button>
    </div>
  </form>
  <SearchResults
    class="mt-3 report-search position-absolute shadow"
    v-if="search.trim().length"
    @onSelect="onSelectFromSearch"
  />
  <p class="mt-4 mb-0" v-if="studentId"><strong>Selected:</strong> {{ selectedName }}</p>
  <p class="mt-4 mb-0" v-if="!paymentHistory.length && !loading">No records found</p>
  <p class="mt-4 mb-0" v-if="loading">Loading...</p>
  <table class="table mt-4" v-if="paymentHistory.length">
    <thead class="">
      <tr>
        <th scope="col">#</th>
        <th scope="col">Name</th>
        <th scope="col">Amount</th>
        <th scope="col">Payment Date</th>
        <th scope="col">Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(record, index) in paymentHistory" :key="record.id">
        <th scope="row">{{ index + 1 }}</th>
        <td>{{ record.child.firstName }} {{ record.child.lastName }}</td>
        <td>{{ record.amount }}</td>
        <td>{{ record.paymentDate }}</td>
        <td>{{ record.notes }}</td>
      </tr>
    </tbody>
  </table>
  <div v-if="studentId" class="mt-4">
    <button type="button" class="btn btn-info" @click="showAddPaymentModal = true">
      Add Payment
    </button>
  </div>

  <div class="mt-5">
    <h4>Due Students</h4>
    <table class="table mt-3">
      <thead class="table-danger">
        <tr>
          <th scope="col">#</th>
          <th scope="col">Name</th>
          <th scope="col">Due amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(record, index) in dueStudents" :key="record.id">
          <th scope="row">{{ index + 1 }}</th>
          <td>{{ record.firstName }} {{ record.lastName }}</td>
          <td>{{ record.dueAmount || '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <AddPaymentModal
    v-model:show="showAddPaymentModal"
    :child-id="studentId"
    @onSuccess="addPayment"
  />
</template>

<style scoped lang="scss">
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
tbody tr:last-child th:first-child {
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
  background-color: #ffc7cc;
}
</style>
