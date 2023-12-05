<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useUserStore } from '@/stores';

const sidebarExpanded = ref(false);

const router = useRouter();
const userStore = useUserStore();

const logout = async () => {
  userStore.logout();
  await router.push({ name: 'Login' });
};
</script>

<template>
  <div
    class="sidebar d-flex flex-column justify-content-between"
    :class="{ 'sidebar-expanded': sidebarExpanded }"
  >
    <div></div>
    <div class="d-flex flex-column">
      <router-link to="/" class="sidebar-item">
        <i class="fa-solid fa-house"></i>
        <span>Home</span>
      </router-link>
      <router-link to="/attendance" class="sidebar-item">
        <i class="fa-solid fa-calendar"></i>
        <span>Today</span>
      </router-link>
      <router-link to="/calendar" class="sidebar-item">
        <i class="fa-solid fa-calendar-week"></i>
        <span>Calendar</span>
      </router-link>
      <router-link to="/qr" class="sidebar-item">
        <i class="fa-solid fa-qrcode"></i>
        <span>QR Codes</span>
      </router-link>
      <router-link to="/upload" class="sidebar-item">
        <i class="fa-solid fa-upload"></i>
        <span>Upload</span>
      </router-link>
    </div>
    <div class="d-flex flex-column">
      <div class="sidebar-item" @click="sidebarExpanded = !sidebarExpanded">
        <i v-if="sidebarExpanded" class="fa-solid fa-angles-left"></i>
        <i v-else class="fa-solid fa-angles-right"></i>
        <span>Collapse</span>
      </div>
      <div class="sidebar-item" @click="logout">
        <i class="fa-solid fa-right-from-bracket"></i>
        <span>Logout</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar {
  background: #193b4d;
  min-width: 64px;
  height: 100vh;
  transition: all 0.3s ease-in-out;

  a {
    text-align: center;
    text-decoration: none;
  }

  .sidebar-item {
    color: white;
    padding: 20px;
    width: 100%;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 15px;
    &:hover {
      background: #2d7298;
    }

    i {
      font-size: 20px;
    }

    span {
      display: none;
    }
  }

  &.sidebar-expanded {
    min-width: 150px;

    .sidebar-item {
      span {
        display: inline-block;
      }
    }
  }
}

.router-link-active {
  background: #2d7298;
}
</style>
