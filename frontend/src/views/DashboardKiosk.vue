<template>
  <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center py-8">
    <div class="w-full max-w-2xl px-4">
      <!-- Welcome Header -->
      <div class="text-center mb-8" v-if="!(isSearched || selectedStudent)">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl mb-4 shadow-xl">
          <i class="fa-solid fa-building text-4xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold text-secondary-900 mb-2">
          Welcome to Kumon {{ centre?.displayName || centre?.name }}
        </h1>
        <p class="text-lg text-secondary-600">Please sign in or sign out</p>
      </div>

      <!-- Main Content -->
      <div v-if="!(isSearched || selectedStudent)">
        <!-- Search by Name Card -->
        <div class="bg-white rounded-2xl border border-secondary-200 shadow-xl p-8 mb-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <i class="fa-solid fa-user-check text-primary-600 text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-secondary-900">Student Sign In/Out</h2>
              <p class="text-sm text-secondary-500">Enter your last name to continue</p>
            </div>
          </div>

          <form class="space-y-4" @submit.prevent="searchStudents">
            <Input
              v-model="studentLastName"
              placeholder="Enter your last name..."
              required
              class="text-lg h-14"
            />
            <Button size="lg" class="w-full text-lg" :disabled="isSearching">
              <i v-if="!isSearching" class="fa-solid fa-arrow-right-to-bracket mr-3 text-xl"></i>
              {{ isSearching ? 'Searching...' : 'Continue' }}
            </Button>
          </form>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- QR Code -->
          <button
            @click="qrSignIn"
            class="group bg-white rounded-2xl border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-center hover:border-primary-400"
          >
            <div class="w-16 h-16 rounded-xl bg-primary-100 group-hover:bg-primary-500 flex items-center justify-center mx-auto mb-4 transition-colors">
              <i class="fa-solid fa-qrcode text-3xl text-primary-600 group-hover:text-white transition-colors"></i>
            </div>
            <h3 class="font-bold text-secondary-900 mb-1">Scan QR Code</h3>
            <p class="text-xs text-secondary-500">Quick sign in with your QR</p>
          </button>

          <!-- Guest Sign In -->
          <button
            @click="guestSignInModal = true"
            class="group bg-white rounded-2xl border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-center hover:border-success-400"
          >
            <div class="w-16 h-16 rounded-xl bg-success-100 group-hover:bg-success-500 flex items-center justify-center mx-auto mb-4 transition-colors">
              <i class="fa-solid fa-user-plus text-3xl text-success-600 group-hover:text-white transition-colors"></i>
            </div>
            <h3 class="font-bold text-secondary-900 mb-1">Guest Sign In</h3>
            <p class="text-xs text-secondary-500">Visitors and guests</p>
          </button>

          <!-- Guest Sign Out -->
          <button
            @click="guestSignOutModal = true"
            class="group bg-white rounded-2xl border border-secondary-200 shadow-lg hover:shadow-xl transition-all duration-200 p-6 text-center hover:border-warning-400"
          >
            <div class="w-16 h-16 rounded-xl bg-warning-100 group-hover:bg-warning-500 flex items-center justify-center mx-auto mb-4 transition-colors">
              <i class="fa-solid fa-user-minus text-3xl text-warning-600 group-hover:text-white transition-colors"></i>
            </div>
            <h3 class="font-bold text-secondary-900 mb-1">Guest Sign Out</h3>
            <p class="text-xs text-secondary-500">Leaving the centre</p>
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div v-if="isSearched && !selectedStudent" class="space-y-4">
        <div class="bg-white rounded-2xl border border-secondary-200 shadow-xl p-6">
          <SearchResults @onSelect="onSelectFromSearch" />
        </div>
        <Button variant="outline" size="lg" class="w-full" @click="clearSearch">
          <i class="fa-solid fa-arrow-left mr-2"></i>
          Back to Home
        </Button>
      </div>

      <!-- Guardian Selection -->
      <div v-if="selectedStudent" class="space-y-4">
        <GuardianList
          :student="selectedStudent"
          @onSelectSignIn="onSelectGuardian"
          @onSelectSignOut="onSelectSignOut"
          @onAddGuardian="onAddGuardian"
        />
        <Button variant="outline" size="lg" class="w-full" @click="clearSearch">
          <i class="fa-solid fa-arrow-left mr-2"></i>
          Back to Home
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

import { useSearchStore, useLogBookStore, useStudentStore, useSlotStore, useUserStore } from '@/stores';
import errorHandler from '@/utils/error-handler';

const slotStore = useSlotStore();
const searchStore = useSearchStore();
const logBookStore = useLogBookStore();
const studentStore = useStudentStore();
const userStore = useUserStore();

const centre = ref<any>(null);

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
  centre.value = await userStore.getCentre();
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
