<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import moment from 'moment';

import { useLogBookStore, useSearchStore, useSlotStore } from '@/stores';
import type { LogRecord, SearchResult } from '@/types';
import { Input } from '@/components/ui';
import SearchResults from '@/components/SearchResults.vue';
import { Button, Spinner } from '@/components/ui';
import SignOutModal from '@/components/SignOutModal.vue';
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
const showSignOutModal = ref(false);
const selectedRecord = ref<LogRecord | null>(null);

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

const onRowClick = (recordId: number) => {
  const record = records.value.find((r) => r.id === recordId);
  if (!record) return;

  // Only open sign out modal (review performance) for Student records
  if (record.type === 'Student' || record.type === 'StudentWithParent') {
    selectedRecord.value = record;
    showSignOutModal.value = true;
  }
};

const onModalSuccess = () => {
  // Close modal after success
  showSignOutModal.value = false;
};

onMounted(async () => {
  await slotStore.fetchSlots();
  searchFromDate();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center shadow-xs">
          <i class="fa-solid fa-chart-line text-white text-xl"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-secondary-900">Attendance Report</h2>
          <p class="text-sm text-secondary-500">View attendance records by date or person</p>
        </div>
      </div>
    </div>

    <!-- Search Form -->
    <div class="bg-white rounded-xl border border-secondary-200 shadow-xs p-5 mb-6">
      <form @submit.prevent="searchFromDate">
        <!-- Side by Side Search -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <!-- Search by Name -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-secondary-700">
              Search by Student or Staff
            </label>
            <div class="flex gap-2">
              <Input v-model="search" placeholder="Enter name to search..." class="flex-1" />
              <Button
                v-if="search.trim().length"
                type="button"
                variant="ghost"
                @click="clearSearch"
              >
                <i class="fa-solid fa-xmark"></i>
              </Button>
            </div>
          </div>

          <!-- Divider -->
          <div class="hidden lg:flex items-center justify-center px-4 pt-8">
            <span class="text-sm text-secondary-400 font-medium">OR</span>
          </div>
          <div class="lg:hidden relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-secondary-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-secondary-500 font-medium">OR</span>
            </div>
          </div>

          <!-- Search by Date -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-secondary-700"> Search by Date </label>
            <div class="flex gap-2">
              <Input type="date" :max="todayDate" v-model="reportDate" required class="flex-1" />
              <Button type="submit" :disabled="loading">
                <i v-if="!loading" class="fa-solid fa-magnifying-glass mr-2"></i>
                {{ loading ? 'Loading...' : 'View' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div v-if="search.trim().length" class="mt-4">
          <SearchResults @onSelect="onSelectFromSearch" />
        </div>

        <!-- Selected Person -->
        <div
          v-if="studentId || staffId"
          class="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg"
        >
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-user text-primary-600"></i>
            <span class="text-sm text-primary-900">
              <strong>Selected:</strong> {{ selectedName }}
            </span>
          </div>
        </div>
      </form>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Spinner size="lg" />
    </div>

    <!-- Attendance Records -->
    <div v-else-if="isSearched" class="space-y-6">
      <!-- Present Records -->
      <div class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden">
        <div
          class="bg-linear-to-r from-primary-50 to-primary-100 px-5 py-4 border-b border-primary-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
              <i class="fa-solid fa-clipboard-check text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary-900">Attendance Records</h3>
              <p class="text-xs text-primary-600">
                {{
                  searchMode === 'date'
                    ? `${reportDay} - ${moment(reportDate).format('MMM D, YYYY')}`
                    : selectedName
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead>
              <tr class="bg-secondary-50 border-b border-secondary-200">
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Sign In Time
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Sign Out Time
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-100">
              <tr
                v-for="(record, index) in reportList"
                :key="record.id"
                :class="[
                  'transition-colors',
                  (record.type === 'Student' || record.type === 'Student & Parent')
                    ? 'hover:bg-primary-50 cursor-pointer'
                    : 'hover:bg-secondary-50'
                ]"
                @click="onRowClick(record.id)"
              >
                <td class="px-4 py-3 text-sm text-secondary-600">{{ index + 1 }}</td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                      record.type === 'Student' || record.type === 'Student & Parent'
                        ? 'bg-blue-100 text-blue-700'
                        : record.type === 'Staff'
                        ? 'bg-purple-100 text-purple-700'
                        : record.type === 'Parent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-secondary-100 text-secondary-700'
                    ]"
                  >
                    {{ record.type }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-secondary-900">{{ record.name }}</td>
                <td class="px-4 py-3 text-sm text-secondary-600">
                  {{ formatTime(record.signInTime) }}
                </td>
                <td class="px-4 py-3 text-sm text-secondary-600">
                  {{ formatTime(record?.signOutTime) }}
                </td>
              </tr>
              <tr v-if="!records.length">
                <td class="text-center px-4 py-12" colspan="5">
                  <i class="fa-solid fa-inbox text-4xl text-secondary-300 mb-3"></i>
                  <p class="text-sm text-secondary-500 font-medium">No records found</p>
                  <p class="text-xs text-secondary-400 mt-1">Try a different date or name</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Absent Students -->
      <div
        v-if="absentChildren.length && searchMode === 'date'"
        class="bg-white rounded-xl border border-secondary-200 shadow-xs overflow-hidden"
      >
        <div
          class="bg-linear-to-r from-danger-50 to-danger-100 px-5 py-4 border-b border-danger-200"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-danger-500 flex items-center justify-center">
              <i class="fa-solid fa-user-xmark text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-danger-900">Absent Students</h3>
              <p class="text-xs text-danger-600">Students who did not attend on {{ reportDay }}</p>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px]">
            <thead>
              <tr class="bg-secondary-50 border-b border-secondary-200">
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  #
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Sign In Time
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider"
                >
                  Sign Out Time
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-secondary-100">
              <tr
                v-for="(record, index) in absentChildren"
                :key="record.id"
                class="hover:bg-primary-50 cursor-pointer transition-colors"
              >
                <td class="px-4 py-3 text-sm text-secondary-600">{{ index + 1 }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700"
                  >
                    Student
                  </span>
                </td>
                <td class="px-4 py-3 text-sm font-medium text-secondary-900">
                  {{ record.firstName }} {{ record.lastName }}
                </td>
                <td class="px-4 py-3 text-sm text-secondary-400">-</td>
                <td class="px-4 py-3 text-sm text-secondary-400">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Sign Out Modal (Review Performance) -->
    <SignOutModal
      :show="showSignOutModal"
      :item="selectedRecord"
      :is-feedback-only="true"
      @update:show="showSignOutModal = $event"
      @onSuccess="onModalSuccess"
    />
  </div>
</template>
