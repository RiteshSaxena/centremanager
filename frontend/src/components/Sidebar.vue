<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
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

const navItems = computed(() => {
  const items = [
    { to: '/', icon: 'fa-house', label: 'Home', show: true },
    { to: '/attendance', icon: 'fa-calendar', label: 'Today', show: isMainApp },
    { to: '/calendar', icon: 'fa-calendar-week', label: 'Calendar', show: isMainApp },
    { to: '/attendance-report', icon: 'fa-clipboard-user', label: 'Attendance', show: isMainApp },
    { to: '/payments', icon: 'fa-money-check-dollar', label: 'Payments', show: isMainApp },
    { to: '/qr', icon: 'fa-qrcode', label: 'QR Codes', show: isMainApp },
    { to: '/upload', icon: 'fa-upload', label: 'Upload', show: isMainApp }
  ];
  return items.filter((item) => item.show);
});

onMounted(async () => {
  const data = await userStore.getCentre();
  centre.value = data;
});
</script>

<template>
  <aside
    class="sidebar bg-primary-800 flex flex-col justify-between transition-all duration-300 ease-in-out no-print"
    :class="[
      sidebarExpanded ? 'w-full md:w-56' : 'max-h-16 md:max-h-none overflow-hidden md:overflow-visible md:w-16',
    ]"
  >
    <!-- Mobile Header -->
    <div class="flex justify-between items-center md:hidden">
      <div class="p-4">
        <h2 v-if="isHomePage" class="text-white text-sm font-bold leading-tight">
          {{ centre?.displayName || centre?.name }}
          <br />
          <small class="text-primary-300 font-normal text-xs">{{ date }}</small>
        </h2>
      </div>
      <button
        class="p-5 text-white hover:bg-primary-700 transition-colors"
        @click="sidebarExpanded = !sidebarExpanded"
      >
        <!-- Hamburger icon -->
        <svg
          v-if="!sidebarExpanded"
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <!-- Close icon -->
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex flex-col flex-1">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar-item flex items-center gap-4 px-5 py-4 text-white hover:bg-primary-600 transition-colors"
        :class="{ 'bg-primary-600': route.path === item.to }"
        @click="handleSidebarLinkClick"
      >
        <i :class="['fa-solid', item.icon, 'text-lg w-5 text-center']"></i>
        <span
          class="whitespace-nowrap text-sm font-medium"
          :class="[sidebarExpanded ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:inline']"
        >
          {{ item.label }}
        </span>
      </router-link>
    </nav>

    <!-- Bottom actions -->
    <div class="flex flex-col border-t border-primary-700">
      <!-- Collapse button (desktop only) -->
      <button
        class="hidden md:flex items-center gap-4 px-5 py-4 text-white hover:bg-primary-600 transition-colors w-full"
        @click="sidebarExpanded = !sidebarExpanded"
      >
        <i
          :class="[
            'fa-solid text-lg w-5 text-center',
            sidebarExpanded ? 'fa-angles-left' : 'fa-angles-right'
          ]"
        ></i>
        <span
          class="whitespace-nowrap text-sm font-medium"
          :class="[sidebarExpanded ? 'opacity-100' : 'opacity-0']"
        >
          Collapse
        </span>
      </button>
      <!-- Logout -->
      <button
        class="flex items-center gap-4 px-5 py-4 text-white hover:bg-danger-500 transition-colors w-full"
        @click="logout"
      >
        <i class="fa-solid fa-right-from-bracket text-lg w-5 text-center"></i>
        <span
          class="whitespace-nowrap text-sm font-medium"
          :class="[sidebarExpanded ? 'opacity-100' : 'opacity-0 md:opacity-0 hidden md:inline']"
        >
          Logout
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Desktop: Fixed sidebar */
@media (min-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 30;
  }
}

/* Mobile: Sticky header */
@media (max-width: 767px) {
  .sidebar {
    min-height: auto;
    position: sticky;
    top: 0;
    z-index: 40;
  }
}
</style>
