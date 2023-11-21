<template>
  <div class="pt-4 px-4">
    <CentreHeader />
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
        <button type="button" class="btn btn-info me-2" @click="scanQRModal = true">Scan QR</button>
        <button type="button" class="btn btn-info" @click="guestSignInModal = true">
          Guest SignIn
        </button>
        <div class="mt-3">
          <GuardianList
            v-if="selectedStudentId"
            :items="parents"
            :student-id="selectedStudentId"
            @onSelect="onSelectGuardian"
            @onAddGuardian="onAddGuardian"
          />
        </div>
      </div>
      <div class="col-md-4 order-3">
        <div class="d-flex gap-1">
          <InputField v-model="signedInFilter" placeholder="Filter" />
          <button
            v-if="signedInFilter.length"
            type="button"
            class="btn btn-secondary rounded-3"
            @click="signedInFilter = ''"
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
        </div>
        <div class="mt-3">
          <SignedInList :filter="signedInFilter" />
        </div>
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
import { debounce } from 'lodash';
import { useToast } from 'vue-toastification';

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

const toast = useToast();
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

const debouncedSearch = debounce((value: string) => {
  searchStore.search(value);
}, 500);

const clearSearch = () => {
  search.value = '';
  selectedStudentId.value = null;
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
  parents.value.push({
    type: 'parent',
    ...data
  });
};

const onSelectFromSearch = (item: SearchResult) => {
  parents.value = [];
  selectedStudentId.value = null;
  selectedUser.value = null;
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
      payload.student = selectedStudentId.value;
    }
    const res = await logBookStore.signIn(payload);

    console.log(res);
    signInModal.value = false;
    toast.success('Signed Successfully');
    logBookStore.fetchList();
  } finally {
    signing.value = false;
  }
};
</script>
