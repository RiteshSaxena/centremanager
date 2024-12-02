<template>
  <div class="row mt-2">
    <div class="col-md-4 order-2 order-md-1">
      <div class="d-flex gap-1 mb-3">
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
      <SearchResults class="mt-3" v-if="search.trim().length" @onSelect="onSelectFromSearch" />
    </div>
    <div class="col-md-4 order-1 order-md-2" id="student-row">
      <button type="button" class="btn btn-info me-1" @click="qrSignIn">
        Scan QR <i class="ms-2 fa-solid fa-qrcode"></i>
      </button>
      <button type="button" class="btn btn-info me-1" @click="guestSignInModal = true">
        Guest Sign In
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        @click="clearSearch"
        v-if="selectedStudent && !search"
      >
        Clear
      </button>
      <div class="my-3">
        <GuardianList
          v-if="selectedStudent"
          :student="selectedStudent"
          @onSelectSignIn="onSelectGuardian"
          @onSelectSignOut="onSelectSignOut"
          @onAddGuardian="onAddGuardian"
        />
      </div>
    </div>
    <div class="col-md-4 order-3">
      <div class="d-flex gap-1">
        <InputField v-model="signedInFilter" placeholder="Filter" />
        <button
          v-if="signedInFilter.length || signedInFilterId"
          type="button"
          class="btn btn-secondary rounded-3"
          @click="
            signedInFilter = '';
            signedInFilterId = null;
          "
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
        <button
          type="button"
          class="btn btn-secondary rounded-3"
          @click="logBookStore.fetchList"
          :disabled="logBookStore.fetching"
        >
          <i class="fa-solid fa-arrows-rotate"></i>
        </button>
        <button type="button" class="btn btn-info rounded-3" @click="qrSignOut">
          <i class="fa-solid fa-qrcode"></i>
        </button>
      </div>
      <div class="mt-3">
        <SignedInList
          :filter="signedInFilter"
          :filter-id="signedInFilterId"
          @onSelect="onSelectSignOut"
        />
      </div>
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
</template>

<script setup lang="ts">
import type { LogRecord, SearchResult, Student } from '@/types';

import { onMounted, onUnmounted, ref, watch } from 'vue';
import { debounce } from 'lodash';

import InputField from '@/components/base/InputField.vue';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
import SignedInList from '@/components/SignedInList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignInModal from '@/components/GuestSignInModal.vue';
import SignInModal from '@/components/SignInModal.vue';
import SignOutModal from '@/components/SignOutModal.vue';

import { useSearchStore, useLogBookStore, useStudentStore } from '@/stores';

const searchStore = useSearchStore();
const logBookStore = useLogBookStore();
const studentStore = useStudentStore();

const qrMode = ref('');
const scanQRModal = ref(false);
const signOutModal = ref(false);
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
