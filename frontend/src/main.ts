import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueToast, { POSITION, useToast } from 'vue-toastification';
import * as Sentry from '@sentry/vue';

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
  console.error(err);
  if (err?.response?.data?.error?.message) {
    toast.error(err.response.data.error.message);
  } else {
    toast.error(err.message);
  }
};

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  let sentryEnv = 'staging';

  if (window.location.hostname === 'app.centre-manager.com') {
    sentryEnv = 'production';
  } else if (window.location.hostname === 'localhost') {
    sentryEnv = 'development';
  }

  Sentry.init({
    app,
    environment: sentryEnv,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router)
      })
    ],
    tracePropagationTargets: ['localhost', import.meta.env.VITE_BASE_API_URL],
    tracesSampleRate: 1.0
  });
}

app.mount('#app');
