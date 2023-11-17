<script setup lang='ts'>
</script>

<template>
  <div class="sidebar d-flex flex-column justify-content-between align-items-center">
    <div></div>
    <div class="d-flex flex-column">
      <router-link to="/">
        <i class="fa-solid fa-house"></i>
      </router-link>
      <router-link to="/attendance">
        <i class="fa-solid fa-calendar"></i>
      </router-link>
      <router-link to="/calendar">
        <i class="fa-solid fa-calendar-week"></i>
      </router-link>
      <router-link to="/upload">
        <i class="fa-solid fa-upload"></i>
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
  min-width: 64px;
  height: 100vh;

  a {
    text-align: center;
  }
}
i {
  color: white;
  font-size: 20px;
  padding: 20px;
  width: 100%;
  cursor: pointer;
  &:hover {
    background: #2d7298;
  }
}

.router-link-active {
  background: #2d7298;
}
</style>
