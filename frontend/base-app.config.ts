import path from 'node:path';
import { readFileSync } from 'node:fs';

import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

const manifest: any = JSON.parse(readFileSync('./manifest.json', 'utf-8'));

export default {
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
};
