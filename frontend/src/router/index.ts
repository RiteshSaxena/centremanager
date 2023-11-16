import { createRouter, createWebHistory } from 'vue-router';

import Dashboard from '@/views/Dashboard.vue';
import Calendar from '@/views/Calendar.vue';

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
    }
  ]
});

export default router;
