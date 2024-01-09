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
  <div class="w-100 min-vh-100 d-flex justify-content-center align-items-center">
    <div class="register-card rounded shadow bg-white my-5">
      <h3 class="mb-4 mt-2">Register</h3>
      <form @submit.prevent="login">
        <div class="row gx-3 mb-3">
          <div class="col-sm-6">
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                v-model="inviteCode"
                placeholder="Invite Code"
                required
              />
              <label class="form-label">Invite Code</label>
            </div>
          </div>
          <div class="col-sm-6">
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                placeholder="Centre Name"
                v-model="centerName"
                required
              />
              <label class="form-label">Centre Name</label>
            </div>
          </div>
        </div>
        <div class="row gx-3 mb-3">
          <div class="col-sm-6">
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                placeholder="First Name"
                v-model="firstName"
                required
              />
              <label class="form-label">First Name</label>
            </div>
          </div>
          <div class="col-sm-6">
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                placeholder="Last Name"
                v-model="lastName"
                required
              />
              <label class="form-label">Last Name</label>
            </div>
          </div>
        </div>
        <div class="row gx-3 mb-3">
          <div class="col-sm-6">
            <div class="form-floating">
              <input
                type="email"
                class="form-control"
                placeholder="Email address"
                autocomplete="on"
                v-model="email"
                required
              />
              <label>Email address</label>
            </div>
          </div>
          <div class="col-sm-6">
            <div class="form-floating">
              <input
                type="text"
                class="form-control"
                placeholder="Phone Number"
                v-model="phoneNumber"
                required
              />
              <label>Phone Number</label>
            </div>
          </div>
        </div>
        <div class="row gx-3 mb-4">
          <div class="col-sm-12">
            <div class="form-floating">
              <input
                type="password"
                class="form-control"
                placeholder="Password"
                v-model="password"
                required
              />
              <label>Password</label>
            </div>
          </div>
        </div>
        <div class="row gx-3 align-items-center mb-2">
          <div class="col-sm-6">
            <p class="text-muted m-0">
              Already have an account?
              <router-link to="/login" class="text-info text-decoration-none">Login</router-link>
            </p>
          </div>
          <div class="col-sm-6 justify-content-end d-flex">
            <button type="submit" class="btn btn-lg px-4 btn-info" :disabled="loading">
              Register
              <span v-if="loading" class="spinner-border spinner-border-sm ms-2"></span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-card {
  width: 650px;
  padding: 30px;
}
</style>
