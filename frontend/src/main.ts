import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueToast, { POSITION, useToast } from 'vue-toastification';

import App from './App.vue';
import router from './router';

import './assets/main.scss';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueToast, {
  position: POSITION.BOTTOM_CENTER,
  icon: false
});

const toast = useToast();

app.config.errorHandler = (err: any) => {
  if (err?.response?.data?.error?.message) {
    toast.error(err.response.data.error.message);
  } else {
    toast.error(err.message);
  }
};

app.mount('#app');
