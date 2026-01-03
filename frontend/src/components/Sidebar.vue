<script setup lang="ts">
import { computed } from 'vue';

import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import moment from 'moment';

import { useUserStore } from '@/stores';
const centre = ref<any>(null);

const sidebarExpanded = ref(false);

const router = useRouter();
const userStore = useUserStore();
const route = useRoute();
const isHomePage = computed(() => route.path === '/');
const isMainApp = APP_TYPE === 'app-main';

const logout = async () => {
  const confirmed = window.confirm('Are you sure you want to logout?');
  if (!confirmed) return;
  userStore.logout();
  await router.push({ name: 'Login' });
};
const date = moment().format('DD MMMM, YYYY');

const handleSidebarLinkClick = () => {
  sidebarExpanded.value = false;
};

onMounted(async () => {
  const data = await userStore.getCentre();
  centre.value = data;
});
</script>

<template>
  <div
    class="sidebar d-flex flex-column justify-content-between"
    :class="{ 'sidebar-expanded': sidebarExpanded }"
  >
    <div class="d-flex justify-content-between">
      <div :class="['p-3 p-md-0 d-md-none']">
        <h2 v-if="isHomePage" class="text-white mb-0 fs-6 fw-bold">
          {{ centre?.displayName || centre?.name }}<br /><small>{{ date }}</small>
        </h2>
      </div>
      <div class="d-flex d-md-none burger-menu justify-content-end">
        <div @click="sidebarExpanded = !sidebarExpanded">
          <svg
            v-if="!sidebarExpanded"
            xmlns="http://www.w3.org/2000/svg"
            width="31"
            height="22"
            viewBox="0 0 31 22"
          >
            <g id="Group_661" data-name="Group 661" transform="translate(-336.265 -50)">
              <path
                id="Path_990"
                data-name="Path 990"
                d="M31,0H0"
                transform="translate(336.265 61)"
                fill="none"
                stroke="#fff"
                stroke-width="2"
              />
              <line
                id="Line_94"
                data-name="Line 94"
                x1="31"
                transform="translate(336.265 71)"
                fill="none"
                stroke="#fff"
                stroke-width="2"
              />
              <path
                id="Path_991"
                data-name="Path 991"
                d="M31,0H0"
                transform="translate(336.265 51)"
                fill="none"
                stroke="#fff"
                stroke-width="2"
              />
            </g>
          </svg>

          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24.042"
            height="24.042"
            viewBox="0 0 24.042 24.042"
          >
            <g
              id="Group_196"
              data-name="Group 196"
              transform="translate(-275.959 221.512) rotate(-45)"
            >
              <line
                id="Line_93"
                data-name="Line 93"
                x1="31"
                transform="translate(336.265 55.5)"
                fill="none"
                stroke="#fff"
                stroke-width="2"
              />
              <line
                id="Line_94"
                data-name="Line 94"
                y2="32"
                transform="translate(351.765 39.5)"
                fill="none"
                stroke="#fff"
                stroke-width="2"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>

    <div class="d-flex flex-column">
      <router-link to="/" class="sidebar-item" @click="handleSidebarLinkClick">
        <i class="fa-solid fa-house"></i>
        <span>Home</span>
      </router-link>
      <router-link
        v-if="isMainApp"
        to="/attendance"
        class="sidebar-item"
        @click="handleSidebarLinkClick"
      >
        <i class="fa-solid fa-calendar"></i>
        <span>Today</span>
      </router-link>
      <router-link
        v-if="isMainApp"
        to="/calendar"
        class="sidebar-item"
        @click="handleSidebarLinkClick"
      >
        <i class="fa-solid fa-calendar-week"></i>
        <span>Calendar</span>
      </router-link>
      <router-link
        v-if="isMainApp"
        to="/attendance-report"
        class="sidebar-item"
        @click="handleSidebarLinkClick"
      >
        <i class="fa-solid fa-clipboard-user"></i>
        <span>Attendance</span>
      </router-link>
      <router-link
        v-if="isMainApp"
        to="/payments"
        class="sidebar-item"
        @click="handleSidebarLinkClick"
      >
        <i class="fa-solid fa-money-check-dollar"></i>
        <span>Payments</span>
      </router-link>
      <router-link v-if="isMainApp" to="/qr" class="sidebar-item" @click="handleSidebarLinkClick">
        <i class="fa-solid fa-qrcode"></i>
        <span>QR Codes</span>
      </router-link>
      <router-link
        v-if="isMainApp"
        to="/upload"
        class="sidebar-item"
        @click="handleSidebarLinkClick"
      >
        <i class="fa-solid fa-upload"></i>
        <span>Upload</span>
      </router-link>
    </div>
    <div class="d-flex flex-column">
      <div class="sidebar-item d-none d-md-flex" @click="sidebarExpanded = !sidebarExpanded">
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
  transition: all 0.2s ease;
  a {
    text-align: center;
    text-decoration: none;
  }
  .burger-menu {
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

  &.sidebar-expanded {
    width: 220px;

    .sidebar-item {
      span {
        visibility: visible;
      }
    }
  }

  @media (max-width: 767px) {
    &.sidebar-expanded {
      width: 100%;
    }
    &:not(.sidebar-expanded) {
      max-height: 64px;
      overflow: hidden;
    }
  }
}

.router-link-active {
  background: #2d7298;
}

@media (min-width: 768px) {
  .sidebar {
    width: 64px;
    &-item {
      span {
        visibility: hidden;
        white-space: nowrap;
      }
    }
  }
}
</style>
