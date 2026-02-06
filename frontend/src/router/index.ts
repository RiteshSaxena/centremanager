import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { getToken } from '@/utils/token';

import Dashboard from '@/views/Dashboard.vue';
import Calendar from '@/views/Calendar.vue';
import Attendance from '@/views/Attendance.vue';
import Upload from '@/views/Upload.vue';
import QrGenerator from '@/views/QrGenerator.vue';
import DashboardLayout from '@/layouts/DashboardLayout.vue';
import Login from '@/views/Login.vue';
import ZohoToken from '@/views/ZohoToken.vue';
import Register from '@/views/Register.vue';
import AttendanceReport from '@/views/AttendanceReport.vue';
import DashboardKiosk from '@/views/DashboardKiosk.vue';
import Payment from '@/views/Payment.vue';

// Admin views
import UsersManagement from '@/views/admin/UsersManagement.vue';
import StudentManagement from '@/views/admin/StudentManagement.vue';
import SlotsManagement from '@/views/admin/SlotsManagement.vue';
import CenterSettings from '@/views/admin/CenterSettings.vue';

const routes: RouteRecordRaw[] = [
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
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      guest: true,
      title: 'Register'
    }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'Dashboard',
      app: ['app-main']
    }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardKiosk,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'Dashboard',
      app: ['app-kiosk']
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'Calendar',
      app: ['app-main']
    }
  },
  {
    path: '/attendance',
    name: 'Attendance',
    component: Attendance,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'Attendance',
      app: ['app-main']
    }
  },
  {
    path: '/attendance-report',
    name: 'AttendanceReport',
    component: AttendanceReport,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'Attendance Report',
      app: ['app-main']
    }
  },
  {
    path: '/payments',
    name: 'Payment',
    component: Payment,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'Payments',
      app: ['app-main']
    }
  },
  {
    path: '/qr',
    name: 'QrGenerator',
    component: QrGenerator,
    meta: {
      auth: true,
      layout: DashboardLayout,
      title: 'QR Generator',
      app: ['app-main']
    }
  },
  {
    path: '/zoho-books/token',
    name: 'ZohoBooksToken',
    component: ZohoToken,
    meta: {
      auth: true,
      title: 'Zoho Books',
      app: ['app-main']
    }
  },
  // Admin routes
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: UsersManagement,
    meta: {
      auth: true,
      admin: true,
      layout: DashboardLayout,
      title: 'Users Management',
      app: ['app-main']
    }
  },
  {
    path: '/admin/students',
    name: 'AdminStudents',
    component: StudentManagement,
    meta: {
      auth: true,
      admin: true,
      layout: DashboardLayout,
      title: 'Student Management',
      app: ['app-main']
    }
  },
  {
    path: '/admin/slots',
    name: 'AdminSlots',
    component: SlotsManagement,
    meta: {
      auth: true,
      admin: true,
      layout: DashboardLayout,
      title: 'Slots Management',
      app: ['app-main']
    }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: CenterSettings,
    meta: {
      auth: true,
      admin: true,
      layout: DashboardLayout,
      title: 'Center Settings',
      app: ['app-main']
    }
  },
  {
    path: '/admin/upload',
    name: 'AdminUpload',
    component: Upload,
    meta: {
      auth: true,
      admin: true,
      layout: DashboardLayout,
      title: 'Upload',
      app: ['app-main']
    }
  }
];

const filteredRoutes = routes.filter((route) => {
  if (route.meta?.app) {
    return (route.meta.app as Array<string>).includes(APP_TYPE);
  }
  return true;
});

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: filteredRoutes
});

router.beforeEach(async (to, from, next) => {
  const isLoggedIn = !!getToken();
  if (to.matched.some((record) => record.meta.auth)) {
    if (!isLoggedIn) {
      next({ name: 'Login' });
    } else if (to.matched.some((record) => record.meta.admin)) {
      // Admin route - check user type
      // Import store dynamically to avoid circular dependencies
      const { userStore } = await import('@/stores/user');
      const store = userStore();

      // Ensure user is loaded
      if (!store.user) {
        await store.fetchMe();
      }

      if (store.user?.type === 'admin') {
        next();
      } else {
        // Redirect non-admin users to dashboard
        next({ name: 'Dashboard' });
      }
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
