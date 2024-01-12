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
  <div class="w-100 vh-100 px-3 d-flex justify-content-center align-items-center">
    <div class="login-card rounded shadow bg-white my-5">
      <h3 class="mb-4">Login</h3>
      <form @submit.prevent="login">
        <div class="form-floating mb-3">
          <input
            placeholder="Email address"
            type="email"
            class="form-control"
            autocomplete="on"
            v-model="email"
            required
          />
          <label>Email address</label>
        </div>
        <div class="form-floating mb-4">
          <input
            type="password"
            class="form-control"
            v-model="password"
            placeholder="Password"
            required
          />
          <label>Password</label>
        </div>
        <button type="submit" class="btn btn-lg px-4 btn-info mb-4" :disabled="loading">
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

.form-control:focus {
  box-shadow: none;
  border-color: #193b4d;
}
</style>
