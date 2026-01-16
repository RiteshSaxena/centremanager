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
    class="sidebar bg-gradient-to-b from-secondary-900 via-secondary-800 to-secondary-900 flex flex-col justify-between no-print shadow-xl"
    :class="[
      sidebarExpanded
        ? 'w-full md:w-64'
        : 'max-h-16 md:max-h-none overflow-hidden md:w-20'
    ]"
    :style="{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }"
  >
    <!-- Mobile Header -->
    <div class="flex justify-between items-center md:hidden border-b border-secondary-700">
      <div class="p-4">
        <h2 class="text-white text-sm font-bold leading-tight">
          {{ centre?.displayName || centre?.name }}
          <br />
          <small class="text-secondary-400 font-normal text-xs">{{ date }}</small>
        </h2>
      </div>
      <button
        class="p-5 text-white hover:bg-secondary-700/50 transition-colors duration-200"
        @click="sidebarExpanded = !sidebarExpanded"
      >
        <i v-if="!sidebarExpanded" class="fa-solid fa-bars text-xl"></i>
        <i v-else class="fa-solid fa-xmark text-xl"></i>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex flex-col flex-1 py-4 space-y-1" :class="sidebarExpanded ? 'px-3' : 'px-2 md:px-2'">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="sidebar-item group relative flex items-center rounded-xl transition-colors duration-200"
        :class="[
          route.path === item.to
            ? 'bg-primary-500 text-white shadow-lg'
            : 'text-secondary-300 hover:bg-secondary-700/50 hover:text-white',
          sidebarExpanded ? 'px-3 py-3 gap-3' : 'px-3 py-3 md:px-0 md:py-3 md:justify-center gap-3 md:gap-0'
        ]"
        @click="handleSidebarLinkClick"
      >
        <!-- Active indicator -->
        <div
          v-if="route.path === item.to"
          class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full transition-opacity duration-200"
        ></div>

        <!-- Icon -->
        <i
          :class="[
            'fa-solid',
            item.icon,
            'text-lg transition-transform duration-200',
            route.path === item.to ? 'scale-110' : 'group-hover:scale-110',
            sidebarExpanded ? '' : 'md:mx-auto'
          ]"
        ></i>

        <!-- Label -->
        <span
          class="whitespace-nowrap text-sm font-semibold overflow-hidden transition-all duration-300"
          :style="{
            maxWidth: sidebarExpanded ? '200px' : '0px',
            opacity: sidebarExpanded ? '1' : '0'
          }"
        >
          {{ item.label }}
        </span>

        <!-- Tooltip for collapsed state (desktop) -->
        <div
          v-if="!sidebarExpanded"
          class="hidden md:block absolute left-full ml-2 px-3 py-2 bg-secondary-800 text-white text-sm font-medium rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50"
        >
          {{ item.label }}
          <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-secondary-800"></div>
        </div>
      </router-link>
    </nav>

    <!-- Bottom actions -->
    <div class="flex flex-col py-3 border-t border-secondary-700 space-y-1" :class="sidebarExpanded ? 'px-3' : 'px-2 md:px-2'">
      <!-- Collapse button (desktop only) -->
      <button
        class="hidden md:flex group items-center rounded-xl text-secondary-300 hover:bg-secondary-700/50 hover:text-white transition-colors duration-200 w-full"
        :class="sidebarExpanded ? 'px-3 py-3 gap-3' : 'px-0 py-3 justify-center'"
        @click="sidebarExpanded = !sidebarExpanded"
      >
        <i
          :class="[
            'fa-solid text-lg transition-transform duration-200',
            sidebarExpanded ? 'fa-angles-left' : 'fa-angles-right',
            'group-hover:scale-110'
          ]"
        ></i>
        <span
          class="whitespace-nowrap text-sm font-semibold overflow-hidden transition-all duration-300"
          :style="{
            maxWidth: sidebarExpanded ? '200px' : '0px',
            opacity: sidebarExpanded ? '1' : '0'
          }"
        >
          Collapse
        </span>
      </button>

      <!-- Logout -->
      <button
        class="group flex items-center rounded-xl text-secondary-300 hover:bg-danger-600 hover:text-white transition-colors duration-200 w-full"
        :class="sidebarExpanded ? 'px-3 py-3 gap-3' : 'px-3 py-3 md:px-0 md:py-3 md:justify-center gap-3 md:gap-0'"
        @click="logout"
      >
        <i
          :class="[
            'fa-solid fa-right-from-bracket text-lg transition-transform duration-200 group-hover:scale-110',
            sidebarExpanded ? '' : 'md:mx-auto'
          ]"
        ></i>
        <span
          class="whitespace-nowrap text-sm font-semibold overflow-hidden transition-all duration-300"
          :style="{
            maxWidth: sidebarExpanded ? '200px' : '0px',
            opacity: sidebarExpanded ? '1' : '0'
          }"
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
