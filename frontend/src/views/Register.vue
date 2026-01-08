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
    class="min-h-screen w-full px-4 py-8 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-100"
  >
    <div class="w-full max-w-2xl">
      <Card>
        <template #header>
          <h1 class="text-xl font-bold text-secondary-900">Create Account</h1>
          <p class="text-sm text-secondary-500 mt-1">Register your centre</p>
        </template>

        <form @submit.prevent="register" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              v-model="email"
              type="email"
              label="Email Address"
              placeholder="Enter email"
              autocomplete="email"
              required
            />
            <Input
              v-model="phoneNumber"
              type="tel"
              label="Phone Number"
              placeholder="Enter phone number"
              inputmode="numeric"
              required
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              v-model="password"
              type="password"
              label="Password"
              placeholder="Create password"
              autocomplete="new-password"
              required
            />
            <Input
              v-model="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Confirm password"
              autocomplete="new-password"
              required
            />
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p class="text-sm text-secondary-500 order-2 sm:order-1">
              Already have an account?
              <router-link to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
                Sign In
              </router-link>
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              :loading="loading"
              class="order-1 sm:order-2 w-full sm:w-auto"
            >
              Register
            </Button>
          </div>
        </form>
      </Card>
    </div>
  </div>
</template>
