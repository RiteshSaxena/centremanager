/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API_URL: string;
  readonly VITE_SENTRY_DSN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const APP_TYPE: 'app-main' | 'app-kiosk';
