import { createRouter, createWebHistory } from 'vue-router';

import Dashboard from '@/views/Dashboard.vue';
import Calendar from '@/views/Calendar.vue';
import Attendance from '@/views/Attendance.vue';
import Upload from '@/views/Upload.vue';
import QrGenerator from '@/views/QrGenerator.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: Calendar
    },
    {
      path: '/attendance',
      name: 'Attendance',
      component: Attendance
    },
    {
      path: '/qr',
      name: 'QrGenerator',
      component: QrGenerator
    },
    {
      path: '/upload',
      name: 'Upload',
      component: Upload
    }
  ]
});

export default router;
