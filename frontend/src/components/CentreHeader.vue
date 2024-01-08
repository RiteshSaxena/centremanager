<template>
  <div class="centre-name">
    <h1>{{ centre?.displayName || centre?.name }}</h1>
    <span>{{ date }}</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import moment from 'moment';

import { useUserStore } from '@/stores';

const userStore = useUserStore();

const centre = ref<any>(null);

const date = moment().format('DD MMMM, YYYY');

onMounted(async () => {
  const data = await userStore.getCentre();
  centre.value = data;
});
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
