<template>
  <div class="d-flex justify-content-between">
    <div class="centre-name">
      <h1>{{ centre?.displayName || centre?.name }}</h1>
      <span>{{ date }}</span>
    </div>
    <div v-if="isKioskApp">
      <button type="button" class="btn btn-secondary" @click="logout">
        <i class="fa-solid fa-right-from-bracket"></i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import moment from 'moment';

import { useUserStore } from '@/stores';

const router = useRouter();
const userStore = useUserStore();

const centre = ref<any>(null);

const date = moment().format('DD MMMM, YYYY');

const isKioskApp = APP_TYPE === 'app-kiosk';

onMounted(async () => {
  const data = await userStore.getCentre();
  centre.value = data;
});

const logout = async () => {
  const confirmed = window.confirm('Are you sure you want to logout?');
  if (!confirmed) return;
  userStore.logout();
  await router.push({ name: 'Login' });
};
</script>
<style scoped lang="scss">
.centre-name {
  h1 {
    color: #193b4d;
    font-size: 20px;
    line-height: 30px;
    font-weight: 700;
    margin-bottom: 0;
  }
  span {
    color: #193b4d;
    font-size: 14px;
    line-height: 21px;
  }
}
</style>
