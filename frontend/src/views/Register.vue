<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/stores';
import errorHandler from '@/utils/error-handler';
import { Button, Input, Card } from '@/components/ui';

const inviteCode = ref('');
const firstName = ref('');
const lastName = ref('');
const phoneNumber = ref('');
const centerName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const userStore = useUserStore();
const router = useRouter();
const toast = useToast();

const register = async () => {
  try {
    loading.value = true;
    if (password.value !== confirmPassword.value) {
      toast.error('Passwords do not match!');
      return;
    }
    await userStore.register({
      inviteCode: inviteCode.value,
      firstName: firstName.value,
      lastName: lastName.value,
      phoneNumber: `${phoneNumber.value}`,
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
  <div
    class="min-h-screen w-full px-4 py-8 flex items-center justify-center bg-linear-to-br from-primary-50 via-white to-accent-50"
  >
    <div class="w-full max-w-3xl">
      <!-- Logo/Brand Section -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl mb-4 shadow-lg"
        >
          <i class="fa-solid fa-graduation-cap text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-bold text-secondary-900 mb-2">Register Your Centre</h1>
        <p class="text-secondary-500">Create an account to get started with Centre Manager</p>
      </div>

      <!-- Register Card -->
      <div class="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8">
        <form @submit.prevent="register" class="space-y-6">
          <!-- Centre Information -->
          <div>
            <h3 class="text-sm font-semibold text-secondary-700 uppercase tracking-wide mb-4">
              Centre Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                v-model="inviteCode"
                type="text"
                label="Invite Code"
                placeholder="Enter invite code"
                required
              />
              <Input
                v-model="centerName"
                type="text"
                label="Centre Name"
                placeholder="Enter centre name"
                required
              />
            </div>
          </div>

          <!-- Personal Information -->
          <div>
            <h3 class="text-sm font-semibold text-secondary-700 uppercase tracking-wide mb-4">
              Personal Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                v-model="firstName"
                type="text"
                label="First Name"
                placeholder="Enter first name"
                required
              />
              <Input
                v-model="lastName"
                type="text"
                label="Last Name"
                placeholder="Enter last name"
                required
              />
              <Input
                v-model="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                autocomplete="email"
                required
              />
              <Input
                v-model="phoneNumber"
                type="tel"
                label="Phone Number"
                placeholder="(123) 456-7890"
                inputmode="numeric"
                required
              />
            </div>
          </div>

          <!-- Security -->
          <div>
            <h3 class="text-sm font-semibold text-secondary-700 uppercase tracking-wide mb-4">
              Security
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                v-model="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />
              <Input
                v-model="confirmPassword"
                type="password"
                label="Confirm Password"
                placeholder="••••••••"
                autocomplete="new-password"
                required
              />
            </div>
          </div>

          <div class="pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              :block="true"
              :loading="loading"
              :disabled="loading"
            >
              <i v-if="!loading" class="fa-solid fa-user-plus mr-2"></i>
              {{ loading ? 'Creating account...' : 'Create Account' }}
            </Button>
          </div>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-secondary-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-secondary-500">Already have an account?</span>
            </div>
          </div>

          <router-link
            to="/login"
            class="block text-center py-2.5 px-4 rounded-xl border-2 border-secondary-200 text-secondary-700 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 font-medium transition-all duration-200"
          >
            Sign in instead
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
