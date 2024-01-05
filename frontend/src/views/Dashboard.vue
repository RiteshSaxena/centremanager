<template>
  <div class="row mt-5">
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
    <div class="col-md-4 order-1 order-md-2">
      <button type="button" class="btn btn-info me-1" @click="qrSignIn">
        <i class="fa-solid fa-qrcode"></i>
      </button>
      <button type="button" class="btn btn-info me-1" @click="guestSignInModal = true">
        Guest SignIn
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        @click="clearSearch"
        v-if="selectedStudent && !search"
      >
        Clear
      </button>
      <div class="mt-3">
        <GuardianList
          v-if="selectedStudent"
          :student="selectedStudent"
          @onSelect="onSelectGuardian"
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
        <SignedInList :filter="signedInFilter" :filter-id="signedInFilterId" />
      </div>
    </div>
  </div>

  <ScanQRModal v-model:show="scanQRModal" @student="handleQrStudent" />
  <GuestSignInModal v-model:show="guestSignInModal" />
  <SignInModal
    v-model:show="signInModal"
    :selected-user="selectedUser"
    :loading="signing"
    @onSubmit="handleOnSubmit"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { debounce } from 'lodash';
import { useToast } from 'vue-toastification';

import InputField from '@/components/base/InputField.vue';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
import SignedInList from '@/components/SignedInList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignInModal from '@/components/GuestSignInModal.vue';
import SignInModal from '@/components/SignInModal.vue';

import { useSearchStore, useLogBookStore, useStudentStore } from '@/stores';

import type { Parent, SearchResult, Student } from '@/types';

const toast = useToast();
const searchStore = useSearchStore();
const logBookStore = useLogBookStore();
const studentStore = useStudentStore();

const scanQRModal = ref(false);
const qrMode = ref('');
const guestSignInModal = ref(false);
const signInModal = ref(false);
const signing = ref(false);

const search = ref('');
const signedInFilter = ref('');
const signedInFilterId = ref<number | null>(null);
const selectedStudent = ref<Student | null>(null);
const selectedUser = ref<SearchResult | null>(null);
const parents = ref<Parent[]>([]);

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value);
}, 500);

const clearSearch = () => {
  search.value = '';
  selectedStudent.value = null;
  selectedUser.value = null;
  parents.value = [];
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
  parents.value = [];
  selectedStudent.value = null;
  selectedUser.value = null;
  if (item.type === 'student') {
    selectedStudent.value = item;
    selectedStudent.value.parents = item.parents.map((parent) => {
      return {
        ...parent,
        type: 'parent'
      };
    });
  } else if (item.type === 'staff') {
    selectedUser.value = item;
    signInModal.value = true;
  }
};

const onSelectGuardian = (item: SearchResult) => {
  selectedUser.value = item;
  signInModal.value = true;
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

const handleOnSubmit = async (data: any) => {
  try {
    signing.value = true;
    const payload: any = {
      signature: data.signature
    };
    if (selectedUser.value?.type === 'staff') {
      payload.staff = selectedUser.value.id;
      payload.type = 'Staff';
    }
    if (selectedUser.value?.type === 'parent') {
      if (data.isParentWithStudent) {
        payload.type = 'StudentWithParent';
      } else {
        payload.type = 'Student';
      }
      payload.parent = selectedUser.value.id;
      payload.student = selectedStudent.value?.id;
    }
    const res = await logBookStore.signIn(payload);

    signInModal.value = false;
    toast.success('Signed Successfully');
    logBookStore.fetchList();
  } finally {
    signing.value = false;
  }
};
</script>
