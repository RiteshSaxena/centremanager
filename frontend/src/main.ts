import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueToast, { POSITION } from 'vue-toastification';
import * as Sentry from '@sentry/vue';

import App from './App.vue';
import router from './router';
import errorHandler from '@/utils/error-handler';

import './assets/main.scss';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueToast, {
  position: POSITION.BOTTOM_CENTER,
  icon: false
});

app.config.errorHandler = (err: any) => {
  errorHandler(err);
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
