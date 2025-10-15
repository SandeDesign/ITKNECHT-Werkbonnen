import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-workers',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'public/service-worker.js'),
            resolve(__dirname, 'dist/service-worker.js')
          );
          copyFileSync(
            resolve(__dirname, 'public/firebase-messaging-sw.js'),
            resolve(__dirname, 'dist/firebase-messaging-sw.js')
          );
          console.log('✅ Service workers copied to dist folder');
        } catch (error) {
          console.error('❌ Error copying service workers:', error);
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  }
});
