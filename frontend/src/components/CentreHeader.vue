<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import moment from 'moment';
import { useUserStore } from '@/stores';
import { Button } from '@/components/ui';

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

<template>
  <header class="flex justify-between items-start mb-6">
    <div class="hidden md:block">
      <h1 class="text-xl font-bold text-primary-800 leading-tight">
        {{ centre?.displayName || centre?.name }}
      </h1>
      <span class="text-sm text-secondary-500">{{ date }}</span>
    </div>
    <div v-if="isKioskApp">
      <Button variant="secondary" size="sm" @click="logout">
        <i class="fa-solid fa-right-from-bracket"></i>
      </Button>
    </div>
  </header>
</template>
