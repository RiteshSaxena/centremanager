<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';

import { useLogBookStore, useSearchStore, useSlotStore } from '@/stores';
import type { LogRecord, SearchResult } from '@/types';
import InputField from '@/components/base/InputField.vue';
import SearchResults from '@/components/SearchResults.vue';
import { debounce } from 'lodash';

const searchStore = useSearchStore();
const logBookStore = useLogBookStore();
const slotStore = useSlotStore();

const reportDate = ref<string>(moment().format('YYYY-MM-DD'));
const reportDay = ref<string>(moment().format('dddd'));
const search = ref<string>('');
const studentId = ref<number | null>(null);
const selectedName = ref<string>('');
const staffId = ref<number | null>(null);
const records = ref<LogRecord[]>([]);
const isSearched = ref(false);
const loading = ref(false);

const todayDate = moment().format('YYYY-MM-DD');

const sortOrder: any = {
  Student: 1,
  'Student & Parent': 1,
  Parent: 2,
  Guest: 3,
  Staff: 4
};

const searchMode = ref('date');

const reportList = computed(() => {
  return records.value
    .map((record) => {
      let name = '';
      let type = '';
      if (record.type === 'Student') {
        name = `${record.student?.firstName} ${record.student?.lastName}`;
        type = 'Student';
      } else if (record.type === 'StudentWithParent') {
        name = `${record.student?.firstName} ${record.student?.lastName} & ${record.parent?.firstName} ${record.parent?.lastName}`;
        type = 'Student & Parent';
      } else if (record.type === 'Staff') {
        name = `${record.staff?.firstName} ${record.staff?.lastName}`;
        type = 'Staff';
      } else if (record.type === 'Parent') {
        name = `${record.parent?.firstName} ${record.parent?.lastName}`;
        type = 'Parent';
      } else if (record.type === 'Guest') {
        name = `${record.guest?.firstName} ${record.guest?.lastName}`;
        type = 'Guest';
      }
      return {
        id: record.id,
        name,
        type,
        signInTime: record.signInTime,
        signOutTime: record.signOutTime
      };
    })
    .sort((a, b) => {
      if (sortOrder[a.type] < sortOrder[b.type]) {
        return -1;
      }
      if (sortOrder[a.type] > sortOrder[b.type]) {
        return 1;
      }

      return 0;
    });
});

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value);
}, 500);

const clearSearch = () => {
  search.value = '';
  searchStore.clearResults();
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
  staffId.value = null;
  if (item.type === 'student') {
    studentId.value = item.id;
    selectedName.value = `${item.firstName} ${item.lastName}`;
  } else if (item.type === 'staff') {
    staffId.value = item.id;
    selectedName.value = `${item.firstName} ${item.lastName}`;
  }
  reportDate.value = '';
  clearSearch();
  onSubmit();
};

const formatTime = (date: Date | null) => {
  if (!date) {
    return '-';
  }
  return moment(date).format('DD-MM-YYYY hh:mmA');
};

const searchFromDate = () => {
  if (!reportDate.value) {
    return;
  }
  studentId.value = null;
  staffId.value = null;
  onSubmit();
};

const onSubmit = async () => {
  try {
    if (!reportDate.value && !studentId.value && !staffId.value) {
      return;
    }
    records.value = [];
    isSearched.value = true;
    loading.value = true;
    if (studentId.value) {
      searchMode.value = 'student';
      records.value = await logBookStore.fetchListByStudent(studentId.value);
    } else if (staffId.value) {
      searchMode.value = 'staff';
      records.value = await logBookStore.fetchListByStaff(staffId.value);
    } else {
      searchMode.value = 'date';
      records.value = await logBookStore.fetchListByDate(reportDate.value);
      reportDay.value = moment(reportDate.value, 'YYYY-MM-DD').format('dddd');
    }
    clearSearch();
  } finally {
    loading.value = false;
  }
};

// const todayDay = moment().format('dddd');

const absentChildren = computed(() => {
  const allChildren: any[] = [];
  const todaySlots = slotStore.slots.filter((slot) => slot.day === reportDay.value);
  todaySlots.forEach((slot) => {
    slot.children.forEach((child) => {
      const isChildExists = allChildren.find((c) => c.id === child.id);
      if (!isChildExists) {
        allChildren.push(child);
      }
    });
  });
  const presentChildren = records.value
    .filter((r) => r.student)
    .map((record) => record.student?.id);

  return allChildren.filter((child) => !presentChildren.includes(child.id));
});

onMounted(async () => {
  await slotStore.fetchSlots();
  searchFromDate();
});
</script>

<template>
  <h4 class="fw-bold mt-5">Attendance Report</h4>
  <form class="mt-4 d-flex gap-2 align-items-center" @submit.prevent="searchFromDate">
    <div class="d-flex gap-1 report-search">
      <InputField v-model="search" placeholder="Enter Student or Staff name to search" />
      <button
        v-if="search.trim().length"
        type="button"
        class="btn btn-secondary rounded-3"
        @click="clearSearch"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <span class="divider text-muted"> - OR - </span>
    <div>
      <InputField type="date" :max="todayDate" v-model="reportDate" required />
    </div>
    <button type="submit" class="btn btn-info" :disabled="loading">
      {{ loading ? '...' : 'View' }}
    </button>
  </form>
  <SearchResults
    class="mt-3 report-search position-absolute shadow"
    v-if="search.trim().length"
    @onSelect="onSelectFromSearch"
  />
  <p class="mt-4 mb-0" v-if="studentId || staffId"><strong>Selected:</strong> {{ selectedName }}</p>
  <p class="mt-4 mb-0" v-if="loading">Loading...</p>
  <table class="table mt-4">
    <thead class="">
      <tr>
        <th scope="col">#</th>
        <th scope="col">Type</th>
        <th scope="col">Name</th>
        <th scope="col">Sign In Time</th>
        <th scope="col">Sign Out Time</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(record, index) in reportList" :key="record.id">
        <th scope="row">{{ index + 1 }}</th>
        <td>{{ record.type }}</td>
        <td>{{ record.name }}</td>
        <td>{{ formatTime(record.signInTime) }}</td>
        <td>{{ formatTime(record?.signOutTime) }}</td>
      </tr>
      <tr v-if="!records.length && !loading">
        <td class="text-center" colspan="5">No records found</td>
      </tr>
    </tbody>
  </table>

  <div class="mt-5" v-if="absentChildren.length && searchMode === 'date'">
    <h4 class="fw-bold">Absent Students</h4>
    <table class="table mt-3">
      <thead class="table-danger">
        <tr>
          <th scope="col">#</th>
          <th scope="col">Type</th>
          <th scope="col">Name</th>
          <th scope="col">Sign In Time</th>
          <th scope="col">Sign Out Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(record, index) in absentChildren" :key="record.id">
          <th scope="row">{{ index + 1 }}</th>
          <td>Student</td>
          <td>{{ record.firstName }} {{ record.lastName }}</td>
          <td>-</td>
          <td>-</td>
        </tr>
      </tbody>
    </table>
  </div>
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
tbody tr:last-child td:first-child,
tbody tr:last-child th:first-child {
  border-bottom-left-radius: 1rem;
}

tbody tr:last-child td:last-child {
  border-bottom-right-radius: 1rem;
}
th:first-child,
td:first-child {
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
