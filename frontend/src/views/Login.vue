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
    class="min-h-screen w-full px-4 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50"
  >
    <div class="w-full max-w-md">
      <!-- Logo/Brand Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg"
        >
          <i class="fa-solid fa-graduation-cap text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-bold text-secondary-900 mb-2">Centre Manager</h1>
        <p class="text-secondary-500">Welcome back! Please sign in to continue.</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8">
        <form @submit.prevent="login" class="space-y-5">
          <Input
            v-model="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />

          <Input
            v-model="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            :block="true"
            :loading="loading"
            :disabled="loading"
          >
            <i v-if="!loading" class="fa-solid fa-right-to-bracket mr-2"></i>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </Button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-secondary-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-secondary-500">New to the platform?</span>
            </div>
          </div>

          <router-link
            to="/register"
            class="block text-center py-2.5 px-4 rounded-xl border-2 border-secondary-200 text-secondary-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 font-medium transition-all duration-200"
          >
            Create an account
          </router-link>
        </form>
      </div>

      <!-- Footer -->
      <p class="text-center text-xs text-secondary-400 mt-8">
        © 2026 Centre Manager. All rights reserved.
      </p>
    </div>
  </div>
</template>
