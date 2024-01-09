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
    <div class="d-flex justify-content-between" >
      <div :class='["p-3",sidebarExpanded?"":"d-md-none"]'>
        <h2 class="text-white mb-0 fs-6 fw-bold">Centre <br>Manager</h2>
      </div>
      <div class="d-flex d-md-none burger-menu justify-content-end">
        <div @click="sidebarExpanded = !sidebarExpanded">
          <svg v-if="!sidebarExpanded" xmlns="http://www.w3.org/2000/svg" width="31" height="22" viewBox="0 0 31 22">
            <g id="Group_661" data-name="Group 661" transform="translate(-336.265 -50)">
              <path id="Path_990" data-name="Path 990" d="M31,0H0" transform="translate(336.265 61)" fill="none" stroke="#fff" stroke-width="2"/>
              <line id="Line_94" data-name="Line 94" x1="31" transform="translate(336.265 71)" fill="none" stroke="#fff" stroke-width="2"/>
              <path id="Path_991" data-name="Path 991" d="M31,0H0" transform="translate(336.265 51)" fill="none" stroke="#fff" stroke-width="2"/>
            </g>
          </svg>

          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24.042" height="24.042" viewBox="0 0 24.042 24.042">
            <g id="Group_196" data-name="Group 196" transform="translate(-275.959 221.512) rotate(-45)">
              <line id="Line_93" data-name="Line 93" x1="31" transform="translate(336.265 55.5)" fill="none" stroke="#fff" stroke-width="2"/>
              <line id="Line_94" data-name="Line 94" y2="32" transform="translate(351.765 39.5)" fill="none" stroke="#fff" stroke-width="2"/>
            </g>
          </svg>

        </div>
      </div>
    </div>

    <div class="d-flex  flex-column" @click="sidebarExpanded = !sidebarExpanded">
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
    <div class="d-flex flex-column" @click="sidebarExpanded = !sidebarExpanded">
      <div class="sidebar-item d-none d-md-flex">
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
  width: 100%;
  transition: all 1s ease-in-out;
  a {
    text-align: center;
    text-decoration: none;
  }
  .burger-menu{
    padding: 20px;
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
  }
  @media(max-width: 767px) {
    &:not(.sidebar-expanded) {
      max-height: 64px;
      overflow: hidden;
    }
  }

  &.sidebar-expanded {
    min-width: 150px;
    
    .sidebar-item {
      span {
        visibility: visible;
      }
    }
  }
}

.router-link-active {
  background: #2d7298;
}

@media (min-width: 768px) {
  .sidebar {
    max-width: 64px;
    &-item{
      span {
        visibility: hidden;
        white-space: nowrap;
      }
    }
  }
}
</style>
