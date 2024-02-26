<template>
  <div class="row mt-5">
    <div class="col-md-3"></div>
    <div class="col-md-6 order-2 order-md-1">
      <div v-if="!(isSearched || selectedStudent)">
        <form
          class="d-flex flex-column gap-3 mb-4"
          v-if="!(isSearched || selectedStudent)"
          @submit.prevent="searchStudents"
        >
          <InputField
            :has-dark-placeholder="true"
            :is-floating="true"
            v-model="studentLastName"
            placeholder="Enter Student Last Name"
            required
          />
          <button type="submit" class="btn btn-info btn-lg rounded-3" :disabled="isSearching">
            {{ isSearching ? '...' : 'Sign In / Sign Out' }}
          </button>
        </form>
        <hr />
        <div class="d-flex justify-content-between gap-2 mt-4">
          <button type="button" class="btn btn-info btn-lg flex-1" @click="qrSignIn">
            Scan QR <i class="ms-2 fa-solid fa-qrcode"></i>
          </button>
          <button type="button" class="btn btn-info btn-lg flex-1" @click="guestSignInModal = true">
            Guest Sign In
          </button>
        </div>
      </div>
      <SearchResults
        v-if="isSearched && !selectedStudent"
        class="mt-4"
        @onSelect="onSelectFromSearch"
      />
      <GuardianList
        v-if="selectedStudent"
        :student="selectedStudent"
        @onSelectSignIn="onSelectGuardian"
        @onSelectSignOut="onSelectSignOut"
        @onAddGuardian="onAddGuardian"
      />
      <div v-if="isSearched || selectedStudent" class="d-flex justify-content-center mt-3">
        <button type="button" class="btn w-100 btn-outline-secondary" @click="clearSearch">
          Back
        </button>
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

import { computed, onMounted, onUnmounted, ref } from 'vue';

import InputField from '@/components/base/InputField.vue';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
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
const selectedStudent = ref<Student | null>(null);
const selectedSignInItem = ref<SearchResult | null>(null);
const selectedSignOutItem = ref<LogRecord | null>(null);

const isSearching = computed(() => {
  return searchStore.loading;
});

const clearSearch = () => {
  studentLastName.value = '';
  isSearched.value = false;
  selectedStudent.value = null;
  selectedSignInItem.value = null;
  selectedSignOutItem.value = null;
  searchStore.clearResults();
};

const searchStudents = async () => {
  qrMode.value = '';
  await searchStore.searchByLastName(studentLastName.value);
  if (searchStore.results.length === 1) {
    onSelectFromSearch(searchStore.results[0]);
  }
  isSearched.value = true;
};

const onAddGuardian = (data: any) => {
  selectedStudent.value?.parents.push({
    type: 'parent',
    student: selectedStudent.value?.id,
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
        student: id,
        type: 'parent'
      };
    });
  }
};

const qrSignIn = () => {
  qrMode.value = 'signIn';
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
<style scoped lang="scss">
.button-large {
  padding: 0.8rem 1.3rem !important;
}
.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
</style>
