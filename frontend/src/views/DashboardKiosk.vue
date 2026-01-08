<template>
  <div class="flex justify-center mt-12">
    <div class="w-full max-w-md">
      <div v-if="!(isSearched || selectedStudent)">
        <form
          class="flex flex-col gap-3 mb-4"
          v-if="!(isSearched || selectedStudent)"
          @submit.prevent="searchStudents"
        >
          <Input
            :has-dark-placeholder="true"
            :is-floating="true"
            v-model="studentLastName"
            placeholder="Enter Student Last Name"
            required
          />
          <Button size="lg" class="w-full" :disabled="isSearching">
            {{ isSearching ? '...' : 'Sign In / Sign Out' }}
          </Button>
        </form>
        <hr class="border-secondary-200" />
        <div class="flex justify-between gap-2 mt-4">
          <Button size="lg" class="flex-1" @click="qrSignIn">
            Scan QR <i class="ml-2 fa-solid fa-qrcode"></i>
          </Button>
        </div>
        <div class="flex justify-between gap-2 mt-4">
          <Button size="lg" class="flex-1" @click="guestSignInModal = true">
            Guest Sign In
          </Button>
          <Button size="lg" class="flex-1" @click="guestSignOutModal = true">
            Guest Sign Out
          </Button>
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
      <div v-if="isSearched || selectedStudent" class="flex justify-center mt-3">
        <Button variant="outline" class="w-full" @click="clearSearch">
          Back
        </Button>
      </div>
    </div>
  </div>

  <ScanQRModal v-model:show="scanQRModal" @student="handleQrStudent" />
  <GuestSignInModal v-model:show="guestSignInModal" />
  <GuestSignOutModal v-model:show="guestSignOutModal" @onSelect="onSelectSignOut" />
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

import { Input } from '@/components/ui';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignInModal from '@/components/GuestSignInModal.vue';
import GuestSignOutModal from '@/components/GuestSignOutModal.vue';
import SignInModal from '@/components/SignInModal.vue';
import SignOutModal from '@/components/SignOutModal.vue';
import { Button } from '@/components/ui';

import { useSearchStore, useLogBookStore, useStudentStore, useSlotStore } from '@/stores';
import errorHandler from '@/utils/error-handler';

const slotStore = useSlotStore();
const searchStore = useSearchStore();
const logBookStore = useLogBookStore();
const studentStore = useStudentStore();

const qrMode = ref('');
const scanQRModal = ref(false);
const guestSignInModal = ref(false);
const guestSignOutModal = ref(false);
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
  logBookStore.fetchList();
};

const searchStudents = async () => {
  qrMode.value = '';
  await searchStore.searchByLastName(studentLastName.value.trim());
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
    const isSignedInRecord = logBookStore.list.find(
      (log) => log.type === 'Staff' && log.staff?.id === item.id && !log.signOutTime
    );
    if (isSignedInRecord) {
      selectedSignOutItem.value = isSignedInRecord;
      signOutModal.value = true;
    } else {
      selectedSignInItem.value = item;
      signInModal.value = true;
    }
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
  logBookStore
    .fetchList()
    .then()
    .catch((err) => errorHandler(err));
  slotStore
    .fetchSlots()
    .then()
    .catch((err) => errorHandler(err));
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
