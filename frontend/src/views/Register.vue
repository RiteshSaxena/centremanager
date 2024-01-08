<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

import { useUserStore } from '@/stores';

import errorHandler from '@/utils/error-handler';

const inviteCode = ref('');
const firstName = ref('');
const lastName = ref('');
const phoneNumber = ref('');
const centerName = ref('');
const centerRegion = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);

const userStore = useUserStore();
const router = useRouter();
const toast = useToast();

const login = async () => {
  try {
    loading.value = true;
    await userStore.register({
      inviteCode: inviteCode.value,
      firstName: firstName.value,
      lastName: lastName.value,
      phoneNumber: phoneNumber.value,
      centerName: centerName.value,
      centerRegion: centerRegion.value,
      email: email.value,
      password: password.value
    });
    toast.success('Registration successful!');
    await router.push({ name: 'Login' });
  } catch (err) {
    errorHandler(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="w-100 d-flex justify-content-center align-items-center">
    <div class="login-card rounded shadow bg-white my-5">
      <h3 class="mb-4">Register</h3>
      <form @submit.prevent="login">
        <div class="mb-3">
          <label class="form-label">Invite Code</label>
          <input type="text" class="form-control" v-model="inviteCode" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Centre Name</label>
          <input type="text" class="form-control" v-model="centerName" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Centre Region</label>
          <input type="text" class="form-control" v-model="centerRegion" required />
        </div>
        <div class="mb-3">
          <label class="form-label">First Name</label>
          <input type="text" class="form-control" v-model="firstName" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Last Name</label>
          <input type="text" class="form-control" v-model="lastName" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Phone Number</label>
          <input type="text" class="form-control" v-model="phoneNumber" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Email address</label>
          <input type="email" class="form-control" autocomplete="on" v-model="email" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" v-model="password" required />
        </div>
        <button type="submit" class="btn px-4 mb-3 btn-info" :disabled="loading">
          Register
          <span v-if="loading" class="spinner-border spinner-border-sm ms-2"></span>
        </button>
        <p class="text-muted m-0">
          Already have an account?
          <router-link to="/login" class="text-info text-decoration-none">Login</router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-card {
  width: 450px;
  padding: 30px;
}
</style>
