<script setup lang="ts">
defineProps({
  placeholder: String
});
</script>

<template>
  <input type="text" class="form-control" :placeholder="placeholder" :aria-label="placeholder" />
</template>

<style scoped lang="scss">
input.form-control {
  background: #e5e5e5;
  color: #193b4d;
  font-size: 14px;
  line-height: 21px;
  border-radius: 10px;
  height: 40px;

  &::placeholder {
    color: #9e9e9e;
    font-size: 14px;
    line-height: 21px;
    border-radius: 10px;
  }
}
</style>
