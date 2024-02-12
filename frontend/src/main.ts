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
  let sentryEnv = '';

  if (window.location.hostname === 'localhost') {
    sentryEnv = 'development';
  } else if (window.location.hostname.includes('.stage')) {
    sentryEnv = 'staging';
  } else {
    sentryEnv = 'production';
  }

  const regexApiUrl = new RegExp(
    '^' + import.meta.env.VITE_BASE_API_URL.replace(/\//g, '\\/').replace(/\./g, '\\.')
  );

  Sentry.init({
    app,
    environment: sentryEnv,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router)
      }),
      new Sentry.Replay()
    ],
    tracePropagationTargets: ['localhost', regexApiUrl],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  });
}

app.mount('#app');
