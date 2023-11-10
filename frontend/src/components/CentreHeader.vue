<template>
  <div class="centre-name">
    <h1>Hayes Study Centre</h1>
    <span>{{ date }}</span>
  </div>
</template>

<script setup lang="ts">
import moment from 'moment';
const date = moment().format('DD MMMM, YYYY');
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
