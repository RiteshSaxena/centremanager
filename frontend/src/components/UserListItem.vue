<script setup lang="ts">

</script>

<template>
  <div class="child-list-item d-flex align-items-center gap-3">
    <i class="fa-solid fa-user"></i>
    <div>
      <span class="name">Name</span>
      <span class="desc">Phone</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.child-list-item {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 10px 25px;
  margin-bottom: 10px;
  cursor: pointer;

  &:hover {
    background: #ffe08a;
  }

  .name,
  .desc {
    font-size: 12px;
    line-height: 18px;
    color: #193b4d;
    display: block;
  }
  .name {
    font-weight: 700;
  }
}
</style>
