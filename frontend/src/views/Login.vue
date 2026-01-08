<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores';
import errorHandler from '@/utils/error-handler';
import { Button, Input, Card } from '@/components/ui';

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
  <div
    class="min-h-screen w-full px-4 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-100"
  >
    <div class="w-full max-w-md">
      <Card>
        <template #header>
          <h1 class="text-xl font-bold text-secondary-900">Welcome Back</h1>
          <p class="text-sm text-secondary-500 mt-1">Sign in to your account</p>
        </template>

        <form @submit.prevent="login" class="space-y-5">
          <Input
            v-model="email"
            type="email"
            label="Email address"
            placeholder="Enter your email"
            autocomplete="email"
            required
          />

          <Input
            v-model="password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
          />

          <Button type="submit" variant="primary" size="lg" block :loading="loading">
            Sign In
          </Button>

          <p class="text-center text-sm text-secondary-500">
            Don't have an account?
            <router-link to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
              Register
            </router-link>
          </p>
        </form>
      </Card>
    </div>
  </div>
</template>
