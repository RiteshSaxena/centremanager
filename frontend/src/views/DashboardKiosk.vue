<template>
  <div class="row mt-5">
    <div class="col-md-4 order-2 order-md-1">
      <form class="d-flex flex-column gap-3 mb-3" @submit.prevent="searchStudents">
        <InputField
          :is-floating="true"
          v-model="studentLastName"
          placeholder="Enter Student Last Name"
          required
        />
        <InputField
          :is-floating="true"
          type="number"
          v-model="studentPhone"
          placeholder="Enter Parent Phone Number"
          required
        />
        <button type="submit" class="btn btn-info btn-lg rounded-3" :disabled="isSearching">
          {{ isSearching ? '...' : 'Sign In' }}
        </button>
      </form>
      <SearchResults v-if="isSearched" class="mt-3" @onSelect="onSelectFromSearch" />
    </div>
    <div class="col-md-4 order-1 order-md-2">
      <button type="button" class="btn btn-info btn-lg me-1" @click="qrSignIn">
        Scan QR <i class="ms-2 fa-solid fa-qrcode"></i>
      </button>
      <button type="button" class="btn btn-info btn-lg me-1" @click="guestSignInModal = true">
        Guest Sign In
      </button>
      <button
        type="button"
        class="btn btn-secondary btn-lg"
        @click="clearSearch"
        v-if="selectedStudent"
      >
        Clear
      </button>
      <div class="mt-3">
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
  <SignInModal v-model:show="signInModal" :item="selectedSignInItem" @onSuccess="clearSearch" />
  <SignOutModal v-model:show="signOutModal" :item="selectedSignOutItem" @onSuccess="clearSearch" />
</template>

<script setup lang="ts">
import type { LogRecord, SearchResult, Student } from '@/types';

import { computed, onMounted, onUnmounted, ref } from 'vue';

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
const guestSignInModal = ref(false);
const signInModal = ref(false);
const signOutModal = ref(false);
const isSearched = ref(false);

const studentLastName = ref('');
const studentPhone = ref('');
const signedInFilter = ref('');
const signedInFilterId = ref<number | null>(null);
const selectedStudent = ref<Student | null>(null);
const selectedSignInItem = ref<SearchResult | null>(null);
const selectedSignOutItem = ref<LogRecord | null>(null);

const isSearching = computed(() => {
  return searchStore.loading;
});

const clearSearch = () => {
  isSearched.value = false;
  selectedStudent.value = null;
  selectedSignInItem.value = null;
  selectedSignOutItem.value = null;
  searchStore.clearResults();
};

const searchStudents = async () => {
  await searchStore.searchByLastName(studentLastName.value, studentPhone.value.toString());
  isSearched.value = true;
};

const onAddGuardian = (data: any) => {
  selectedStudent.value?.parents.push({
    type: 'parent',
    ...data
  });
};

const onSelectFromSearch = (item: SearchResult) => {
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
