import path from 'node:path';
import { readFileSync } from 'node:fs';

import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

import { VitePWA } from 'vite-plugin-pwa';

const manifest: any = JSON.parse(readFileSync('./manifest.json', 'utf-8'));

export default {
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest
    })
  ],
  define: {
    APP_TYPE: `"${process.env.APP_SITE}"`
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};
