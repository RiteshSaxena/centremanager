<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@/stores';

import errorHandler from '@/utils/error-handler';

const email = ref('');
const password = ref('');
const loading = ref(false);

const userStore = useUserStore();
const router = useRouter();

const login = async () => {
  try {
    loading.value = true;
    await userStore.login(email.value, password.value);
    await router.push({ name: 'Dashboard' });
  } catch (err) {
    errorHandler(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="w-100 vh-100 d-flex justify-content-center align-items-center">
    <div class="login-card rounded shadow bg-white my-5">
      <h3 class="mb-4">Login</h3>
      <form @submit.prevent="login">
        <div class="mb-3">
          <label class="form-label">Email address</label>
          <input type="email" class="form-control" autocomplete="on" v-model="email" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" class="form-control" v-model="password" required />
        </div>
        <button type="submit" class="btn px-4 btn-info mb-3" :disabled="loading">
          Login
          <span v-if="loading" class="spinner-border spinner-border-sm ms-2"></span>
        </button>
        <p class="text-muted m-0">
          Don't have a account?
          <router-link to="/register" class="text-info text-decoration-none">Register</router-link>
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
