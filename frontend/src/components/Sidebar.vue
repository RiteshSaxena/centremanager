<script setup lang="ts"></script>

<template>
  <div class="sidebar d-flex flex-column justify-content-between">
    <div class="d-flex flex-column">
      <router-link to="/">
        <i class="fa-solid fa-house"></i>
      </router-link>
      <router-link to="/calendar">
        <i class="fa-solid fa-calendar"></i>
      </router-link>
    </div>
    <div class="d-flex flex-column">
      <i class="fa-solid fa-angles-right"></i>
      <i class="fa-solid fa-gear"></i>
      <i class="fa-solid fa-right-from-bracket"></i>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar {
  background: #193b4d;
  min-width: 50px;
  height: 100vh;
}
i {
  color: white;
  font-size: 20px;
  padding: 20px;
  cursor: pointer;
  &:hover {
    background: #64b6e6;
  }
}
</style>
