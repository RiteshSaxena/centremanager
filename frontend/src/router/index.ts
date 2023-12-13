import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '@/utils/token';

import Dashboard from '@/views/Dashboard.vue';
import Calendar from '@/views/Calendar.vue';
import Attendance from '@/views/Attendance.vue';
import Upload from '@/views/Upload.vue';
import QrGenerator from '@/views/QrGenerator.vue';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import Login from '@/views/Login.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        guest: true,
        title: 'Login'
      }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
      meta: {
        auth: true,
        layout: DashboardLayout,
        title: 'Dashboard'
      }
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: Calendar,
      meta: {
        auth: true,
        layout: DashboardLayout,
        title: 'Calendar'
      }
    },
    {
      path: '/attendance',
      name: 'Attendance',
      component: Attendance,
      meta: {
        auth: true,
        layout: DashboardLayout,
        title: 'Attendance'
      }
    },
    {
      path: '/qr',
      name: 'QrGenerator',
      component: QrGenerator,
      meta: {
        auth: true,
        layout: DashboardLayout,
        title: 'QR Generator'
      }
    },
    {
      path: '/upload',
      name: 'Upload',
      component: Upload,
      meta: {
        auth: true,
        layout: DashboardLayout,
        title: 'Upload'
      }
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const isLoggedIn = !!getToken();
  if (to.matched.some((record) => record.meta.auth)) {
    if (!isLoggedIn) {
      next({ name: 'Login' });
    } else {
      next();
    }
  } else if (to.matched.some((record) => record.meta.guest)) {
    if (isLoggedIn) {
      next({ name: 'Dashboard' });
    } else {
      next();
    }
  } else {
    next();
  }
});

const appTitle = 'Centre Manager';

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | ${appTitle}` : appTitle;
});

export default router;
