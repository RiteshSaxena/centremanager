<template>
  <div class="pt-4 px-4">
    <CentreHeader />
    <div class="row mt-5">
      <div class="col">
        <InputField placeholder="Search for students / staff" />
      </div>
      <div class="col">
        <button type="button" class="btn btn-info me-2" @click="scanQRModal = true">Scan QR</button>
        <button type="button" class="btn btn-info" @click="guestSignInModal = true">
          Guest SignIn
        </button>
      </div>
      <div class="col">
        <InputField placeholder="Filter" />
      </div>
    </div>

    <div class="row mt-3">
      <div class="col">
        <StudentList />
      </div>
      <div class="col">
        <GuardianList />
      </div>
      <div class="col">
        <SignedInList />
      </div>
    </div>
    <ScanQRModal v-model:show="scanQRModal" />
    <GuestSignIn v-model:show="guestSignInModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import InputField from '@/components/base/InputField.vue';
import CentreHeader from '@/components/CentreHeader.vue';
import StudentList from '@/components/StudentList.vue';
import GuardianList from '@/components/GuardianList.vue';
import SignedInList from '@/components/SignedInList.vue';
import ScanQRModal from '@/components/ScanQRModal.vue';
import GuestSignIn from '@/components/GuestSignIn.vue';

const scanQRModal = ref(false);
const guestSignInModal = ref(false);
</script>
