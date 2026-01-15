<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left Panel: Sign In -->
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-secondary-900">Sign In</h2>
        <div class="flex gap-2">
          <Button size="sm" @click="qrSignIn">
            <i class="fa-solid fa-qrcode mr-2"></i> Scan QR
          </Button>
          <Button size="sm" variant="secondary" @click="guestSignInModal = true">
            <i class="fa-solid fa-user-plus mr-2"></i> Guest
          </Button>
        </div>
      </div>

      <!-- Search Section -->
      <div class="bg-white rounded-xl border border-secondary-200 p-4 shadow-sm">
        <div class="flex gap-2">
          <Input v-model="search" placeholder="Search student or staff name..." class="flex-1" />
          <Button v-if="search.trim().length" variant="ghost" size="sm" @click="clearSearch">
            <i class="fa-solid fa-xmark"></i>
          </Button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="search.trim().length">
        <SearchResults @onSelect="onSelectFromSearch" />
      </div>

      <!-- Selected Student Section -->
      <div v-if="selectedStudent" id="student-row">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-secondary-700 uppercase tracking-wide">
            Selected Student
          </h3>
          <Button variant="ghost" size="sm" @click="clearSearch">
            <i class="fa-solid fa-xmark mr-1"></i> Clear
          </Button>
        </div>
        <GuardianList
          :student="selectedStudent"
          @onSelectSignIn="onSelectGuardian"
          @onSelectSignOut="onSelectSignOut"
          @onAddGuardian="onAddGuardian"
        />
      </div>

      <div
        v-if="!search.trim().length"
        class="bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-200 p-8 text-center"
      >
        <i class="fa-solid fa-search text-3xl text-secondary-300 mb-3"></i>
        <p class="text-secondary-500 text-sm">Search for a student or staff member to sign in</p>
      </div>
    </div>

    <!-- Right Panel: Signed In -->
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-secondary-900">Signed In</h2>
        <div class="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            @click="logBookStore.fetchList"
            :disabled="logBookStore.fetching"
          >
            <i
              class="fa-solid fa-arrows-rotate"
              :class="{ 'animate-spin': logBookStore.fetching }"
            ></i>
          </Button>
          <Button size="sm" @click="qrSignOut">
            <i class="fa-solid fa-qrcode"></i>
          </Button>
        </div>
      </div>

      <!-- Filter Section -->
      <div class="relative">
        <div class="bg-white rounded-xl border border-secondary-200 p-4 shadow-sm">
          <div class="flex gap-2">
            <Input v-model="signedInFilter" placeholder="Filter signed in..." class="flex-1" />
            <Button
              v-if="signedInFilter.length || signedInFilterId"
              variant="ghost"
              size="sm"
              @click="
                signedInFilter = '';
                signedInFilterId = null;
              "
            >
              <i class="fa-solid fa-xmark"></i>
            </Button>
          </div>
        </div>
      </div>

      <!-- Signed In List -->
      <SignedInList
        :filter="signedInFilter"
        :filter-id="signedInFilterId"
        @onSelect="onSelectSignOut"
        @onFeedback="onFeedbackModal"
      />
    </div>
  </div>

  <ScanQRModal v-model:show="scanQRModal" @student="handleQrStudent" />
  <GuestSignInModal v-model:show="guestSignInModal" />
  <SignInModal
    v-model:show="signInModal"
    :is-qr-mode="qrMode !== ''"
    :item="selectedSignInItem"
    @onSuccess="clearSearch"
  />
  <SignOutModal
    v-model:show="signOutModal"
    :is-qr-mode="qrMode !== ''"
    :item="selectedSignOutItem"
    @onSuccess="clearSearch"
  />
  <FeedbackModal
    v-model:show="feedbackModal"
    :item="selectedSignOutItem"
    @onSuccess="clearSearch"
  />
</template>

<script setup lang="ts">
import type { LogRecord, SearchResult, Student } from '@/types';

import { onMounted, onUnmounted, ref, watch } from 'vue';
import { debounce } from 'lodash';

import { Input } from '@/components/ui';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
import SignedInList from '@/components/SignedInList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignInModal from '@/components/GuestSignInModal.vue';
import SignInModal from '@/components/SignInModal.vue';
import SignOutModal from '@/components/SignOutModal.vue';
import FeedbackModal from '@/components/FeedbackModal.vue';
import { Button } from '@/components/ui';

import { useSearchStore, useLogBookStore, useStudentStore } from '@/stores';

const searchStore = useSearchStore();
const logBookStore = useLogBookStore();
const studentStore = useStudentStore();

const qrMode = ref('');
const scanQRModal = ref(false);
const signOutModal = ref(false);
const feedbackModal = ref(false);
const guestSignInModal = ref(false);
const signInModal = ref(false);

const search = ref('');
const signedInFilter = ref('');
const signedInFilterId = ref<number | null>(null);
const selectedStudent = ref<Student | null>(null);
const selectedSignInItem = ref<SearchResult | null>(null);
const selectedSignOutItem = ref<LogRecord | null>(null);

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value);
}, 500);

const clearSearch = () => {
  search.value = '';
  signedInFilter.value = '';
  signedInFilterId.value = null;
  selectedStudent.value = null;
  selectedSignInItem.value = null;
  selectedSignOutItem.value = null;
  searchStore.clearResults();
};

watch(search, () => {
  if (search.value.trim().length) {
    debouncedSearch(search.value.trim());
  } else {
    clearSearch();
  }
});

const onAddGuardian = (data: any) => {
  selectedStudent.value?.parents.push({
    type: 'parent',
    ...data
  });
};

const onSelectFromSearch = (item: SearchResult) => {
  qrMode.value = '';
  selectedStudent.value = null;
  selectedSignInItem.value = null;
  if (item.type === 'student') {
    selectedStudent.value = item;
    selectedStudent.value.parents = item.parents.map((parent) => {
      return {
        ...parent,
        student: item.id,
        type: 'parent'
      };
    });
  } else if (item.type === 'staff') {
    selectedSignInItem.value = item;
    signInModal.value = true;
  }
};

const onSelectGuardian = (item: SearchResult) => {
  selectedSignInItem.value = item;
  signInModal.value = true;
};

const onSelectSignOut = (item: LogRecord) => {
  if (!signedInFilterId.value) {
    qrMode.value = '';
  }

  selectedSignOutItem.value = item;
  signOutModal.value = true;
};
const onFeedbackModal = (item: LogRecord) => {
  selectedSignOutItem.value = item;
  feedbackModal.value = true;
};

const handleQrStudent = async (id: number) => {
  if (qrMode.value === 'signIn') {
    const student = await studentStore.fetchStudent(id);
    selectedStudent.value = student;
    selectedStudent.value.parents = student.parents.map((parent) => {
      return {
        ...parent,
        type: 'parent'
      };
    });
  } else if (qrMode.value === 'signOut') {
    signedInFilterId.value = id;
  }
};

const qrSignIn = () => {
  qrMode.value = 'signIn';
  scanQRModal.value = true;
};

const qrSignOut = () => {
  qrMode.value = 'signOut';
  scanQRModal.value = true;
};

let logBookTimer: any = null;

onMounted(async () => {
  await logBookStore.fetchList();
  logBookTimer = setInterval(async () => {
    await logBookStore.fetchList();
  }, 1000 * 60);
});

onUnmounted(() => {
  if (logBookTimer) {
    clearInterval(logBookTimer);
  }
});
</script>
