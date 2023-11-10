<template>
  <div class="pt-4 px-4">
    <CentreHeader />
    <div class="row mt-5">
      <div class="col-md-4">
        <InputField v-model="search" placeholder="Enter Student or Staff name to search" />
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
        <SearchResults v-if="search.trim().length" @onSelect="onSelectFromSearch" />
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
        <SignedInList :filter="signedInFilter" />
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
import { onMounted, ref, watch } from 'vue';
import { debounce } from 'lodash';

import InputField from '@/components/base/InputField.vue';
import CentreHeader from '@/components/CentreHeader.vue';
import SearchResults from '@/components/SearchResults.vue';
import GuardianList from '@/components/GuardianList.vue';
import SignedInList from '@/components/SignedInList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignInModal from '@/components/GuestSignInModal.vue';
import SignInModal from '@/components/SignInModal.vue';

import { useSearchStore, useLogBookStore } from '@/stores';
import { useToast } from 'vue-toastification';

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

watch(search, () => {
  if (search.value.trim().length) {
    debouncedSearch(search.value.trim());
  } else {
    selectedStudentId.value = null;
    selectedUser.value = null;
    parents.value = [];
    searchStore.clearResults();
  }
});

onMounted(() => {
  logBookStore.fetchList();
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
