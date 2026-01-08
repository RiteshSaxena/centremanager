<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';

import { useLogBookStore, useSearchStore, useSlotStore } from '@/stores';
import type { LogRecord, SearchResult } from '@/types';
import { Input } from '@/components/ui';
import SearchResults from '@/components/SearchResults.vue';
import { Button, Spinner } from '@/components/ui';
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
  <h4 class="font-bold mt-8 text-lg text-secondary-900">Attendance Report</h4>
  <form class="mt-4 flex flex-wrap gap-2 items-center" @submit.prevent="searchFromDate">
    <div class="flex gap-1 w-full max-w-md">
      <Input v-model="search" placeholder="Enter Student or Staff name to search" />
      <Button
        v-if="search.trim().length"
        type="button"
        variant="secondary"
        @click="clearSearch"
      >
        <i class="fa-solid fa-xmark"></i>
      </Button>
    </div>
    <span class="text-secondary-400 px-2"> - OR - </span>
    <div>
      <Input type="date" :max="todayDate" v-model="reportDate" required />
    </div>
    <Button type="submit" :disabled="loading">
      {{ loading ? '...' : 'View' }}
    </Button>
  </form>
  <div class="relative">
    <SearchResults
      class="mt-3 absolute z-20 w-full max-w-md shadow-lg"
      v-if="search.trim().length"
      @onSelect="onSelectFromSearch"
    />
  </div>
  <p class="mt-4 mb-0 text-secondary-700" v-if="studentId || staffId"><strong>Selected:</strong> {{ selectedName }}</p>
  <p class="mt-4 mb-0 text-secondary-500" v-if="loading">Loading...</p>

  <div class="overflow-x-auto mt-4">
    <table class="w-full min-w-[600px]">
      <thead>
        <tr class="bg-primary-500 text-white">
          <th class="px-4 py-3 text-left text-sm font-semibold rounded-tl-xl">#</th>
          <th class="px-4 py-3 text-left text-sm font-semibold">Type</th>
          <th class="px-4 py-3 text-left text-sm font-semibold">Name</th>
          <th class="px-4 py-3 text-left text-sm font-semibold">Sign In Time</th>
          <th class="px-4 py-3 text-left text-sm font-semibold rounded-tr-xl">Sign Out Time</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-secondary-100">
        <tr v-for="(record, index) in reportList" :key="record.id" class="hover:bg-secondary-50">
          <td class="px-4 py-3 text-sm text-primary-800">{{ index + 1 }}</td>
          <td class="px-4 py-3 text-sm text-primary-800">{{ record.type }}</td>
          <td class="px-4 py-3 text-sm text-primary-800">{{ record.name }}</td>
          <td class="px-4 py-3 text-sm text-primary-800">{{ formatTime(record.signInTime) }}</td>
          <td class="px-4 py-3 text-sm text-primary-800">{{ formatTime(record?.signOutTime) }}</td>
        </tr>
        <tr v-if="!records.length && !loading">
          <td class="text-center px-4 py-8 text-secondary-400" colspan="5">No records found</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="mt-8" v-if="absentChildren.length && searchMode === 'date'">
    <h4 class="font-bold text-lg text-secondary-900">Absent Students</h4>
    <div class="overflow-x-auto mt-3">
      <table class="w-full min-w-[600px]">
        <thead>
          <tr class="bg-danger-500 text-white">
            <th class="px-4 py-3 text-left text-sm font-semibold rounded-tl-xl">#</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Type</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Name</th>
            <th class="px-4 py-3 text-left text-sm font-semibold">Sign In Time</th>
            <th class="px-4 py-3 text-left text-sm font-semibold rounded-tr-xl">Sign Out Time</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-secondary-100">
          <tr v-for="(record, index) in absentChildren" :key="record.id" class="hover:bg-secondary-50">
            <td class="px-4 py-3 text-sm text-primary-800">{{ index + 1 }}</td>
            <td class="px-4 py-3 text-sm text-primary-800">Student</td>
            <td class="px-4 py-3 text-sm text-primary-800">{{ record.firstName }} {{ record.lastName }}</td>
            <td class="px-4 py-3 text-sm text-primary-800">-</td>
            <td class="px-4 py-3 text-sm text-primary-800">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
