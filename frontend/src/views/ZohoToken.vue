<script setup lang="ts">
import { ref } from 'vue';
import axios from '@/axios';

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
  <div class="w-100 vh-100 d-flex justify-content-center align-items-center">
    <div class="login-card rounded shadow bg-white">
      <h3 class="mb-4">Zoho Token Generate</h3>
      <form @submit.prevent="generateToken" v-if="!accessToken">
        <div class="mb-3">
          <label class="form-label">Client ID</label>
          <input type="text" class="form-control" v-model="clientId" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Client Secret</label>
          <input type="text" class="form-control" v-model="clientSecret" required />
        </div>
        <div class="mb-3">
          <label class="form-label">Grant Code</label>
          <input type="text" class="form-control" v-model="grantCode" required />
          <div class="form-text">OAuth Scope: ZohoBooks.contacts.READ</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Domain</label>
          <input type="text" class="form-control" v-model="domain" required />
          <div class="form-text">Can be: com, in, eu, com.au, jp</div>
        </div>
        <button type="submit" class="btn px-4 btn-info" :disabled="loading">
          Generate
          <span v-if="loading" class="spinner-border spinner-border-sm ms-2"></span>
        </button>
      </form>
      <div v-else>
        <p class="lead">
          Access Token: <span class="text-muted text-break">{{ accessToken }}</span>
        </p>
        <p class="lead">
          Refresh Token: <span class="text-muted text-break">{{ refreshToken }}</span>
        </p>
        <button type="button" class="btn px-4 btn-info" @click="reset">Done</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-card {
  width: 450px;
  padding: 30px;
}
</style>
