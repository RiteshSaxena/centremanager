<template>
  <div class="pt-4 px-4">
    <CentreHeader />
    <div class="row mt-5">
      <div class="col-md-4">
        <InputField v-model="search" placeholder="Search for students / staff" />
      </div>
      <div class="col-md-4">
        <button type="button" class="btn btn-info me-2" @click="scanQRModal = true">Scan QR</button>
        <button type="button" class="btn btn-info" @click="guestSignInModal = true">
          Guest SignIn
        </button>
      </div>
      <div class="col-md-4">
        <InputField v-model="signedInFilter" placeholder="Filter" />
      </div>
    </div>

    <div class="row mt-3">
      <div class="col-md-4">
        <SearchResults v-if="search.length" @onSelect="onSelectFromSearch" />
      </div>
      <div class="col-md-4">
        <GuardianList
          v-if="selectedStudentId"
          :items="parents"
          :student-id="selectedStudentId"
          @onSelect="onSelectGuardian"
          @onAddGuardian="onAddGuardian"
        />
      </div>
      <div class="col-md-4">
        <SignedInList />
      </div>
    </div>
    <ScanQRModal v-model:show="scanQRModal" />
    <GuestSignInModal v-model:show="guestSignInModal" />
    <SignInModal
      v-model:show="signInModal"
      :selected-user="selectedUser"
      :loading="signing"
      @onSubmit="handleOnSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

import InputField from '@/components/base/InputField.vue';
import CentreHeader from '@/components/CentreHeader.vue';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
import SignedInList from '@/components/SignedInList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignInModal from '@/components/GuestSignInModal.vue';
import SignInModal from '@/components/SignInModal.vue';

import { useSearchStore, useLogBookStore } from '@/stores';
import type { Parent, SearchResult } from '@/types';

const searchStore = useSearchStore();
const logBookStore = useLogBookStore();

const scanQRModal = ref(false);
const guestSignInModal = ref(false);
const signInModal = ref(false);
const signing = ref(false);

const search = ref('');
const signedInFilter = ref('');
const selectedStudentId = ref<number | null>(null);
const selectedUser = ref<SearchResult | null>(null);
const parents = ref<Parent[]>([]);

watch(search, () => {
  searchStore.search(search.value);
});

const onAddGuardian = (data: any) => {
  parents.value.push({
    type: 'parent',
    ...data
  });
};

const onSelectFromSearch = (item: SearchResult) => {
  selectedStudentId.value = null;
  if (item.type === 'student') {
    selectedStudentId.value = item.id;
    parents.value = [];
    parents.value = item.parents.map((parent) => {
      return {
        type: 'parent',
        ...parent
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

const handleOnSubmit = async (data: any) => {
  try {
    signing.value = true;
    const payload: any = {
      ...data
    };
    if (selectedUser.value?.type === 'staff') {
      payload.staff = selectedUser.value.id;
      payload.isStaff = true;
    }
    if (selectedUser.value?.type === 'parent') {
      payload.parent = selectedUser.value.id;
      payload.isStudent = true;
      payload.student = selectedStudentId.value;
    }
    const res = await logBookStore.signIn(payload);

    console.log(res);
    signInModal.value = false;
  } finally {
    signing.value = false;
  }
};
</script>
