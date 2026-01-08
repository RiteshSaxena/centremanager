<script setup lang="ts">
import { ref } from 'vue';
import axios from '@/axios';
import { Button, Input, Spinner } from '@/components/ui';

import errorHandler from '@/utils/error-handler';

const clientId = ref('');
const clientSecret = ref('');
const grantCode = ref('');
const domain = ref('');

const accessToken = ref('');
const refreshToken = ref('');

const loading = ref(false);

const reset = () => {
  clientId.value = '';
  clientSecret.value = '';
  grantCode.value = '';
  domain.value = '';
  accessToken.value = '';
  refreshToken.value = '';
};

const generateToken = async () => {
  try {
    loading.value = true;

    const res = await axios.post('/zoho-books/token', {
      code: grantCode.value,
      clientId: clientId.value,
      clientSecret: clientSecret.value,
      domain: domain.value
    });
    accessToken.value = res.data.access_token;
    refreshToken.value = res.data.refresh_token;
  } catch (err) {
    errorHandler(err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="w-full min-h-screen flex justify-center items-center bg-secondary-100">
    <div class="w-[450px] p-8 rounded-2xl shadow-lg bg-white">
      <h3 class="text-xl font-bold text-secondary-900 mb-6">Zoho Token Generate</h3>
      <form @submit.prevent="generateToken" v-if="!accessToken" class="space-y-4">
        <Input
          v-model="clientId"
          label="Client ID"
          required
        />
        <Input
          v-model="clientSecret"
          label="Client Secret"
          required
        />
        <div>
          <Input
            v-model="grantCode"
            label="Grant Code"
            required
          />
          <p class="text-xs text-secondary-500 mt-1">OAuth Scope: ZohoBooks.contacts.READ</p>
        </div>
        <div>
          <Input
            v-model="domain"
            label="Domain"
            required
          />
          <p class="text-xs text-secondary-500 mt-1">Can be: com, in, eu, com.au, jp</p>
        </div>
        <Button type="submit" :disabled="loading">
          Generate
          <Spinner v-if="loading" size="sm" class="ml-2" />
        </Button>
      </form>
      <div v-else class="space-y-4">
        <p class="text-lg">
          Access Token: <span class="text-secondary-500 break-all">{{ accessToken }}</span>
        </p>
        <p class="text-lg">
          Refresh Token: <span class="text-secondary-500 break-all">{{ refreshToken }}</span>
        </p>
        <Button @click="reset">Done</Button>
      </div>
    </div>
  </div>
</template>
