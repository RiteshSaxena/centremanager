import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueToast, { POSITION } from 'vue-toastification';
import * as Sentry from '@sentry/vue';
import { AxiosError } from 'axios';

import App from './App.vue';
import router from './router';
import errorHandler from '@/utils/error-handler';

import './assets/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(VueToast, {
  position: POSITION.BOTTOM_CENTER,
  icon: false,
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: false,
  rtl: false
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
      Sentry.browserTracingIntegration({
        router
      }),
      Sentry.replayIntegration()
    ],
    tracePropagationTargets: ['localhost', regexApiUrl],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      const error = hint.originalException;
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data;
        const errorMessage =
          data.error?.message || data.message || data.data?.message || error.message;
        if (event.exception?.values?.[0]) {
          event.exception.values[0].value = `${error.response.status}: ${errorMessage}`;
        }
      }
      return event;
    }
  });
}

app.mount('#app');
