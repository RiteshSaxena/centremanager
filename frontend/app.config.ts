import { defineConfig } from 'vite';
import config from './base-app.config';

export default defineConfig({
  define: {
    APP_TYPE: JSON.stringify('app-main')
  },
  ...config
});
